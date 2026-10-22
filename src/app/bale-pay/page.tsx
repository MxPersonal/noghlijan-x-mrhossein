import type { Metadata } from "next";
import { BalePaymentMiniapp } from "@/components/customer/BalePaymentMiniapp";

export const metadata: Metadata = { title: "پرداخت از کیف پول بله", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function BalePayPage() {
  return <BalePaymentMiniapp />;
}
