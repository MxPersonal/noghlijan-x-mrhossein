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

export function ProductCard({ name, slug, price, imageUrl, category, ageGroup, labels = [] }: ProductCardProps) {
  return (
    <Link href={`/shop/${slug}`} className="glass-surface product-card group block overflow-hidden rounded-[1.8rem] focus-visible:rounded-[1.8rem]">
      <div className="relative aspect-4/5 overflow-hidden bg-[#f6e3da]">
        {labels.length > 0 ? (
          <div className="absolute right-3 top-3 z-10 flex flex-wrap gap-1">
            {labels.slice(0, 2).map(({ name: label }) => <span key={label} className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-[#754454] shadow-sm">{label}</span>)}
          </div>
        ) : null}
        <Image src={imageUrl} alt={name} fill unoptimized={/^https?:\/\//i.test(imageUrl)}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="p-4 sm:p-5">
        <p className="text-xs leading-6 text-ink-soft">{category} · {ageGroup}</p>
        <h3 className="mt-1 min-h-12 line-clamp-2 text-sm font-semibold leading-6 text-ink sm:text-base">{name}</h3>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-teal-deep sm:text-base">{formatPrice(price)}</p>
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-[#ffe1e5] text-xl text-[#853e55] transition group-hover:bg-[#f8c2cc]">＋</span>
        </div>
      </div>
    </Link>
  );
}
