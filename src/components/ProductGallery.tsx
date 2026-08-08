"use client";

import Image from "next/image";
import { useState } from "react";

type GalleryImage = {
  url: string;
  altText: string | null;
};

export function ProductGallery({
  images,
  productName,
}: {
  images: GalleryImage[];
  productName: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = images[selectedIndex] ?? images[0];

  return (
    <div className="space-y-3">
      <div className="animate-soft-pop relative aspect-4/5 overflow-hidden rounded-3xl bg-mint ring-1 ring-ink/6">
        <Image
          src={selected.url}
          alt={selected.altText || productName}
          fill
          priority={selectedIndex === 0}
          unoptimized={/^https?:\/\//i.test(selected.url)}
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>

      {images.length > 1 ? (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5" aria-label="تصاویر محصول">
          {images.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-label={`نمایش تصویر ${(index + 1).toLocaleString("fa-IR")} ${productName}`}
              aria-pressed={selectedIndex === index}
              className={`relative aspect-square overflow-hidden rounded-xl bg-mint ring-2 transition ${
                selectedIndex === index
                  ? "ring-teal"
                  : "ring-transparent hover:ring-teal/30"
              }`}
            >
              <Image
                src={image.url}
                alt=""
                fill
                unoptimized={/^https?:\/\//i.test(image.url)}
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
