import type { Metadata } from "next";
import Script from "next/script";
import { Lalezar, Vazirmatn } from "next/font/google";
import { CartProvider } from "@/context/cart";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

const lalezar = Lalezar({
  variable: "--font-lalezar",
  subsets: ["arabic"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "کلوث استور | لباس بچه‌گانه",
    template: "%s | کلوث استور",
  },
  description: "فروشگاه لباس بچه‌گانه کلوث استور — نرم، شاد و باکیفیت",
  openGraph: {
    type: "website",
    locale: "fa_IR",
    title: "کلوث استور | لباس بچه‌گانه",
    description: "فروشگاه لباس بچه‌گانه کلوث استور — نرم، شاد و باکیفیت",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      suppressHydrationWarning
      className={`${vazirmatn.variable} ${lalezar.variable} h-full`}
    >
      <head>
        <Script src="/theme-init.js" strategy="beforeInteractive" />
      </head>
      <body className="site-bg relative flex min-h-full flex-col antialiased">
        <CartProvider>
          <Header />
          <main className="relative z-10 flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
