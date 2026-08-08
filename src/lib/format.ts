export function formatPrice(toman: number): string {
  return new Intl.NumberFormat("fa-IR").format(toman) + " تومان";
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export const CATEGORIES = [
  "تی‌شرت",
  "شلوار",
  "ست",
  "کلاه",
  "پیراهن",
  "هودی",
  "جوراب",
  "کاپشن",
  "بادی",
  "دامن",
  "اکسسوری",
] as const;

export const AGE_GROUPS = [
  "0-1 سال",
  "0-2 سال",
  "1-3 سال",
  "1-4 سال",
  "2-4 سال",
  "3-5 سال",
  "3-6 سال",
  "4-6 سال",
  "4-8 سال",
  "5-7 سال",
  "5-8 سال",
] as const;

export const GENDERS = ["دخترانه", "پسرانه", "یونیسکس"] as const;
