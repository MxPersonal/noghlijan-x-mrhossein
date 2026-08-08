"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { formatPrice } from "@/lib/format";

type DuplicatePolicy = "skip" | "update";
type ImportAction = "create" | "update" | "skip";

type ImportSummary = {
  total: number;
  valid: number;
  invalid: number;
  create: number;
  update: number;
  skip: number;
};

type ImportPreview = {
  summary: ImportSummary;
  issues: Array<{ row: number; field?: string; message: string }>;
  issuesTruncated: boolean;
  rows: Array<{
    row: number;
    action: ImportAction;
    data: {
      name: string;
      slug: string;
      price: number;
      stock: number;
      category: string;
    };
  }>;
  rowsTruncated: boolean;
};

const ACTION_LABELS: Record<ImportAction, string> = {
  create: "محصول جدید",
  update: "به‌روزرسانی",
  skip: "بدون تغییر",
};

export function ProductImportPanel({
  onImported,
}: {
  onImported: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [duplicatePolicy, setDuplicatePolicy] =
    useState<DuplicatePolicy>("skip");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyMode, setBusyMode] = useState<"preview" | "commit" | null>(null);

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.currentTarget.files?.[0] ?? null;
    setPreview(null);
    setError("");
    setSuccess("");

    if (!selectedFile) {
      setFile(null);
      return;
    }
    if (!selectedFile.name.toLowerCase().endsWith(".xlsx")) {
      setFile(null);
      setError("فقط فایل Excel با پسوند .xlsx انتخاب کنید");
      event.currentTarget.value = "";
      return;
    }
    if (selectedFile.size === 0) {
      setFile(null);
      setError("فایل Excel خالی است");
      event.currentTarget.value = "";
      return;
    }

    setFile(selectedFile);
  }

  async function submit(mode: "preview" | "commit") {
    if (!file || busyMode) return;

    setBusyMode(mode);
    setError("");
    setSuccess("");

    try {
      const body = new FormData();
      body.append("file", file);
      body.append("mode", mode);
      body.append("duplicatePolicy", duplicatePolicy);

      const response = await fetch("/api/admin/products/import", {
        method: "POST",
        body,
      });
      const data = (await response.json()) as Partial<ImportPreview> & {
        error?: unknown;
        message?: unknown;
        ok?: unknown;
      };

      if (!response.ok) {
        if (data.summary && data.issues && data.rows) {
          setPreview(data as ImportPreview);
        }
        throw new Error(
          typeof data.error === "string" ? data.error : "پردازش فایل ناموفق بود",
        );
      }

      if (mode === "preview") {
        setPreview(data as ImportPreview);
        return;
      }

      setPreview(null);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      setSuccess(
        typeof data.message === "string"
          ? data.message
          : "محصولات با موفقیت وارد شدند",
      );
      onImported();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "پردازش فایل ناموفق بود",
      );
    } finally {
      setBusyMode(null);
    }
  }

  const canCommit =
    preview != null &&
    preview.summary.invalid === 0 &&
    preview.summary.total > 0 &&
    preview.summary.create + preview.summary.update > 0;

  return (
    <section className="glass-surface mb-8 rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl text-ink">ورود گروهی از Excel</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-ink-soft">
            ردیف اول فایل باید عنوان ستون‌ها را داشته باشد. اسلاگ و موجودی اختیاری
            هستند؛ موجودی خالی صفر در نظر گرفته می‌شود. تصویر از Excel خوانده
            نمی‌شود و بعد از ورود محصولات می‌توانید آن را از فرم ویرایش، دستی
            آپلود کنید.
          </p>
        </div>
        <span className="rounded-full bg-mint px-3 py-1 text-xs text-teal-deep">
          بدون سقف ثابت برای حجم و تعداد محصول
        </span>
      </div>

      <div className="mt-4 rounded-xl bg-cream/70 p-3 text-sm text-ink-soft">
        <p className="font-medium text-ink">عنوان ستون‌های پیشنهادی</p>
        <p className="mt-1 leading-7" dir="rtl">
          نام، اسلاگ، قیمت (تومان)، موجودی، دسته، گروه سنی، جنسیت، توضیحات
        </p>
        <p className="mt-1 text-xs leading-5">
          محصول جدید ابتدا با وضعیت «بدون تصویر» ثبت می‌شود. پس از ورود، محصول را
          از لیست انتخاب کنید، «ویرایش» را بزنید و تصویر را از رایانه آپلود کنید.
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem_auto] md:items-end">
        <div>
          <label
            htmlFor="products-excel-file"
            className="mb-1 block text-xs text-ink-soft"
          >
            فایل Excel
          </label>
          <input
            ref={inputRef}
            id="products-excel-file"
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            disabled={busyMode != null}
            onChange={onFileChange}
            className="glass-input block w-full rounded-lg border border-ink/10 px-3 py-2 text-sm file:ml-3 file:rounded-md file:border-0 file:bg-mint file:px-3 file:py-1.5 file:text-ink disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="duplicate-policy"
            className="mb-1 block text-xs text-ink-soft"
          >
            محصول با اسلاگ تکراری
          </label>
          <select
            id="duplicate-policy"
            value={duplicatePolicy}
            disabled={busyMode != null}
            onChange={(event) => {
              setDuplicatePolicy(event.target.value as DuplicatePolicy);
              setPreview(null);
              setError("");
            }}
            className="glass-input w-full rounded-lg border border-ink/10 px-3 py-2 text-sm"
          >
            <option value="skip">بدون تغییر باقی بماند</option>
            <option value="update">
              اطلاعات Excel جایگزین شود (تصویر فعلی حفظ شود)
            </option>
          </select>
        </div>

        <button
          type="button"
          disabled={!file || busyMode != null}
          onClick={() => submit("preview")}
          className="rounded-xl bg-cream-deep px-4 py-2 text-sm text-ink hover:bg-mint disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busyMode === "preview" ? "در حال بررسی..." : "بررسی و پیش‌نمایش"}
        </button>
      </div>

      <div aria-live="polite">
        {error ? <p className="mt-3 text-sm text-peach">{error}</p> : null}
        {success ? <p className="mt-3 text-sm text-teal">{success}</p> : null}
      </div>

      {preview ? (
        <div className="mt-5 border-t border-ink/8 pt-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ["کل ردیف‌ها", preview.summary.total],
              ["معتبر", preview.summary.valid],
              ["دارای خطا", preview.summary.invalid],
              ["محصول جدید", preview.summary.create],
              ["به‌روزرسانی", preview.summary.update],
              ["بدون تغییر", preview.summary.skip],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl bg-cream/60 p-3">
                <p className="text-xs text-ink-soft">{label}</p>
                <p className="mt-1 text-lg font-medium text-ink">
                  {Number(value).toLocaleString("fa-IR")}
                </p>
              </div>
            ))}
          </div>

          {preview.issues.length > 0 ? (
            <div className="mt-4 rounded-xl bg-peach/10 p-4 ring-1 ring-peach/20">
              <h3 className="font-medium text-ink">خطاهای فایل</h3>
              <ul className="mt-2 max-h-48 list-disc space-y-1 overflow-auto pr-5 text-sm text-ink-soft">
                {preview.issues.map((issue, index) => (
                  <li key={`${issue.row}-${issue.field ?? "row"}-${index}`}>
                    ردیف {issue.row.toLocaleString("fa-IR")}: {issue.message}
                  </li>
                ))}
              </ul>
              {preview.issuesTruncated ? (
                <p className="mt-2 text-xs text-ink-soft">
                  فقط ۱۰۰ خطای نخست نمایش داده شده است.
                </p>
              ) : null}
            </div>
          ) : null}

          {preview.rows.length > 0 ? (
            <div className="mt-4 overflow-x-auto rounded-xl ring-1 ring-ink/8">
              <table className="w-full min-w-180 text-right text-sm">
                <thead className="bg-mint/70 text-xs text-ink-soft">
                  <tr>
                    <th className="px-3 py-2 font-medium">ردیف</th>
                    <th className="px-3 py-2 font-medium">نام</th>
                    <th className="px-3 py-2 font-medium">اسلاگ</th>
                    <th className="px-3 py-2 font-medium">دسته</th>
                    <th className="px-3 py-2 font-medium">قیمت</th>
                    <th className="px-3 py-2 font-medium">موجودی</th>
                    <th className="px-3 py-2 font-medium">نتیجه</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/6 bg-cream/60">
                  {preview.rows.map(({ row, data, action }) => (
                    <tr key={`${row}-${data.slug}`}>
                      <td className="px-3 py-2">{row.toLocaleString("fa-IR")}</td>
                      <td className="max-w-56 truncate px-3 py-2">{data.name}</td>
                      <td className="px-3 py-2 text-left text-xs" dir="ltr">
                        {data.slug}
                      </td>
                      <td className="px-3 py-2">{data.category}</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        {formatPrice(data.price)}
                      </td>
                      <td className="px-3 py-2">
                        {data.stock.toLocaleString("fa-IR")}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        {ACTION_LABELS[action]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.rowsTruncated ? (
                <p className="bg-cream/50 px-3 py-2 text-xs text-ink-soft">
                  فقط ۱۰۰ ردیف نخست در پیش‌نمایش نمایش داده شده است.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!canCommit || busyMode != null}
              onClick={() => submit("commit")}
              className="rounded-xl bg-teal px-5 py-2 text-sm text-white hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busyMode === "commit" ? "در حال ثبت..." : "تأیید و ثبت محصولات"}
            </button>
            {preview.summary.invalid > 0 ? (
              <p className="text-xs text-ink-soft">
                تا رفع همه خطاها هیچ محصولی ثبت نمی‌شود.
              </p>
            ) : null}
            {preview.summary.create + preview.summary.update === 0 &&
            preview.summary.skip > 0 ? (
              <p className="text-xs text-ink-soft">
                همه محصولات از قبل وجود دارند و روش «بدون تغییر» انتخاب شده است.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
