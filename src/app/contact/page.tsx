import type { Metadata } from "next";
import Link from "next/link";
import { InfoPageHero } from "@/components/InfoPageHero";
import { getSiteContent, safePublicUrl } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getSiteContent();
  return { title: data.contactTitle, description: data.contactSubtitle };
}

function cleanPhone(value: string) {
  return value.replace(/[^\d+]/g, "");
}

export default async function ContactPage() {
  const data = await getSiteContent();
  const maps = data.maps.filter(link => safePublicUrl(link.url));
  const socials = data.socials.filter(link => safePublicUrl(link.url));
  const hasPhone = !!cleanPhone(data.contactPhone);
  const hasEmail = !!data.contactEmail;
  const hasAddress = !!data.contactAddress;

  return (
    <main className="info-page mx-auto w-full max-w-7xl px-4 pb-16 pt-7 sm:px-6">
      <InfoPageHero title={data.contactTitle} subtitle={data.contactSubtitle} eyebrow="CONTACT" />
      <div className="info-contact-grid">
        <section className="info-contact-section" aria-labelledby="contact-details-title">
          <div className="info-section-heading">
            <p className="info-section-kicker">راه‌های ارتباطی / GET IN TOUCH</p>
            <h2 id="contact-details-title">از اینجا پیدامون کن <span>✿</span></h2>
          </div>
          <div className="info-contact-tiles">
            <article className="info-contact-tile">
              <span className="info-contact-icon" aria-hidden="true">☎</span>
              <div>
                <h3>{data.contactPhoneLabel}</h3>
                {hasPhone ? <a dir="ltr" href={"tel:" + cleanPhone(data.contactPhone)}>{data.contactPhone}</a>
                  : <p>شماره تماس هنوز ثبت نشده است.</p>}
              </div>
            </article>
            <article className="info-contact-tile">
              <span className="info-contact-icon" aria-hidden="true">✉</span>
              <div>
                <h3>{data.contactEmailLabel}</h3>
                {hasEmail ? <a dir="ltr" href={"mailto:" + data.contactEmail}>{data.contactEmail}</a>
                  : <p>ایمیل هنوز ثبت نشده است.</p>}
              </div>
            </article>
            <article className="info-contact-tile info-contact-tile--address">
              <span className="info-contact-icon" aria-hidden="true">⌖</span>
              <div>
                <h3>{data.contactAddressLabel}</h3>
                {hasAddress ? <p className="info-address-value">{data.contactAddress}</p>
                  : <p>آدرس هنوز ثبت نشده است.</p>}
              </div>
            </article>
          </div>
        </section>

        <section className="info-map-section" aria-labelledby="contact-map-title">
          <div className="info-section-heading">
            <p className="info-section-kicker">پیدا کردن مسیر / FIND OUR PLACE</p>
            <h2 id="contact-map-title">{data.mapsHeading}</h2>
            {data.mapsDescription && <p>{data.mapsDescription}</p>}
          </div>
          <div className="info-map-art" aria-hidden="true">
            <div className="info-map-pin">⌖</div>
            <span>✿</span><span>✧</span><span>✳</span>
          </div>
          {maps.length ? <div className="info-service-grid">
            {maps.map((map, index) => (
              <a key={index} href={map.url} target="_blank" rel="noopener noreferrer"
                className="info-service-link">
                <span className="info-service-dot" aria-hidden="true">⌖</span>
                <span>{map.label}</span><span aria-hidden="true">↗</span>
              </a>
            ))}
          </div> : <p className="info-services-empty">پس از ثبت لینک موقعیت در پنل مدیریت، دکمه‌های مسیریابی اینجا فعال می‌شوند.</p>}
        </section>
      </div>
      <section className="info-social-section" aria-labelledby="contact-social-title">
        <div className="info-section-heading">
          <p className="info-section-kicker">همراه ما باش / SOCIALS</p>
          <h2 id="contact-social-title">{data.socialHeading}</h2>
          {data.socialDescription && <p>{data.socialDescription}</p>}
        </div>
        {socials.length ? <div className="info-social-links">
          {socials.map((social,index) => (
            <a key={index} href={social.url} target="_blank" rel="noopener noreferrer"
              className="info-social-link"><span aria-hidden="true">✿</span>{social.label}<span aria-hidden="true">↗</span></a>
          ))}
        </div> : <p className="info-services-empty">لینک‌های شبکه‌های اجتماعی پس از ثبت در پنل مدیریت، اینجا نمایش داده می‌شوند.</p>}
      </section>
      {data.contactClosing && <div className="info-bottom-banner">
        <span aria-hidden="true">✿</span><p>{data.contactClosing}</p>
        <Link href="/about">آشنایی بیشتر <span aria-hidden="true">↗</span></Link>
      </div>}
    </main>
  );
}
