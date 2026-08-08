import type { Row } from "read-excel-file/node";

const MAX_DATABASE_INT = 2_147_483_647;
const ALLOWED_GENDERS = new Set(["دخترانه", "پسرانه", "یونیسکس"]);

export const PRODUCT_IMPORT_FIELDS = [
  "name",
  "slug",
  "price",
  "stock",
  "category",
  "ageGroup",
  "gender",
  "description",
] as const;

export type ProductImportField = (typeof PRODUCT_IMPORT_FIELDS)[number];
export type DuplicatePolicy = "skip" | "update";

export type ProductImportData = {
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  ageGroup: string;
  gender: string;
  stock: number;
};

export type ProductImportIssue = {
  row: number;
  field?: ProductImportField;
  message: string;
};

export type ParsedProductImportRow = {
  row: number;
  data: ProductImportData;
};

type ParsedProductSheet = {
  rows: ParsedProductImportRow[];
  issues: ProductImportIssue[];
  totalDataRows: number;
};

const FIELD_LABELS: Record<ProductImportField, string> = {
  name: "نام",
  slug: "اسلاگ",
  price: "قیمت (تومان)",
  stock: "موجودی",
  category: "دسته",
  ageGroup: "گروه سنی",
  gender: "جنسیت",
  description: "توضیحات",
};

const REQUIRED_FIELDS: ProductImportField[] = [
  "name",
  "price",
  "category",
  "ageGroup",
  "gender",
  "description",
];

const HEADER_ALIASES: Record<ProductImportField, string[]> = {
  name: [
    "name",
    "title",
    "product name",
    "product_name",
    "نام",
    "نام محصول",
    "عنوان",
    "عنوان محصول",
    "عنوان کالا",
  ],
  slug: ["slug", "اسلاگ", "نامک"],
  price: [
    "price",
    "sale price",
    "sale_price",
    "selling price",
    "selling_price",
    "قیمت",
    "قیمت تومان",
    "قیمت (تومان)",
  ],
  stock: [
    "stock",
    "inventory",
    "quantity",
    "qty",
    "موجودی",
    "تعداد",
  ],
  category: [
    "category",
    "category name",
    "category_name",
    "دسته",
    "دسته بندی",
    "دسته‌بندی",
  ],
  ageGroup: ["age group", "age_group", "agegroup", "گروه سنی"],
  gender: ["gender", "جنسیت"],
  description: [
    "description",
    "product description",
    "product_description",
    "توضیحات",
    "توضیح",
    "شرح",
  ],
};

const ALIAS_TO_FIELD = new Map<string, ProductImportField>(
  PRODUCT_IMPORT_FIELDS.flatMap((field) =>
    HEADER_ALIASES[field].map((alias) => [normalizeHeader(alias), field]),
  ),
);

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function normalizeDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persianIndex = PERSIAN_DIGITS.indexOf(digit);
    if (persianIndex >= 0) return String(persianIndex);
    return String(ARABIC_DIGITS.indexOf(digit));
  });
}

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u200c\u200e\u200f]/g, " ")
    .replace(/[_-]+/g, " ")
    .replace(/[()（）]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function cellToString(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return "";
  return String(value).trim();
}

function isEmptyRow(row: Row): boolean {
  return row.every((cell) => cellToString(cell) === "");
}

function findHeaderRow(rows: Row[]): {
  rowIndex: number;
  columns: Map<ProductImportField, number>;
} | null {
  let best:
    | { rowIndex: number; columns: Map<ProductImportField, number> }
    | null = null;

  for (let rowIndex = 0; rowIndex < Math.min(rows.length, 10); rowIndex += 1) {
    const columns = new Map<ProductImportField, number>();
    rows[rowIndex].forEach((cell, columnIndex) => {
      const field = ALIAS_TO_FIELD.get(normalizeHeader(cell));
      if (field && !columns.has(field)) columns.set(field, columnIndex);
    });

    if (!best || columns.size > best.columns.size) {
      best = { rowIndex, columns };
    }
  }

  return best && best.columns.size > 0 ? best : null;
}

function parseInteger(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.round(value) : null;
  }

  const normalized = normalizeDigits(cellToString(value))
    .replace(/[٬،,\s]/g, "")
    .replace(/تومان/gi, "");
  if (!normalized || !/^-?\d+(?:\.\d+)?$/.test(normalized)) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function normalizeGender(value: string): string {
  const normalized = normalizeHeader(value);
  if (["دخترانه", "زنانه", "female", "girl", "girls"].includes(normalized)) {
    return "دخترانه";
  }
  if (["پسرانه", "مردانه", "male", "boy", "boys"].includes(normalized)) {
    return "پسرانه";
  }
  if (["یونیسکس", "مشترک", "unisex", "all"].includes(normalized)) {
    return "یونیسکس";
  }
  return value.trim();
}

export function slugifyProduct(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function addTextIssue(
  issues: ProductImportIssue[],
  row: number,
  field: ProductImportField,
  value: string,
  maxLength: number,
) {
  if (!value) {
    issues.push({ row, field, message: `${FIELD_LABELS[field]} خالی است` });
  } else if (value.length > maxLength) {
    issues.push({
      row,
      field,
      message: `${FIELD_LABELS[field]} بیشتر از ${maxLength.toLocaleString("fa-IR")} نویسه است`,
    });
  }
}

export function parseProductImportSheet(sheetRows: Row[]): ParsedProductSheet {
  const header = findHeaderRow(sheetRows);
  if (!header) {
    return {
      rows: [],
      totalDataRows: 0,
      issues: [{ row: 1, message: "ردیف عنوان ستون‌ها پیدا نشد" }],
    };
  }

  const missingFields = REQUIRED_FIELDS.filter(
    (field) => !header.columns.has(field),
  );
  if (missingFields.length > 0) {
    return {
      rows: [],
      totalDataRows: 0,
      issues: [
        {
          row: header.rowIndex + 1,
          message: `ستون‌های الزامی پیدا نشد: ${missingFields
            .map((field) => FIELD_LABELS[field])
            .join("، ")}`,
        },
      ],
    };
  }

  const dataRows = sheetRows
    .slice(header.rowIndex + 1)
    .map((row, offset) => ({ row, rowNumber: header.rowIndex + offset + 2 }))
    .filter(({ row }) => !isEmptyRow(row));

  const parsedRows: ParsedProductImportRow[] = [];
  const issues: ProductImportIssue[] = [];
  const seenSlugs = new Map<string, number>();

  for (const { row, rowNumber } of dataRows) {
    const getCell = (field: ProductImportField) => {
      const column = header.columns.get(field);
      return column == null ? null : row[column];
    };

    const rowIssues: ProductImportIssue[] = [];
    const name = cellToString(getCell("name"));
    const description = cellToString(getCell("description"));
    const category = cellToString(getCell("category"));
    const ageGroup = cellToString(getCell("ageGroup"));
    const gender = normalizeGender(cellToString(getCell("gender")));
    const price = parseInteger(getCell("price"));
    const stockCell = getCell("stock");
    const stock = cellToString(stockCell) === "" ? 0 : parseInteger(stockCell);
    const suppliedSlug = cellToString(getCell("slug"));
    const slug = slugifyProduct(suppliedSlug || name) || `product-${rowNumber}`;

    addTextIssue(rowIssues, rowNumber, "name", name, 200);
    addTextIssue(rowIssues, rowNumber, "description", description, 5_000);
    addTextIssue(rowIssues, rowNumber, "category", category, 100);
    addTextIssue(rowIssues, rowNumber, "ageGroup", ageGroup, 100);
    addTextIssue(rowIssues, rowNumber, "gender", gender, 50);

    if (gender && !ALLOWED_GENDERS.has(gender)) {
      rowIssues.push({
        row: rowNumber,
        field: "gender",
        message: "جنسیت باید دخترانه، پسرانه یا یونیسکس باشد",
      });
    }

    if (price == null || price < 0 || price > MAX_DATABASE_INT) {
      rowIssues.push({
        row: rowNumber,
        field: "price",
        message: "قیمت باید عدد صحیحِ صفر یا بیشتر و در محدوده مجاز باشد",
      });
    }
    if (stock == null || stock < 0 || stock > MAX_DATABASE_INT) {
      rowIssues.push({
        row: rowNumber,
        field: "stock",
        message: "موجودی باید عدد صحیحِ صفر یا بیشتر و در محدوده مجاز باشد",
      });
    }
    const duplicateRow = seenSlugs.get(slug);
    if (duplicateRow != null) {
      rowIssues.push({
        row: rowNumber,
        field: "slug",
        message: `اسلاگ با ردیف ${duplicateRow.toLocaleString("fa-IR")} تکراری است`,
      });
    } else {
      seenSlugs.set(slug, rowNumber);
    }

    if (rowIssues.length > 0) {
      issues.push(...rowIssues);
      continue;
    }

    parsedRows.push({
      row: rowNumber,
      data: {
        name,
        slug,
        description,
        price: price as number,
        category,
        ageGroup,
        gender,
        stock: stock as number,
      },
    });
  }

  return { rows: parsedRows, issues, totalDataRows: dataRows.length };
}
