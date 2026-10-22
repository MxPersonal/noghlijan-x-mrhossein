import type { Metadata } from "next";
import { CustomerAccessForm } from "@/components/customer/CustomerAccessForm";
import { getCustomer } from "@/lib/customer-auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "ورود و ثبت‌نام مشتریان" };
export const dynamic = "force-dynamic";

export default async function CustomerLoginPage({
  searchParams,
}: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  const nextPath = params.next === "/checkout" || params.next === "/cart" ||
    (typeof params.next === "string" && /^\/shop\/[a-zA-Z0-9_-]+$/.test(params.next))
    ? params.next : "/account";
  if (await getCustomer()) redirect(nextPath);
  return <CustomerAccessForm nextPath={nextPath} />;
}
