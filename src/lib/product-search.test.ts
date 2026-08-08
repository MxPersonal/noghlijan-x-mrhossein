import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_PRODUCT_SEARCH_LENGTH,
  buildProductSearchWhere,
  normalizeProductSearchQuery,
} from "./product-search";

test("normalizes whitespace and rejects non-string search values", () => {
  assert.equal(normalizeProductSearchQuery("  ست   تابستانی  "), "ست تابستانی");
  assert.equal(normalizeProductSearchQuery(["ست"]), "");
});

test("limits search queries and builds no filter for an empty query", () => {
  assert.equal(
    normalizeProductSearchQuery("الف".repeat(MAX_PRODUCT_SEARCH_LENGTH + 10)).length,
    MAX_PRODUCT_SEARCH_LENGTH,
  );
  assert.deepEqual(buildProductSearchWhere(""), {});
  assert.equal(buildProductSearchWhere("هودی").OR?.length, 8);
});
