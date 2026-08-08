import { NextResponse } from "next/server";
import { readSheet } from "read-excel-file/node";
import { isAdminAuthenticated } from "@/lib/admin";
import {
  type DuplicatePolicy,
  parseProductImportSheet,
} from "@/lib/product-import";
import { PRODUCT_IMAGE_PLACEHOLDER } from "@/lib/product-images";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// These generous limits apply to the expanded ZIP structure, not the uploaded
// XLSX file size. They protect the server against ZIP bombs and malformed files.
const MAX_ARCHIVE_BYTES = 512 * 1024 * 1024;
const MAX_ARCHIVE_ENTRY_BYTES = 256 * 1024 * 1024;
const MAX_ARCHIVE_ENTRIES = 10_000;
const PREVIEW_ROW_LIMIT = 100;

type ImportMode = "preview" | "commit";
type ImportAction = "create" | "update" | "skip";

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function validateArchive(buffer: Buffer): string | null {
  if (buffer.length < 22 || buffer.readUInt16LE(0) !== 0x4b50) {
    return "فایل انتخاب‌شده یک فایل XLSX معتبر نیست";
  }

  const minimumEocdOffset = Math.max(0, buffer.length - 65_557);
  let eocdOffset = -1;
  for (let offset = buffer.length - 22; offset >= minimumEocdOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      eocdOffset = offset;
      break;
    }
  }

  if (eocdOffset < 0) return "ساختار داخلی فایل XLSX معتبر نیست";

  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const directorySize = buffer.readUInt32LE(eocdOffset + 12);
  const directoryOffset = buffer.readUInt32LE(eocdOffset + 16);

  if (
    entryCount === 0 ||
    entryCount > MAX_ARCHIVE_ENTRIES ||
    directoryOffset + directorySize > buffer.length
  ) {
    return "ساختار یا حجم داخلی فایل XLSX مجاز نیست";
  }

  let offset = directoryOffset;
  let totalUncompressedBytes = 0;

  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== 0x02014b50) {
      return "ساختار داخلی فایل XLSX معتبر نیست";
    }

    const flags = buffer.readUInt16LE(offset + 8);
    const uncompressedBytes = buffer.readUInt32LE(offset + 24);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);

    if ((flags & 1) !== 0) return "فایل XLSX رمزگذاری‌شده پشتیبانی نمی‌شود";
    if (uncompressedBytes === 0xffffffff) {
      return "فایل‌های XLSX با ساختار Zip64 پشتیبانی نمی‌شوند";
    }
    if (uncompressedBytes > MAX_ARCHIVE_ENTRY_BYTES) {
      return "یکی از بخش‌های داخلی فایل XLSX بیش از حد بزرگ است";
    }

    totalUncompressedBytes += uncompressedBytes;
    if (totalUncompressedBytes > MAX_ARCHIVE_BYTES) {
      return "حجم بازشده فایل XLSX بیش از حد مجاز است";
    }

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return null;
}

async function findExistingSlugs(slugs: string[]): Promise<Set<string>> {
  const existing = new Set<string>();

  for (let offset = 0; offset < slugs.length; offset += 400) {
    const products = await prisma.product.findMany({
      where: { slug: { in: slugs.slice(offset, offset + 400) } },
      select: { slug: true },
    });
    products.forEach((product) => existing.add(product.slug));
  }

  return existing;
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return errorResponse("Unauthorized", 401);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("درخواست ورود محصولات معتبر نیست", 400);
  }

  const file = formData.get("file");
  const mode = formData.get("mode");
  const duplicatePolicy = formData.get("duplicatePolicy");

  if (!(file instanceof File)) {
    return errorResponse("فایل Excel ارسال نشده است", 400);
  }
  if (mode !== "preview" && mode !== "commit") {
    return errorResponse("حالت درخواست معتبر نیست", 400);
  }
  if (duplicatePolicy !== "skip" && duplicatePolicy !== "update") {
    return errorResponse("روش برخورد با محصول تکراری معتبر نیست", 400);
  }
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return errorResponse("فقط فایل Excel با پسوند .xlsx پذیرفته می‌شود", 415);
  }
  if (file.size === 0) return errorResponse("فایل Excel خالی است", 400);
  const buffer = Buffer.from(await file.arrayBuffer());
  const archiveError = validateArchive(buffer);
  if (archiveError) return errorResponse(archiveError, 400);

  let sheetRows;
  try {
    sheetRows = await readSheet(buffer);
  } catch (error) {
    console.warn("Product XLSX parsing failed", {
      fileName: file.name,
      fileSize: file.size,
      error: error instanceof Error ? error.message : "Unknown parser error",
    });
    return errorResponse("خواندن فایل Excel ناموفق بود؛ ساختار فایل را بررسی کنید", 400);
  }

  const parsed = parseProductImportSheet(sheetRows);
  const existingSlugs = await findExistingSlugs(
    parsed.rows.map(({ data }) => data.slug),
  );

  const rowsWithActions = parsed.rows.map(({ row, data }) => {
    const action: ImportAction = existingSlugs.has(data.slug)
      ? (duplicatePolicy as DuplicatePolicy) === "update"
        ? "update"
        : "skip"
      : "create";
    return { row, data, action };
  });

  const summary = {
    total: parsed.totalDataRows,
    valid: parsed.rows.length,
    invalid: parsed.totalDataRows - parsed.rows.length,
    create: rowsWithActions.filter(({ action }) => action === "create").length,
    update: rowsWithActions.filter(({ action }) => action === "update").length,
    skip: rowsWithActions.filter(({ action }) => action === "skip").length,
  };

  const preview = {
    summary,
    issues: parsed.issues.slice(0, 100),
    issuesTruncated: parsed.issues.length > 100,
    rows: rowsWithActions.slice(0, PREVIEW_ROW_LIMIT),
    rowsTruncated: rowsWithActions.length > PREVIEW_ROW_LIMIT,
  };

  if ((mode as ImportMode) === "preview") {
    return NextResponse.json(preview);
  }

  if (parsed.issues.length > 0 || parsed.totalDataRows === 0) {
    return NextResponse.json(
      {
        ...preview,
        error:
          parsed.totalDataRows === 0
            ? "فایل محصولی برای ورود ندارد"
            : "ابتدا خطاهای فایل را برطرف کنید؛ هیچ محصولی ثبت نشد",
      },
      { status: 422 },
    );
  }

  const actionableRows = rowsWithActions.filter(
    ({ action }) => action !== "skip",
  );

  try {
    if (actionableRows.length > 0) {
      await prisma.$transaction(
        actionableRows.map(({ action, data }) =>
          action === "update"
            ? prisma.product.update({
                where: { slug: data.slug },
                data: { ...data, isActive: true },
              })
            : prisma.product.create({
                data: { ...data, imageUrl: PRODUCT_IMAGE_PLACEHOLDER },
              }),
        ),
      );
    }
  } catch (error) {
    console.error("Product import transaction failed", {
      fileName: file.name,
      requestedRows: actionableRows.length,
      error,
    });
    return errorResponse(
      "ثبت گروهی محصولات ناموفق بود؛ تغییری ذخیره نشد. دوباره پیش‌نمایش بگیرید",
      409,
    );
  }

  return NextResponse.json({
    ok: true,
    summary,
    message: `${(summary.create + summary.update).toLocaleString("fa-IR")} محصول با موفقیت ثبت شد`,
  });
}
