import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consumeAuthAttempt, createCustomerSession, isAuthConfigured,
  normalizeMobile, publicCustomer, sameOrigin, verifyPassword } from "@/lib/customer-auth";

export const runtime = "nodejs";
const GENERIC = "شماره موبایل یا رمز عبور نادرست است.";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "درخواست نامعتبر است" }, { status: 403 });
  if (!isAuthConfigured()) return NextResponse.json({ error: "ورود هنوز فعال نشده است؛ تنظیمات امنیتی سرور کامل نیست." }, { status: 503 });
  let body: { mobile?: unknown; password?: unknown };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "درخواست نامعتبر است" }, { status: 400 }); }
  const mobile = normalizeMobile(body.mobile);
  const password = typeof body.password === "string" ? body.password : "";
  if (!mobile || !password || password.length > 128)
    return NextResponse.json({ error: GENERIC }, { status: 401 });

  try {
    if (!await consumeAuthAttempt(req, "login")) {
      return NextResponse.json({ error: "تلاش بیش از حد؛ ۱۵ دقیقه بعد دوباره امتحان کن." }, { status: 429 });
    }
    const customer = await prisma.customer.findUnique({ where: { mobile } });
    if (!customer) return NextResponse.json({ error: GENERIC }, { status: 401 });
    if (customer.lockedUntil && customer.lockedUntil > new Date()) {
      return NextResponse.json({ error: "حساب موقتاً محدود شده؛ کمی بعد دوباره امتحان کن." }, { status: 429 });
    }
    const match = await verifyPassword(password, customer.passwordHash);
    if (!match) {
      const attempts = customer.failedLogins + 1;
      await prisma.customer.update({ where: { id: customer.id },
        data: { failedLogins: attempts, lockedUntil: attempts >= 6 ? new Date(Date.now() + 15 * 60_000) : null } });
      return NextResponse.json({ error: GENERIC }, { status: 401 });
    }
    await prisma.customer.update({ where: { id: customer.id }, data: { failedLogins: 0, lockedUntil: null } });
    await createCustomerSession(customer.id);
    return NextResponse.json({ customer: publicCustomer(customer) });
  } catch (error) {
    console.error("Customer login failed", error);
    return NextResponse.json({ error: "ورود انجام نشد؛ دوباره تلاش کن." }, { status: 500 });
  }
}
