import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCustomer } from "@/lib/customer-auth";
import { CustomerCheckout } from "@/components/customer/CustomerCheckout";
import { paymentMethods } from "@/lib/payment-providers";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "تسویه‌حساب", robots: { index: false, follow: false } };

export default async function CheckoutPage() {
  const customer=await getCustomer();
  if (!customer) redirect("/login?next=%2Fcheckout");
  return <CustomerCheckout methods={paymentMethods()} customer={{
    fullName:customer.fullName, mobile:customer.mobile, address:customer.address,
    postalCode:customer.postalCode, phoneVerified:customer.phoneVerified,
  }}/>;
}
