import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomer, normalizePostal, publicCustomer, sameOrigin, validateEmail } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const customer = await getCustomer();
  if (!customer) return NextResponse.json({ error: "وارد حساب نشده‌اید" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ customer: publicCustomer(customer) }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "درخواست نامعتبر است" }, { status: 403 });
  const customer = await getCustomer();
  if (!customer) return NextResponse.json({ error: "ابتدا وارد حساب شوید" }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    const data: unknown = await req.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) throw Error("bad");
    body = data as Record<string,unknown>;
  } catch { return NextResponse.json({ error: "درخواست نامعتبر است" }, { status: 400 }); }
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";
  const postal = body.postalCode === "" || body.postalCode == null ? null : normalizePostal(body.postalCode);
  if (fullName.length < 3 || fullName.length > 120 || address.length > 700 ||
      (postal === "")) {
    return NextResponse.json({ error: "نام، آدرس یا کد پستی معتبر نیست" }, { status: 422 });
  }
  let email: string | null;
  try { email = validateEmail(body.email); }
  catch { return NextResponse.json({ error: "ایمیل معتبر نیست" }, { status: 422 }); }
  try {
    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data: { fullName, email, postalCode: postal, address: address || null },
    });
    return NextResponse.json({ customer: publicCustomer(updated) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Profile update failed", error);
    return NextResponse.json({ error: "ویرایش اطلاعات انجام نشد" }, { status: 500 });
  }
}
