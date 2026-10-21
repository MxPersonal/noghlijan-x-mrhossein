import type { Metadata } from "next";
import Link from "next/link";
import { InfoPageHero } from "@/components/InfoPageHero";
import { getSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getSiteContent();
  return { title: data.aboutTitle, description: data.aboutSubtitle || data.aboutParagraphOne.slice(0, 155) };
}

export default async function AboutPage() {
  const data = await getSiteContent();
  return (
    <main className="info-page mx-auto w-full max-w-7xl px-4 pb-16 pt-7 sm:px-6">
      <InfoPageHero title={data.aboutTitle} subtitle={data.aboutSubtitle} eyebrow="ABOUT US" />
      <section className="info-about-body" aria-label="آشنایی با نقلی‌جان">
        <div className="info-about-illustration" aria-hidden="true">
          <span>✿</span><span>نقلی‌جان</span><small>LITTLE MOMENTS</small>
        </div>
        <div className="info-about-story">
          <p className="info-section-kicker">داستان ما / OUR STORY</p>
          <h2>از رنگ‌های شیرین تا انتخاب‌های دوست‌داشتنی</h2>
          <div className="info-about-paragraphs">
            {data.aboutParagraphOne && <p>{data.aboutParagraphOne}</p>}
            {data.aboutParagraphTwo && <p>{data.aboutParagraphTwo}</p>}
          </div>
          <Link href="/shop" className="info-page-primary">{data.aboutShopButton || "مشاهدهٔ فروشگاه"} <span aria-hidden="true">←</span></Link>
        </div>
      </section>
      <div className="info-bottom-banner">
        <span aria-hidden="true">✳</span>
        <p>هر روز کوچیک، یه فرصت برای خاطره‌های بزرگ</p>
        <Link href="/contact">ارتباط با ما <span aria-hidden="true">↗</span></Link>
      </div>
    </main>
  );
}
