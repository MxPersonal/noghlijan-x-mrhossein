/** @format */

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";

type ProductCardProps = {
  name: string;
  slug: string;
  price: number;
  imageUrl: string;
  category: string;
  ageGroup: string;
  labels?: { name: string }[];
};

export function ProductCard({
  name,
  slug,
  price,
  imageUrl,
  category,
  ageGroup,
  labels = [],
}: ProductCardProps) {
  return (
    <Link
      href={`/shop/${slug}`}
      className='glass-surface product-card group block overflow-hidden rounded-2xl'
    >
      <div className='relative aspect-4/5 overflow-hidden bg-mint'>
        {labels.length > 0 ? (
          <div className="absolute right-3 top-3 z-10 flex flex-wrap gap-1">
            {labels.slice(0, 2).map(({ name }) => (
              <span key={name} className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium text-[#2c2a28] shadow-sm">
                {name}
              </span>
            ))}
          </div>
        ) : null}
        <Image
          src={imageUrl}
          alt={name}
          fill
          unoptimized={/^https?:\/\//i.test(imageUrl)}
          sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'
          className='object-cover transition duration-500 group-hover:scale-105'
        />
      </div>
      <div className='space-y-1 p-4'>
        <p className='text-xs text-ink-soft'>
          {category} · {ageGroup}
        </p>
        <h3 className='font-medium text-ink'>{name}</h3>
        <p className='text-teal-deep'>{formatPrice(price)}</p>
      </div>
    </Link>
  );
}
