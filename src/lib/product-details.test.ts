import assert from "node:assert/strict";
import test from "node:test";
import { parseProductImages, parseTerms } from "./product-details";

test("keeps the selected primary image first and removes duplicates", () => {
  const images = parseProductImages(
    [
      { url: "/images/products/secondary.webp", altText: "نمای تن‌خور" },
      { url: "/images/products/main.webp", altText: "نمای اصلی" },
      "/images/products/secondary.webp",
    ],
    "/images/products/main.webp",
    "محصول نمونه",
  );

  assert.deepEqual(images, [
    { url: "/images/products/main.webp", altText: "نمای اصلی" },
    { url: "/images/products/secondary.webp", altText: "نمای تن‌خور" },
  ]);
});

test("accepts credential-free HTTPS images and rejects unsafe URLs", () => {
  assert.equal(
    parseProductImages([], "https://cdn.example.com/product.webp", "محصول")[0].url,
    "https://cdn.example.com/product.webp",
  );
  assert.throws(
    () => parseProductImages([], "http://example.com/product.webp", "محصول"),
    /HTTPS/,
  );
  assert.throws(
    () => parseProductImages([], "https://user:pass@example.com/a.webp", "محصول"),
    /بدون اطلاعات ورود/,
  );
});

test("parses Persian and English comma-separated terms", () => {
  assert.deepEqual(parseTerms("#نخی، تابستانی, نخی", "تگ‌ها"), [
    "نخی",
    "تابستانی",
  ]);
  assert.deepEqual(parseTerms("", "تگ‌ها"), []);
  assert.throws(() => parseTerms(["نخی", 12], "تگ‌ها"), /معتبر نیست/);
});
