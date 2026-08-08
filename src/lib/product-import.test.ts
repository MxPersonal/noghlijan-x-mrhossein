import assert from "node:assert/strict";
import test from "node:test";
import { parseProductImportSheet } from "./product-import";

const headers = [
  "نام",
  "اسلاگ",
  "قیمت (تومان)",
  "موجودی",
  "دسته",
  "گروه سنی",
  "جنسیت",
  "توضیحات",
];

test("parses Persian product headers and digits", () => {
  const result = parseProductImportSheet([
    headers,
    [
      "پیراهن کودک",
      "",
      "۱٬۲۵۰٬۰۰۰",
      "۱۲",
      "لباس",
      "۳ تا ۵ سال",
      "مشترک",
      "توضیح محصول",
    ],
  ]);

  assert.deepEqual(result.issues, []);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].data.slug, "پیراهن-کودک");
  assert.equal(result.rows[0].data.price, 1_250_000);
  assert.equal(result.rows[0].data.stock, 12);
  assert.equal(result.rows[0].data.gender, "یونیسکس");
  assert.equal("imageUrl" in result.rows[0].data, false);
});

test("reports missing required columns", () => {
  const result = parseProductImportSheet([["نام", "قیمت"]]);

  assert.equal(result.rows.length, 0);
  assert.match(result.issues[0].message, /ستون‌های الزامی/);
});

test("rejects duplicate slugs", () => {
  const result = parseProductImportSheet([
    headers,
    [
      "محصول اول",
      "same-product",
      100_000,
      1,
      "لباس",
      "کودک",
      "یونیسکس",
      "توضیح",
    ],
    [
      "محصول دوم",
      "same-product",
      200_000,
      2,
      "لباس",
      "کودک",
      "یونیسکس",
      "توضیح",
    ],
  ]);

  assert.equal(result.rows.length, 1);
  assert.ok(result.issues.some(({ field }) => field === "slug"));
});

test("does not impose the previous 1,000 row limit", () => {
  const rows = Array.from({ length: 1_001 }, (_, index) => [
    `محصول ${index + 1}`,
    `product-${index + 1}`,
    100_000,
    1,
    "لباس",
    "کودک",
    "یونیسکس",
    "توضیح محصول",
  ]);

  const result = parseProductImportSheet([headers, ...rows]);

  assert.deepEqual(result.issues, []);
  assert.equal(result.rows.length, 1_001);
});
