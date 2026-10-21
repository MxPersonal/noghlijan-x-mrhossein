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
    <div className="info-page mx-auto w-full max-w-7xl px-4 pb-16 pt-7 sm:px-6">
      <InfoPageHero title={data.contactTitle} subtitle={data.contactSubtitle} eyebrow="CONTACT" shopLabel={data.heroShopButton} />
      <div className="info-contact-grid">
        <section className="info-contact-section" aria-labelledby="contact-details-title">
          <div className="info-section-heading">
            <p className="info-section-kicker">{data.contactDetailsLabel}</p>
            <h2 id="contact-details-title">{data.contactDetailsTitle} <span>✿</span></h2>
          </div>
          <div className="info-contact-tiles">
            <article className="info-contact-tile">
              <span className="info-contact-icon" aria-hidden="true">☎</span>
              <div>
                <h3>{data.contactPhoneLabel}</h3>
                {hasPhone ? <a dir="ltr" href={"tel:" + cleanPhone(data.contactPhone)}>{data.contactPhone}</a>
                  : <p>{data.contactMissingPhone}</p>}
              </div>
            </article>
            <article className="info-contact-tile">
              <span className="info-contact-icon" aria-hidden="true">✉</span>
              <div>
                <h3>{data.contactEmailLabel}</h3>
                {hasEmail ? <a dir="ltr" href={"mailto:" + data.contactEmail}>{data.contactEmail}</a>
                  : <p>{data.contactMissingEmail}</p>}
              </div>
            </article>
            <article className="info-contact-tile info-contact-tile--address">
              <span className="info-contact-icon" aria-hidden="true">⌖</span>
              <div>
                <h3>{data.contactAddressLabel}</h3>
                {hasAddress ? <p className="info-address-value">{data.contactAddress}</p>
                  : <p>{data.contactMissingAddress}</p>}
              </div>
            </article>
          </div>
        </section>

        <section className="info-map-section" aria-labelledby="contact-map-title">
          <div className="info-section-heading">
            <p className="info-section-kicker">{data.contactMapsLabel}</p>
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
          </div> : <p className="info-services-empty">{data.contactMissingMaps}</p>}
        </section>
      </div>
      <section className="info-social-section" aria-labelledby="contact-social-title">
        <div className="info-section-heading">
          <p className="info-section-kicker">{data.contactSocialLabel}</p>
          <h2 id="contact-social-title">{data.socialHeading}</h2>
          {data.socialDescription && <p>{data.socialDescription}</p>}
        </div>
        {socials.length ? <div className="info-social-links">
          {socials.map((social,index) => (
            <a key={index} href={social.url} target="_blank" rel="noopener noreferrer"
              className="info-social-link"><span aria-hidden="true">✿</span>{social.label}<span aria-hidden="true">↗</span></a>
          ))}
        </div> : <p className="info-services-empty">{data.contactMissingSocials}</p>}
      </section>
      {data.contactClosing && <div className="info-bottom-banner">
        <span aria-hidden="true">✿</span><p>{data.contactClosing}</p>
        <Link href="/about">{data.contactAboutButton} <span aria-hidden="true">↗</span></Link>
      </div>}
    </div>
  );
}
