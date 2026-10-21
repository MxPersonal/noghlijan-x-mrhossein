import type { Metadata } from "next";
import Link from "next/link";
import { InfoPageHero } from "@/components/InfoPageHero";
import { getSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getSiteContent();
  return { title: data.termsTitle, description: data.termsSubtitle, robots: data.termsPublished ? undefined : { index: false, follow: true } };
}

export default async function TermsPage() {
  const data = await getSiteContent();
  return (
    <div className="info-page mx-auto w-full max-w-7xl px-4 pb-16 pt-7 sm:px-6">
      <InfoPageHero title={data.termsTitle} subtitle={data.termsSubtitle} eyebrow="TERMS & CONDITIONS" shopLabel={data.heroShopButton} />
      <section className="info-terms-shell" aria-labelledby="terms-list-title">
        <div className="info-section-heading">
          <p className="info-section-kicker">{data.termsSectionLabel}</p>
          <h2 id="terms-list-title">{data.termsUpdatedLabel}</h2>
        </div>
        {!data.termsPublished ? (
          <div className="info-terms-draft" role="status">
            <span aria-hidden="true">✳</span>
            <div>
              <h3>{data.termsDraftTitle}</h3>
              <p>{data.termsNotice}</p>
              <p>{data.termsDraftHelp}</p>
              <Link href="/contact">{data.termsDraftContactButton} <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
        ) : (
          <div className="info-terms-list">
            {data.termsSections.map((section,index) => (
              <article key={index} className="info-term-card">
                <span className="info-term-number">{(index + 1).toLocaleString("fa-IR").padStart(2, "۰")}</span>
                <div><h3>{section.heading}</h3><p>{section.body}</p></div>
              </article>
            ))}
          </div>
        )}
      </section>
      <div className="info-bottom-banner">
        <span aria-hidden="true">✿</span>
        <p>{data.termsBottomText}</p>
        <Link href="/contact">{data.termsBottomLink} <span aria-hidden="true">↗</span></Link>
      </div>
    </div>
  );
}
