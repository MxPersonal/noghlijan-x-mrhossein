import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type PublicLink = { label: string; url: string };
export type PolicySection = { heading: string; body: string };

export type SiteContent = {
  aboutTitle: string;
  aboutSubtitle: string;
  aboutParagraphOne: string;
  aboutParagraphTwo: string;
  aboutShopButton: string;
  contactTitle: string;
  contactSubtitle: string;
  contactPhoneLabel: string;
  contactPhone: string;
  contactEmailLabel: string;
  contactEmail: string;
  contactAddressLabel: string;
  contactAddress: string;
  mapsHeading: string;
  mapsDescription: string;
  socialHeading: string;
  socialDescription: string;
  contactClosing: string;
  maps: PublicLink[];
  socials: PublicLink[];
  termsTitle: string;
  termsSubtitle: string;
  termsUpdatedLabel: string;
  termsNotice: string;
  termsPublished: boolean;
  termsSections: PolicySection[];
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  aboutTitle: "قصهٔ نقلی‌جان",
  aboutSubtitle: "برای لحظه‌های رنگیِ کوچولوها",
  aboutParagraphOne:
    "نقلی‌جان یک فروشگاه پوشاک بچه‌گانه است که با الهام از رنگ‌های شاد و دنیای پرهیجان کودکی شکل گرفته. دوست داریم انتخاب لباس برای کوچولوها، تجربه‌ای ساده، دلنشین و پر از حس خوب باشد؛ از تماشای مدل‌ها تا انتخاب رنگ و سایز دلخواه.",
  aboutParagraphTwo:
    "اینجا می‌توانی مدل‌های متنوع را ببینی، جزئیات و تصاویر هر لباس را بررسی کنی و با خیال روشن‌تری انتخاب کنی. نقلی‌جان تلاش می‌کند فضای خریدی گرم و دوست‌داشتنی برای خانواده‌ها فراهم کند؛ جایی که هر انتخاب کوچک، می‌تواند بخشی از یک خاطرهٔ شیرین باشد.",
  aboutShopButton: "گشت‌وگذار در فروشگاه",
  contactTitle: "ارتباط با نقلی‌جان",
  contactSubtitle: "سؤالی داری؟ راه‌های ارتباطی ما همین‌جاست.",
  contactPhoneLabel: "شماره تماس",
  contactPhone: "",
  contactEmailLabel: "ایمیل",
  contactEmail: "",
  contactAddressLabel: "آدرس",
  contactAddress: "",
  mapsHeading: "ما را روی نقشه پیدا کن",
  mapsDescription: "مسیریاب دلخواهت را انتخاب کن و مسیر را ببین.",
  socialHeading: "نقلی‌جان در شبکه‌های اجتماعی",
  socialDescription: "از راه‌های ارتباطی دلخواهت همراه ما باش.",
  contactClosing: "برای دریافت راهنمایی می‌توانی از مسیرهای ارتباطی درج‌شده استفاده کنی.",
  maps: [
    { label: "بلد", url: "" },
    { label: "نشان", url: "" },
    { label: "Google Maps", url: "" },
    { label: "Waze", url: "" },
  ],
  socials: [
    { label: "ایتا", url: "" },
    { label: "روبیکا", url: "" },
    { label: "اینستاگرام", url: "" },
    { label: "تلگرام", url: "" },
  ],
  termsTitle: "شرایط و قوانین نقلی‌جان",
  termsSubtitle: "راهنمای آشنایی با ضوابط استفاده و خرید از فروشگاه.",
  termsUpdatedLabel: "متن قوانین و سیاست‌های فروشگاه",
  termsNotice: "متن این صفحه تا زمان تکمیل و انتشار توسط مدیریت، پیش‌نویس است و نباید سیاست قطعی فروشگاه تلقی شود.",
  termsPublished: false,
  termsSections: [
    { heading: "اطلاعات محصولات و ثبت سفارش", body: "مدیریت فروشگاه باید در این بخش روش ثبت سفارش، قیمت‌گذاری، تأیید سفارش و حدود مسئولیت در قبال اطلاعات محصولات را به‌صورت دقیق مشخص کند." },
    { heading: "پرداخت، ارسال و تحویل", body: "مدیریت فروشگاه باید روش‌های پرداخت معتبر، محدودهٔ ارسال، زمان‌های تقریبی تحویل و نحوهٔ اطلاع‌رسانی دربارهٔ سفارش را در این بخش تعیین کند." },
    { heading: "مرجوعی، تعویض و پشتیبانی", body: "مدیریت فروشگاه باید شرایط واقعی درخواست تعویض یا مرجوعی، مهلت‌ها، استثناها و راه ارتباط با پشتیبانی را در این بخش اعلام کند." },
    { heading: "حریم خصوصی و اطلاعات مشتری", body: "مدیریت فروشگاه باید نحوهٔ گردآوری، استفاده، نگهداری و حفاظت از اطلاعات موردنیاز سفارش را مطابق رویهٔ واقعی فروشگاه و الزامات قانونی توضیح دهد." },
  ],
};

const TEXT_LIMITS = {
  aboutTitle: 120, aboutSubtitle: 240, aboutParagraphOne: 2400, aboutParagraphTwo: 2400,
  aboutShopButton: 80, contactTitle: 120, contactSubtitle: 400,
  contactPhoneLabel: 80, contactPhone: 80, contactEmailLabel: 80, contactEmail: 180,
  contactAddressLabel: 80, contactAddress: 650, mapsHeading: 120, mapsDescription: 360,
  socialHeading: 120, socialDescription: 360, contactClosing: 400,
  termsTitle: 120, termsSubtitle: 360, termsUpdatedLabel: 120, termsNotice: 600,
} as const;

export const CONTENT_TEXT_FIELDS = Object.keys(TEXT_LIMITS) as (keyof typeof TEXT_LIMITS)[];

function normalizedText(value: unknown, field: string, limit: number): string {
  if (typeof value !== "string") throw new Error("مقدار فیلد «" + field + "» باید متن باشد.");
  const trimmed = value.trim();
  if (trimmed.length > limit) throw new Error("متن «" + field + "» طولانی‌تر از حد مجاز است.");
  return trimmed;
}

export function safePublicUrl(value: string): string {
  if (!value || typeof value !== "string") return "";
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && url.hostname.length > 0 ? url.href : "";
  } catch { return ""; }
}

function parseLinks(value: unknown, field: string): PublicLink[] {
  if (!Array.isArray(value) || value.length > 12) throw new Error("تعداد لینک‌های «" + field + "» نامعتبر است.");
  return value.map((entry: unknown, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new Error("ردیف لینک نامعتبر است.");
    const row = entry as Record<string, unknown>;
    const label = normalizedText(row.label, field + " " + (index + 1), 75);
    const url = normalizedText(row.url, "آدرس لینک", 2048);
    if (!label) throw new Error("نام هر سرویس باید نوشته شود.");
    if (url && !safePublicUrl(url)) throw new Error("لینک «" + label + "» باید با https:// آغاز شود و معتبر باشد.");
    return { label, url };
  });
}

export function parseSiteContent(input: unknown): SiteContent {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("اطلاعات صفحه‌ها معتبر نیست.");
  }
  const submitted = input as Record<string, unknown>;
  const data = { ...DEFAULT_SITE_CONTENT };
  for (const field of CONTENT_TEXT_FIELDS) {
    data[field] = normalizedText(submitted[field], field, TEXT_LIMITS[field]);
  }
  data.maps = parseLinks(submitted.maps, "مسیریاب‌ها");
  data.socials = parseLinks(submitted.socials, "شبکه‌های اجتماعی");
  if (typeof submitted.termsPublished !== "boolean") throw new Error("وضعیت انتشار قوانین نامعتبر است.");
  data.termsPublished = submitted.termsPublished;
  if (!Array.isArray(submitted.termsSections) || submitted.termsSections.length > 20) {
    throw new Error("حداکثر ۲۰ بخش قوانین قابل تعریف است.");
  }
  data.termsSections = submitted.termsSections.map((item: unknown, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("بخش قوانین نامعتبر است.");
    const row = item as Record<string, unknown>;
    return {
      heading: normalizedText(row.heading, "عنوان بخش " + (index + 1), 150),
      body: normalizedText(row.body, "متن بخش " + (index + 1), 6000),
    };
  });
  if (data.termsPublished &&
      (!data.termsSections.length || data.termsSections.some(section => !section.heading || section.body.length < 60))) {
    throw new Error("برای انتشار قوانین باید حداقل یک بخش با عنوان و متن کامل (۶۰ نویسه یا بیشتر) ثبت شود.");
  }
  if (data.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
    throw new Error("ایمیل واردشده معتبر نیست.");
  }
  return data;
}

function storedContent(value: unknown): SiteContent {
  if (!value || typeof value !== "object" || Array.isArray(value)) return DEFAULT_SITE_CONTENT;
  const data = value as Record<string, unknown>;
  return {
    ...DEFAULT_SITE_CONTENT,
    ...Object.fromEntries(CONTENT_TEXT_FIELDS
      .filter(field => typeof data[field] === "string")
      .map(field => [field, data[field]])),
    maps: Array.isArray(data.maps) ? data.maps.filter(
      (row): row is PublicLink => !!row && typeof row === "object" &&
        typeof row.label === "string" && typeof row.url === "string"
    ).map(row => ({ label: row.label, url: safePublicUrl(row.url) })) : DEFAULT_SITE_CONTENT.maps,
    socials: Array.isArray(data.socials) ? data.socials.filter(
      (row): row is PublicLink => !!row && typeof row === "object" &&
        typeof row.label === "string" && typeof row.url === "string"
    ).map(row => ({ label: row.label, url: safePublicUrl(row.url) })) : DEFAULT_SITE_CONTENT.socials,
    termsPublished: data.termsPublished === true,
    termsSections: Array.isArray(data.termsSections) ? data.termsSections.filter(
      (row): row is PolicySection => !!row && typeof row === "object" &&
        typeof row.heading === "string" && typeof row.body === "string"
    ) : DEFAULT_SITE_CONTENT.termsSections,
  };
}

/** Missing-table fallback lets fresh previews render before the additive DB migration. */
export async function getSiteContent(): Promise<SiteContent> {
  try {
    const item = await prisma.siteContent.findUnique({ where: { id: "main" } });
    return storedContent(item?.data);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2021") {
      return DEFAULT_SITE_CONTENT;
    }
    throw error;
  }
}

export async function saveSiteContent(input: SiteContent): Promise<void> {
  await prisma.siteContent.upsert({
    where: { id: "main" },
    create: { id: "main", data: input as unknown as Prisma.InputJsonValue },
    update: { data: input as unknown as Prisma.InputJsonValue },
  });
}
