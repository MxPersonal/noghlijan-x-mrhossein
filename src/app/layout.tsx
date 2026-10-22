import type { Metadata } from "next";
import Script from "next/script";
import { Lalezar, Vazirmatn } from "next/font/google";
import { CartProvider } from "@/context/cart";
import { Header } from "@/components/Header";
import { PendingCartRestore } from "@/components/customer/PendingCartRestore";
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
    default: "نقلی‌جان | لباس بچه‌گانه",
    template: "%s | نقلی‌جان",
  },
  description: "فروشگاه پوشاک بچه‌گانه نقلی‌جان؛ لباس‌های شاد، لطیف و دوست‌داشتنی برای کودکان.",
  openGraph: {
    type: "website",
    locale: "fa_IR",
    title: "نقلی‌جان | لباس بچه‌گانه",
    description: "فروشگاه لباس بچه‌گانه نقلی‌جان — نرم، شاد و باکیفیت",
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
          <PendingCartRestore />
          <Header />
          <main className="relative z-10 flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
