<div align="center">

<img src="./public/images/noghlijan-hero-wordmark.svg" alt="لوگوتایپ نقلی‌جان" width="150"/>

# نقلی‌جان 🌸
### NOGHLIJAN · Kidswear E-Commerce

**یه دنیا رنگ برای روزهای کوچیک.**

فروشگاه پوشاک بچه‌گانه با هویت بصری پاستلی، محصولات رنگ‌وسایزدار، تجربه خرید واکنش‌گرا و پنل مدیریت اختصاصی.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

</div>

![نمای گرافیکی صفحه اصلی فروشگاه نقلی‌جان](./public/images/noghlijan-hero-high-quality.webp)

---

## 🌷 درباره نقلی‌جان | Our story

**نقلی‌جان** تجربه‌ای برای انتخاب آسان‌تر لباس کودک است؛ از کشف محصولات دخترانه و پسرانه تا مقایسه رنگ، سایز، تصویر، موجودی و قیمت هر ترکیب. زبان طراحی از دنیای رنگ‌های ملایم و تصویرسازی کودکانه الهام گرفته و با دو حالت **Light / Dark** هماهنگ شده است.

> **English:** A kidswear storefront powered by Next.js, Prisma and PostgreSQL, with product variants, an editorial homepage, customer checkout journeys and a bespoke administration area.

## 🧸 Featured experiences

<div align="center">
  <img src="./public/images/noghlijan-hero-light-extended-2026.jpg" alt="هویت بصری حالت روشن نقلی‌جان" width="48%" />
  <img src="./public/images/noghlijan-hero-dark-extended-2026.jpg" alt="هویت بصری حالت تاریک نقلی‌جان" width="48%" />
</div>

| ✨ Experience | Details |
|:--|:--|
| 🏡 **Immersive home** | Hero اختصاصی، معرفی دسته‌ها و روایت اسکرول با GSAP |
| 🛍️ **Product catalog** | لیست محصولات، جست‌وجو، ویژگی‌ها و جزئیات |
| 🎨 **Variant engine** | ترکیب رنگ / سایز، تصاویر اختصاصی، قیمت و موجودی هر انتخاب |
| 🧺 **Cart** | حفظ انتخاب‌های متفاوت یک محصول در سبد |
| 👤 **Customer accounts** | ثبت‌نام، ورود، پروفایل و اطلاعات گیرنده |
| 📦 **Checkout & orders** | ثبت سفارش، نمایش وضعیت پرداخت و مدیریت سفارش |
| 🛠️ **Back office** | محصولات، تنوع‌ها، تصاویر، ورود گروهی Excel و محتوای صفحات |
| 🌗 **Appearance** | Light/Dark، طراحی واکنش‌گرا و RTL |
| 🔌 **Integrations** | مسیرها و تنظیمات اتصال و درگاه‌های پرداخت، **مشروط به پیکربندی و آزمون واقعی** |

## 🗺️ Main routes

| Destination | Path |
|:--|:--|
| خانه / Home | `/` |
| فروشگاه / Shop | `/shop` |
| محصول / Product | `/shop/[slug]` |
| سبد خرید / Cart | `/cart` |
| ورود / Login | `/login` |
| پروفایل / Account | `/account` |
| تکمیل سفارش / Checkout | `/checkout` |
| معرفی، تماس، قوانین | `/about` · `/contact` · `/terms` |
| مدیریت / Admin | `/admin` |

## 🏗️ Under the hood

~~~text
Next.js App Router (React + TypeScript)
 ├── Storefront / catalog / product pages
 ├── Customer authentication and checkout
 ├── Administration + site content editor
 └── Route handlers /api/*
            │
            ▼
 Prisma Client
            │
            ▼
 PostgreSQL (products, variants, orders,
 customers, content and integrations)
            │
            └── Payment APIs / external integrations
                (only when configured)
~~~

**Important directories**

- `src/app/`: UI routes and backend API handlers.
- `src/components/`: product gallery, variant picker, customer journey and admin UI.
- `src/context/`: cart state.
- `src/lib/`: Prisma, authentication, product operations and payment adapters.
- `prisma/schema.prisma`: primary PostgreSQL schema.
- `prisma/migrations/` and `scripts/sql/`: migrations and additional database upgrades.
- `public/images/`: brand, hero and product imagery.
- `docs/BALE-PAY.md`: Bale wallet setup notes.

## ⚡ Local setup

**Prerequisites:** Node.js compatible with the project's Next.js version, npm and a working PostgreSQL database.

~~~bash
git clone https://github.com/MxPersonal/noghlijan-x-mrhossein.git
cd noghlijan-x-mrhossein
npm ci
cp .env.example .env.local
~~~

Set your real `DATABASE_URL` in the local environment **in addition to** the payment/auth template values. For Prisma tooling, check `prisma.config.ts` and project migration history before applying changes.

~~~bash
npx prisma generate
npm run db:migrate
npm run dev
~~~

Visit `http://localhost:3000`.

> **Database caution:** `db:migrate` is intended for development; review migration history and additional `scripts/sql/` patches before initializing a new database. For an existing production database, do not run destructive reset commands or blindly replay migrations.

| Script | Task |
|:--|:--|
| `npm run dev` | Start local development |
| `npm run build` | Generate Prisma client + build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |
| `npm test` | Product import, details and search tests |
| `npm run db:seed` | Seed data (review first) |
| `npm run db:upgrade` | Product-variant upgrade script (review first) |
| `npm run db:reset` | **Destructive** database reset; never run on production |

## 💳 Payment integrations / درگاه‌ها

The code contains adapters or endpoints for several payment paths:

| Method | Activation requirement |
|:--|:--|
| **ZarinPal** | Merchant ID and callback validation |
| **AqayePardakht** | Provider PIN and verified integration |
| **Bale Pay** | Bot/provider credentials, mini-app and verified webhook |
| **IRCryptoPay** | Merchant/API keys and verified webhook |
| **NOWPayments** | Provider eligibility approval, API/IPN credentials and a valid, owner-approved conversion rate |

**Having code for a provider does not mean it is active, compliant, or available in your country.** Payment options must remain unavailable when their required configuration is missing. NOWPayments eligibility must be verified directly with the provider for the merchant's jurisdiction.

Reference: [environment template](.env.example) and [Bale Pay instructions](docs/BALE-PAY.md). Never put actual keys in Git, client bundles, screenshots or public logs.

## 🔐 Deployment & security checklist

- Define server-only database, admin and customer-auth secrets. Replace all demo/default credentials before exposure to the public internet.
- Verify session expiration, protected admin routes, user isolation and object-level authorization.
- Deploy with an external PostgreSQL instance; do not assume ephemeral filesystem storage is persistent on Vercel.
- Apply production database migrations through a controlled migration process and take backups.
- Confirm webhook signatures, payment status, amounts, and order reconciliation in sandbox **and** the authorized real environment.
- Validate responsive layout, accessibility, visual contrast and reduced-motion fallback.

**Security review needed:** The current `src/lib/admin.ts` includes a development fallback password when `ADMIN_PASSWORD` is unset. Set a strong value immediately; removing such fallbacks and hardening session expiry should be a priority before production use.

## 🧭 Roadmap / مسیر توسعه

- [ ] Strengthen administrator authentication and session lifetime validation.
- [ ] Add deployment-specific payment E2E and webhook replay tests.
- [ ] Verify every enabled external integration against the connected merchant account.
- [ ] Expand automated accessibility, localization and mobile regression coverage.

These are **future or validation tasks**, not promises of features already released.

## 📄 License

See the repository's [LICENSE](LICENSE). Brand images, logos and product photos may have separate ownership/usage restrictions.

## 🧪 Engineering & merchant readiness | کنترل کیفیت فروشگاه

| Surface | Where to look | Verify before production |
|:--|:--|:--|
| Storefront and product pages | `src/app/` | Responsive product imagery, variants and RTL |
| Product models / data | `prisma/schema.prisma`, `prisma/migrations/` | Schema consistency and migration safety |
| Product search & imports | `src/lib/`, `src/app/api/admin/products/import/` | Validation, duplicate handling and search results |
| Customer accounts | `src/app/api/customer/` | Access controls and account session behavior |
| Orders and checkout | `src/app/api/checkout/`, `src/app/api/admin/orders/` | Price integrity and server-side validation |
| Payment callbacks | `src/app/api/payment/`, `docs/BALE-PAY.md` | Signature checks, replay safety and reconciliation |
| Editorial content | `src/app/api/admin/site-content/` | Updates reflected in both languages |

~~~bash
npm test
npm run lint
npm run build
~~~

### 🔒 Payment activation is not a UI toggle

Each payment option requires a separate eligibility, merchant-account, callback/webhook and transaction test. Environment variables listed in [`.env.example`](.env.example) are *configuration slots*, not evidence that a provider is enabled. Never substitute a guessed exchange rate for `CRYPTO_USD_TOMAN_RATE`, and do not enable international crypto payment access without confirmation of account and jurisdiction eligibility.

**Database safety:** review `DATABASE_URL`, Prisma migration history and backup strategy before production schema changes. Do not run `npm run db:reset` against valuable databases; it is destructive. Never expose payment secrets, admin credentials or customer authentication secrets in public `NEXT_PUBLIC_*` variables.

### 📦 Contributor workflow

Change product content and variant rules deliberately, keep bilingual storefront labels consistent, and test a complete guest-to-account-to-checkout journey for every major commerce update. GitHub commits on the connected production branch may initiate automatic Vercel deployment; verify the result rather than assuming every integration has succeeded.

<div align="center">

**نقلی‌جان · برای کوچولوهایی که دنیای بزرگی دارن.** 🌼

</div>
