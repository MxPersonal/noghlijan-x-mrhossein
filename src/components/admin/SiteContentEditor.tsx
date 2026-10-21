"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { PublicLink, SiteContent } from "@/lib/site-content";

type TextField = {
  [K in keyof SiteContent]: SiteContent[K] extends string ? K : never
}[keyof SiteContent];

type FieldInfo = { key: TextField; label: string; multiline?: boolean; rows?: number; hint?: string };

const ABOUT_FIELDS: FieldInfo[] = [
  { key: "aboutTitle", label: "عنوان صفحه" },
  { key: "aboutSubtitle", label: "زیرعنوان کوتاه" },
  { key: "aboutParagraphOne", label: "پاراگراف اول", multiline: true, rows: 6 },
  { key: "aboutParagraphTwo", label: "پاراگراف دوم", multiline: true, rows: 6 },
  { key: "aboutShopButton", label: "متن دکمهٔ رفتن به فروشگاه" },
];

const CONTACT_FIELDS: FieldInfo[] = [
  { key: "contactTitle", label: "عنوان صفحه" },
  { key: "contactSubtitle", label: "توضیح زیر عنوان", multiline: true, rows: 3 },
  { key: "contactPhoneLabel", label: "عنوان شماره تماس" },
  { key: "contactPhone", label: "شماره تماس", hint: "تا زمانی که مقدار خالی باشد، در صفحهٔ عمومی نمایش داده نمی‌شود." },
  { key: "contactEmailLabel", label: "عنوان ایمیل" },
  { key: "contactEmail", label: "آدرس ایمیل" },
  { key: "contactAddressLabel", label: "عنوان آدرس" },
  { key: "contactAddress", label: "آدرس کامل", multiline: true, rows: 3 },
  { key: "mapsHeading", label: "عنوان بخش مسیریاب‌ها" },
  { key: "mapsDescription", label: "توضیح مسیریاب‌ها" },
  { key: "socialHeading", label: "عنوان شبکه‌های اجتماعی" },
  { key: "socialDescription", label: "توضیح شبکه‌های اجتماعی" },
  { key: "contactClosing", label: "جملهٔ پایانی صفحه", multiline: true, rows: 2 },
];

const TERMS_FIELDS: FieldInfo[] = [
  { key: "termsTitle", label: "عنوان صفحه" },
  { key: "termsSubtitle", label: "توضیح کوتاه ابتدای صفحه", multiline: true, rows: 3 },
  { key: "termsUpdatedLabel", label: "عنوان بالای متن قوانین" },
  { key: "termsNotice", label: "یادداشت وضعیت پیش‌نویس", multiline: true, rows: 3 },
];

function TextFieldInput({
  field, value, onChange,
}: {
  field: FieldInfo; value: string; onChange: (value: string) => void;
}) {
  const id = "site-field-" + field.key;
  return (
    <label htmlFor={id} className={"site-settings-field" + (field.multiline ? " is-wide" : "")}>
      <span>{field.label}</span>
      {field.multiline ? (
        <textarea id={id} value={value} rows={field.rows ?? 3} onChange={event => onChange(event.target.value)}
          className="site-settings-input" dir="auto" />
      ) : (
        <input id={id} value={value} type={field.key === "contactEmail" ? "email" : "text"}
          onChange={event => onChange(event.target.value)} className="site-settings-input" dir="auto" />
      )}
      {field.hint && <small>{field.hint}</small>}
    </label>
  );
}

function LinksEditor({
  title, description, items, onChange, placeholder,
}: {
  title: string; description: string; items: PublicLink[];
  onChange: (items: PublicLink[]) => void; placeholder: string;
}) {
  return (
    <div className="site-settings-links">
      <div className="site-settings-links-heading">
        <div><h3>{title}</h3><p>{description}</p></div>
        <button type="button" disabled={items.length >= 12}
          onClick={() => onChange([...items, { label: "", url: "" }])}
          className="site-settings-add-link">+ افزودن سرویس</button>
      </div>
      <div className="site-settings-link-rows">
        {items.map((item, index) => (
          <div className="site-settings-link-row" key={index}>
            <label>عنوان دکمه
              <input value={item.label} maxLength={75} placeholder="نام سرویس"
                onChange={event => onChange(items.map((row,i) => i === index
                  ? { ...row, label: event.target.value } : row))} />
            </label>
            <label>لینک مستقیم
              <input type="url" dir="ltr" value={item.url} placeholder={placeholder}
                onChange={event => onChange(items.map((row,i) => i === index
                  ? { ...row, url: event.target.value } : row))} />
            </label>
            <button type="button" className="site-settings-remove-link"
              onClick={() => onChange(items.filter((_,i) => i !== index))}
              aria-label={"حذف " + (item.label || "سرویس")}>حذف</button>
          </div>
        ))}
      </div>
      {!items.length && <p className="site-settings-empty">هنوز سرویسی تعریف نشده است.</p>}
    </div>
  );
}

export function SiteContentEditor({ initial }: { initial: SiteContent }) {
  const router = useRouter();
  const [draft, setDraft] = useState<SiteContent>(initial);
  const [section, setSection] = useState<"contact" | "about" | "terms">("contact");
  const [isDirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function patch(update: Partial<SiteContent>) {
    setDraft(previous => ({ ...previous, ...update }));
    setDirty(true);
    setSuccess("");
    setError("");
  }

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/site-content", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = await response.json() as { content?: SiteContent; error?: string };
      if (!response.ok || !result.content) throw new Error(result.error || "ذخیره ناموفق بود");
      setDraft(result.content);
      setDirty(false);
      setSuccess("همهٔ تغییرات ذخیره شد و اکنون در صفحه‌های عمومی سایت قابل مشاهده است.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ارتباط با سرور برقرار نشد");
    } finally {
      setSaving(false);
    }
  }

  const textFields = section === "contact" ? CONTACT_FIELDS : section === "about" ? ABOUT_FIELDS : TERMS_FIELDS;
  return (
    <section className="site-settings" id="site-content-editor">
      <div className="site-settings-heading">
        <div>
          <p className="admin-panel-overline">01 / مدیریت محتوای صفحات</p>
          <h2>صفحه‌های اطلاعاتی <span>✿</span></h2>
          <p>تمام متن‌ها، اطلاعات تماس، آدرس‌ها و لینک‌ها را همین‌جا و بدون نیاز به برنامه‌نویسی تغییر بده.</p>
        </div>
        <span className={"site-settings-save-state" + (isDirty ? " is-dirty" : "")}>
          {isDirty ? "تغییرات ذخیره‌نشده" : "همگام با سایت"}
        </span>
      </div>

      <nav className="site-settings-tabs" aria-label="انتخاب صفحه برای ویرایش">
        {([
          { id: "contact", label: "ارتباط با ما", glyph: "✉" },
          { id: "about", label: "دربارهٔ ما", glyph: "✿" },
          { id: "terms", label: "شرایط و قوانین", glyph: "▤" },
        ] as const).map(tab => (
          <button key={tab.id} type="button" aria-pressed={section === tab.id}
            className={"site-settings-tab" + (section === tab.id ? " is-active" : "")}
            onClick={() => setSection(tab.id)}><span aria-hidden="true">{tab.glyph}</span>{tab.label}</button>
        ))}
      </nav>

      <form onSubmit={onSave} className="site-settings-form">
        <div className="site-settings-panel-header">
          <div>
            <h3>{section === "contact" ? "اطلاعات و راه‌های ارتباطی" :
              section === "about" ? "قصهٔ برند در دو پاراگراف" : "متن شرایط و قوانین فروشگاه"}</h3>
            <p>{section === "contact" ? "نام و لینک هر مسیریاب و شبکهٔ اجتماعی را جدا تنظیم کن؛ لینک‌های خالی در سایت نشان داده نمی‌شوند." :
              section === "about" ? "دو پاراگراف مستقل برای معرفی کوتاه کسب‌وکار و یک دکمهٔ فروشگاه." :
              "ابتدا سیاست‌های واقعی فروشگاه را تکمیل و تأیید کن، سپس وضعیت انتشار را روشن کن."}</p>
          </div>
          <Link href={section === "contact" ? "/contact" : section === "about" ? "/about" : "/terms"}
            target="_blank" rel="noopener noreferrer" className="site-settings-preview">
            دیدن صفحه <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="site-settings-fields">
          {textFields.map(field => (
            <TextFieldInput key={field.key} field={field} value={draft[field.key]}
              onChange={value => patch({ [field.key]: value })} />
          ))}
        </div>

        {section === "contact" && (
          <div className="site-settings-extra">
            <LinksEditor title="مسیریاب‌های ایرانی و خارجی"
              description="لینک اشتراک‌گذاری موقعیت کسب‌وکار را از خود برنامهٔ بلد، نشان، Google Maps یا Waze کپی کن."
              placeholder="https://..."
              items={draft.maps} onChange={maps => patch({ maps })} />
            <LinksEditor title="شبکه‌های اجتماعی"
              description="آدرس صفحهٔ رسمی کسب‌وکار را قرار بده؛ نام هر شبکه و لینک آن قابل تغییر است."
              placeholder="https://..."
              items={draft.socials} onChange={socials => patch({ socials })} />
          </div>
        )}

        {section === "terms" && (
          <div className="site-settings-policy">
            <div className="site-settings-publish">
              <div>
                <h3>وضعیت انتشار قوانین</h3>
                <p>تا زمانی که این گزینه خاموش است، صفحه با برچسب پیش‌نویس دیده می‌شود.</p>
              </div>
              <label className="site-settings-publish-label">
                <input type="checkbox" checked={draft.termsPublished}
                  onChange={event => patch({ termsPublished: event.target.checked })} />
                {draft.termsPublished ? "منتشر شده" : "پیش‌نویس"}
              </label>
            </div>
            <div className="site-settings-policy-head">
              <h3>بخش‌های قوانین</h3>
              <button type="button" disabled={draft.termsSections.length >= 20}
                onClick={() => patch({ termsSections: [...draft.termsSections, { heading: "", body: "" }] })}>
                + افزودن بخش
              </button>
            </div>
            {draft.termsSections.map((item,index) => (
              <div key={index} className="site-settings-policy-card">
                <div className="site-settings-policy-card-top">
                  <span>بخش {(index + 1).toLocaleString("fa-IR")}</span>
                  <button type="button" onClick={() => patch({
                    termsSections: draft.termsSections.filter((_,i) => i !== index),
                  })}>حذف بخش</button>
                </div>
                <label>عنوان بخش
                  <input value={item.heading}
                    onChange={event => patch({ termsSections: draft.termsSections.map((row,i) =>
                      i === index ? { ...row, heading: event.target.value } : row) })} />
                </label>
                <label>متن بخش
                  <textarea value={item.body} rows={5} dir="auto"
                    onChange={event => patch({ termsSections: draft.termsSections.map((row,i) =>
                      i === index ? { ...row, body: event.target.value } : row) })} />
                </label>
              </div>
            ))}
            <p className="site-settings-legal-note">
              پیش‌نویس اولیه صرفاً الگوی ویرایش است و جایگزین بازبینی قانونی یا تعیین سیاست واقعی فروشگاه نیست.
            </p>
          </div>
        )}

        {(error || success) && <div aria-live="polite">
          {error && <p className="site-settings-error" role="alert">{error}</p>}
          {success && <p className="site-settings-success" role="status">{success}</p>}
        </div>}
        <div className="site-settings-actions">
          <button type="submit" disabled={saving || !isDirty} className="site-settings-save">
            {saving ? "در حال ذخیره..." : "ذخیرهٔ تغییرات"} <span aria-hidden="true">←</span>
          </button>
          <button type="button" disabled={saving || !isDirty}
            onClick={() => { setDraft(initial); setDirty(false); setError(""); setSuccess(""); }}
            className="site-settings-revert">بازگرداندن تغییرات ذخیره‌نشده</button>
          <span>برای انتشار لینک‌ها کافی است آدرس معتبر https وارد کنی.</span>
        </div>
      </form>
    </section>
  );
}
