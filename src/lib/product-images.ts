export const PRODUCT_IMAGE_PLACEHOLDER = "/images/product-placeholder.svg";

export function isProductImagePlaceholder(imageUrl: string): boolean {
  return imageUrl === PRODUCT_IMAGE_PLACEHOLDER;
}
