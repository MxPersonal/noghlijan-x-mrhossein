import Image from "next/image";
import Link from "next/link";

export function InfoPageHero({
  title, subtitle, eyebrow, shopLabel, children,
}: {
  title: string;
  subtitle: string;
  eyebrow: string;
  shopLabel: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="info-page-hero" aria-labelledby="info-page-title">
      <div className="info-page-hero-copy">
        <p className="info-page-kicker">✳ NOGHLIJAN / {eyebrow}</p>
        <h1 id="info-page-title">{title}</h1>
        {subtitle && <p className="info-page-subtitle">{subtitle}</p>}
        <div className="info-page-actions">
          {children}
          <Link href="/shop" className="info-page-hero-link">{shopLabel} <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
      <div className="info-page-art" aria-hidden="true">
        <Image src="/images/noghlijan-hero-high-quality.webp" alt="" width={1536} height={1536}
          className="info-artwork info-artwork--light" sizes="(max-width: 700px) 75vw, 420px" />
        <Image src="/images/noghlijan-hero-dark-8k.webp" alt="" width={8192} height={8192}
          className="info-artwork info-artwork--dark" sizes="(max-width: 700px) 75vw, 420px" />
      </div>
    </section>
  );
}
