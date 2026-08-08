import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES, GENDERS } from "@/lib/format";
import {
  buildProductSearchWhere,
  normalizeProductSearchQuery,
} from "@/lib/product-search";
import type { Prisma } from "@/generated/prisma/client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "فروشگاه",
};

type SearchParams = Promise<{
  category?: string;
  age?: string;
  gender?: string;
  q?: string;
}>;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const searchTerm = normalizeProductSearchQuery(params.q);
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(params.category ? { category: params.category } : {}),
    ...(params.age ? { ageGroup: params.age } : {}),
    ...(params.gender ? { gender: params.gender } : {}),
    ...buildProductSearchWhere(searchTerm),
  };

  const [products, ages] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { labels: { select: { name: true } } },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { ageGroup: true },
      distinct: ["ageGroup"],
      orderBy: { ageGroup: "asc" },
    }),
  ]);

  const ageOptions = ages.map((a) => a.ageGroup);

  function hrefFor(next: {
    category?: string;
    age?: string;
    gender?: string;
    q?: string;
  }) {
    const queryParams = new URLSearchParams();
    const category = next.category ?? params.category;
    const age = next.age ?? params.age;
    const gender = next.gender ?? params.gender;
    const nextSearchTerm = next.q ?? searchTerm;
    if (category) queryParams.set("category", category);
    if (age) queryParams.set("age", age);
    if (gender) queryParams.set("gender", gender);
    if (nextSearchTerm) queryParams.set("q", nextSearchTerm);
    const s = queryParams.toString();
    return s ? `/shop?${s}` : "/shop";
  }

  function clearFilter(key: "category" | "age" | "gender" | "q") {
    const q = new URLSearchParams();
    if (key !== "category" && params.category) q.set("category", params.category);
    if (key !== "age" && params.age) q.set("age", params.age);
    if (key !== "gender" && params.gender) q.set("gender", params.gender);
    if (key !== "q" && searchTerm) q.set("q", searchTerm);
    const s = q.toString();
    return s ? `/shop?${s}` : "/shop";
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-ink">فروشگاه</h1>
        <p className="mt-2 text-ink-soft">
          لباس بچه‌گانه را بر اساس سن، دسته و جنسیت پیدا کنید
        </p>
      </div>

      <div className="glass-surface mb-8 space-y-4 rounded-2xl p-4 sm:p-5">
        <form action="/shop" method="get" role="search" className="flex flex-col gap-3 sm:flex-row">
          {params.category ? <input type="hidden" name="category" value={params.category} /> : null}
          {params.age ? <input type="hidden" name="age" value={params.age} /> : null}
          {params.gender ? <input type="hidden" name="gender" value={params.gender} /> : null}
          <label htmlFor="product-search" className="sr-only">
            جستجو در نام، توضیحات و دسته محصولات
          </label>
          <div className="glass-input flex min-w-0 flex-1 items-center rounded-xl focus-within:border-teal/35 focus-within:ring-2 focus-within:ring-teal/30">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-4 size-5 shrink-0 text-ink-soft">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            <input
              id="product-search"
              name="q"
              type="search"
              maxLength={80}
              defaultValue={searchTerm}
              placeholder="نام محصول یا دسته را بنویسید..."
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-ink outline-none placeholder:text-ink-soft/70"
            />
          </div>
          <button type="submit" className="rounded-xl bg-teal px-6 py-3 text-sm font-medium text-white transition hover:bg-teal-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal">
            جستجو
          </button>
          {searchTerm ? (
            <Link href={clearFilter("q")} className="rounded-xl px-4 py-3 text-center text-sm text-ink-soft transition hover:bg-cream-deep hover:text-ink">
              پاک کردن جستجو
            </Link>
          ) : null}
        </form>

        <FilterRow label="دسته">
          <FilterChip href={clearFilter("category")} active={!params.category} clear>
            همه
          </FilterChip>
          {CATEGORIES.map((c) => (
            <FilterChip
              key={c}
              href={hrefFor({ category: c })}
              active={params.category === c}
              clearHref={params.category === c ? clearFilter("category") : undefined}
            >
              {c}
            </FilterChip>
          ))}
        </FilterRow>
        <FilterRow label="سن">
          <FilterChip href={clearFilter("age")} active={!params.age} clear>
            همه
          </FilterChip>
          {ageOptions.map((a) => (
            <FilterChip
              key={a}
              href={hrefFor({ age: a })}
              active={params.age === a}
            >
              {a}
            </FilterChip>
          ))}
        </FilterRow>
        <FilterRow label="جنسیت">
          <FilterChip href={clearFilter("gender")} active={!params.gender} clear>
            همه
          </FilterChip>
          {GENDERS.map((g) => (
            <FilterChip
              key={g}
              href={hrefFor({ gender: g })}
              active={params.gender === g}
            >
              {g}
            </FilterChip>
          ))}
        </FilterRow>
      </div>

      {searchTerm ? (
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2" aria-live="polite">
          <p className="text-sm text-ink-soft">
            نتیجه جستجو برای <strong className="font-medium text-ink">«{searchTerm}»</strong>
          </p>
          <p className="text-xs text-ink-soft">{products.length.toLocaleString("fa-IR")} محصول</p>
        </div>
      ) : null}

      {products.length === 0 ? (
        <p className="glass-surface rounded-2xl p-10 text-center text-ink-soft">
          {searchTerm ? "محصولی با این عبارت و فیلترها یافت نشد." : "محصولی با این فیلتر یافت نشد."}
          <Link href="/shop" className="mr-2 text-teal">
            پاک کردن فیلترها
          </Link>
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} {...p} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-ink-soft">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
  clear,
  clearHref,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
  clear?: boolean;
  clearHref?: string;
}) {
  return (
    <Link
      href={clearHref ?? href}
      className={`rounded-lg px-3 py-1.5 text-sm transition ${
        active
          ? "bg-teal text-white"
          : clear
            ? "bg-cream-deep text-ink-soft hover:bg-mint"
            : "bg-cream text-ink-soft ring-1 ring-ink/8 hover:bg-mint hover:text-teal-deep"
      }`}
    >
      {children}
    </Link>
  );
}
