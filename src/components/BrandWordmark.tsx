import Image from "next/image";

/** Brand lettering faithfully traced from the original hero artwork.
 * One shared asset keeps the storefront and admin brand identical in all themes.
 */
export function BrandWordmark({
  className = "",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={`brand-wordmark ${className}`}>
      <Image
        src="/images/noghlijan-hero-wordmark.svg"
        alt="نقلی‌جان"
        width={440}
        height={475}
        priority={priority}
        className="brand-wordmark-image"
      />
    </span>
  );
}
