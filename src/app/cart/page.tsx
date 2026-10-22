import { redirect } from "next/navigation";
import { getCustomer } from "@/lib/customer-auth";
import { CartContents } from "@/components/customer/CartContents";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  if (!(await getCustomer())) redirect("/login?next=%2Fcart");
  return <CartContents />;
}
