import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/ProductCard";
import { HomeScrollExperience } from "@/components/HomeScrollExperience";

export const dynamic = "force-dynamic";

const HERO_LIGHT = "/images/noghlijan-hero-high-quality.webp";
const HERO_DARK = "/images/noghlijan-hero-dark-8k.webp";

const journeys = [
  { number: "۰۱", title: "سلیقه‌ش رو پیدا کن", text: "از بین لباس‌های دخترانه و پسرانه، به استایل موردعلاقهٔ کوچولوت برس.", tone: "rose" },
  { number: "۰۲", title: "جزئیات رو ببین", text: "تصویر، ردهٔ سنی، قیمت و مشخصات هر محصول رو یک‌جا بررسی کن.", tone: "butter" },
  { number: "۰۳", title: "آمادهٔ لبخندش شو", text: "انتخابت رو به سبد خرید اضافه کن و مسیر سفارش رو ادامه بده.", tone: "sage" },
];

export default async function HomePage() {
  const [featured, girlPick, boyPick] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { labels: { select: { name: true } } },
    }),
    prisma.product.findFirst({
      where: { isActive: true, gender: "دخترانه" },
      orderBy: { createdAt: "desc" },
      select: { name: true, imageUrl: true },
    }),
    prisma.product.findFirst({
      where: { isActive: true, gender: "پسرانه" },
      orderBy: { createdAt: "desc" },
      select: { name: true, imageUrl: true },
    }),
  ]);

  return (
    <div className="home-editorial" id="home-experience">
      <HomeScrollExperience />

      <section id="home-intro" data-home-panel className="home-panel home-scene" aria-labelledby="home-title">
        <div className="home-scene-inner mx-auto w-full max-w-7xl">
          <div className="home-hero-content">
            <p data-motion="label" className="home-eyebrow">
              <span className="home-eyebrow-spark" aria-hidden="true">✳</span>
              NOGHLIJAN · LITTLE MOMENTS
            </p>
            <h1 data-motion="title" id="home-title" className="home-display">
              یه دنیا <span>رنگ</span>
              <span className="home-display-line">برای روزهای کوچیک</span>
            </h1>
            <p data-motion="copy" className="home-lead">
              دنیای دوست‌داشتنی لباس‌های بچه‌گانه؛ جایی برای انتخاب‌های راحت،
              رنگ‌های شاد و شیطنت‌های قشنگ هر روز.
            </p>
            <div data-motion="actions" className="home-hero-actions">
              <Link href="/shop" className="home-button home-button--solid">
                کشف لباس‌ها <span aria-hidden="true">↗</span>
              </Link>
              <a href="#home-collections" className="home-button home-button--outline">
                انتخاب بر اساس استایل <span aria-hidden="true">↓</span>
              </a>
            </div>
            <div data-motion="detail" className="home-hero-footnote">
              <span className="home-hero-footnote-line" aria-hidden="true" />
              <span>برای کوچولوهایی که دنیای بزرگی دارن</span>
            </div>
          </div>

          <div className="home-hero-media" data-motion="visual">
            <div className="home-hero-art" data-parallax>
              <Image
                src={HERO_LIGHT}
                alt="دختر و پسربچه در پوشاک رنگارنگ نقلی‌جان با نمادهای ضمانت مرجوعی، تضمین کیفیت و خرید"
                width={1536}
                height={1536}
                priority
                className="home-artwork home-artwork--light"
                sizes="(max-width: 1023px) 96vw, (max-width: 1440px) 57vw, 780px"
              />
              <Image
                src={HERO_DARK}
                alt="نسخهٔ شبانهٔ تصویر پوشاک بچه‌گانهٔ نقلی‌جان"
                width={8192}
                height={8192}
                loading="lazy"
                className="home-artwork home-artwork--dark"
                sizes="(max-width: 1023px) 96vw, (max-width: 1440px) 57vw, 780px"
              />
            </div>
          </div>
          <span aria-hidden="true" className="home-scene-serial">01 / 04</span>
        </div>
      </section>

      <section id="home-collections" data-home-panel className="home-panel home-collections" aria-labelledby="collections-title">
        <div className="home-panel-inner mx-auto w-full max-w-7xl">
          <div className="home-section-head">
            <div>
              <p data-motion="label" className="home-section-kicker"><span>۰۲</span> / دنیای انتخاب</p>
              <h2 data-motion="title" id="collections-title" className="home-section-title">
                هر کوچولو، <em>یه استایل.</em>
              </h2>
            </div>
            <p data-motion="copy" className="home-section-intro">
              با یک انتخاب ساده شروع کن. لباس‌های رنگی و راحتی که
              برای هر روز کوچولوت منتظرن.
            </p>
          </div>

          <div className="home-collection-grid">
            <Link data-motion="card" href="/shop?gender=دخترانه" className="home-collection-card home-collection-card--rose group">
              <span className="home-collection-watermark" aria-hidden="true">01</span>
              <div className="home-collection-copy">
                <p className="home-collection-kicker">FOR HER · دخترانه</p>
                <h3>پر از رنگ<br />و خنده</h3>
                <span className="home-collection-cta">کشف دخترانه <span aria-hidden="true">↗</span></span>
              </div>
              <div className="home-collection-visual" aria-hidden="true">
                <span className="home-collection-visual-orbit" />
                {girlPick?.imageUrl ? (
                  <Image src={girlPick.imageUrl} alt="" fill
                    unoptimized={/^https?:\/\//i.test(girlPick.imageUrl)}
                    className="home-collection-product" sizes="(max-width: 1023px) 45vw, 300px" />
                ) : <span className="home-collection-illustration">✿</span>}
              </div>
            </Link>

            <Link data-motion="card" href="/shop?gender=پسرانه" className="home-collection-card home-collection-card--sky group">
              <span className="home-collection-watermark" aria-hidden="true">02</span>
              <div className="home-collection-copy">
                <p className="home-collection-kicker">FOR HIM · پسرانه</p>
                <h3>برای کلی<br />ماجراجویی</h3>
                <span className="home-collection-cta">کشف پسرانه <span aria-hidden="true">↗</span></span>
              </div>
              <div className="home-collection-visual" aria-hidden="true">
                <span className="home-collection-visual-orbit" />
                {boyPick?.imageUrl ? (
                  <Image src={boyPick.imageUrl} alt="" fill
                    unoptimized={/^https?:\/\//i.test(boyPick.imageUrl)}
                    className="home-collection-product" sizes="(max-width: 1023px) 45vw, 300px" />
                ) : <span className="home-collection-illustration">✦</span>}
              </div>
            </Link>
          </div>
          <div data-motion="detail" className="home-collection-footer">
            <span>انتخابِ راحت، لبخندِ بیشتر</span>
            <Link href="/shop">دیدن همهٔ لباس‌ها <span aria-hidden="true">←</span></Link>
          </div>
        </div>
      </section>

      <section id="home-new" data-home-panel className="home-panel home-new-arrivals" aria-labelledby="new-products-title">
        <div className="home-panel-inner mx-auto w-full max-w-7xl">
          <div className="home-section-head home-section-head--products">
            <div>
              <p data-motion="label" className="home-section-kicker"><span>۰۳</span> / تازه رسیده‌ها</p>
              <h2 data-motion="title" id="new-products-title" className="home-section-title">
                تازه از راه <em>رسیدن!</em>
              </h2>
            </div>
            <div data-motion="copy" className="home-products-intro">
              <p>محبوب‌های جدید برای روزهایی که قراره خاص باشن.</p>
              <Link href="/shop" className="home-inline-link">تمام محصولات <span aria-hidden="true">↗</span></Link>
            </div>
          </div>

          {featured.length ? (
            <div className="home-featured-grid">
              {featured.map((product, index) => (
                <div key={product.id} data-motion="card" className="home-featured-item">
                  <span className="home-featured-number" aria-hidden="true">0{index + 1}</span>
                  <ProductCard {...product} />
                </div>
              ))}
            </div>
          ) : (
            <div data-motion="card" className="home-products-empty">
              <span aria-hidden="true" className="home-products-empty-flower">✿</span>
              <div><h3>یه عالمه خوشگلی در راهه</h3><p>به‌زودی لباس‌های جدید اینجا ظاهر می‌شن.</p></div>
              <Link href="/shop" className="home-inline-link">ورود به فروشگاه ←</Link>
            </div>
          )}

          <div data-motion="detail" className="home-product-bottom">
            <span>هر انتخاب، یک خاطرهٔ قشنگ</span>
            <span aria-hidden="true">✳</span>
            <span>نُقلی‌جان</span>
          </div>
        </div>
      </section>

      <section id="home-how" data-home-panel className="home-panel home-journey" aria-labelledby="journey-title">
        <div className="home-panel-inner home-journey-inner mx-auto w-full max-w-7xl">
          <div className="home-journey-intro">
            <p data-motion="label" className="home-section-kicker"><span>۰۴</span> / خرید راحت</p>
            <h2 data-motion="title" id="journey-title" className="home-section-title">
              از یه انتخاب <em>کوچولو</em><br /> تا کلی خوشحالی.
            </h2>
            <p data-motion="copy" className="home-section-intro">
              هیچ پیچیدگی‌ای لازم نیست. لباس‌ها رو ببین، مناسب‌ترینش رو انتخاب کن و به سبد خریدت اضافه کن.
            </p>
            <div data-motion="actions">
              <Link href="/shop" className="home-button home-button--solid">شروع خرید <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
          <div className="home-journey-steps">
            {journeys.map((step) => (
              <div data-motion="card" className={"home-journey-step home-journey-step--" + step.tone} key={step.number}>
                <span className="home-journey-number">{step.number}</span>
                <div><h3>{step.title}</h3><p>{step.text}</p></div>
                <span className="home-journey-star" aria-hidden="true">✳</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
