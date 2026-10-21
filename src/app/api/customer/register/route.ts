import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consumeAuthAttempt, createCustomerSession, hashPassword, isAuthConfigured,
  nationalIdFingerprint, normalizeMobile, normalizeNationalId, publicCustomer, sameOrigin, validateEmail } from "@/lib/customer-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "درخواست نامعتبر است" }, { status: 403 });
  if (!isAuthConfigured()) return NextResponse.json({ error: "ثبت‌نام هنوز فعال نشده است؛ تنظیم امنیتی سرور کامل نیست." }, { status: 503 });
  const length = Number(req.headers.get("content-length") || 0);
  if (length > 6000) return NextResponse.json({ error: "اطلاعات بیش از حد مجاز است" }, { status: 413 });
  let body: Record<string, unknown>;
  try {
    const data: unknown = await req.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) throw Error("bad");
    body = data as Record<string,unknown>;
  } catch { return NextResponse.json({ error: "فرمت درخواست نامعتبر است" }, { status: 400 }); }

  const mobile = normalizeMobile(body.mobile);
  const nationalId = normalizeNationalId(body.nationalId);
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!mobile || !nationalId || fullName.length < 3 || fullName.length > 120 ||
      password.length < 10 || password.length > 128) {
    return NextResponse.json({ error: "نام، موبایل، کد ملی یا رمز عبور معتبر نیست. رمز باید دست‌کم ۱۰ نویسه داشته باشد." }, { status: 422 });
  }
  let email: string | null;
  try { email = validateEmail(body.email); }
  catch { return NextResponse.json({ error: "ایمیل معتبر نیست" }, { status: 422 }); }

  try {
    if (!await consumeAuthAttempt(req, "signup")) {
      return NextResponse.json({ error: "تلاش بیش از حد؛ ۱۵ دقیقه بعد دوباره امتحان کن." }, { status: 429 });
    }
    const fingerprint = nationalIdFingerprint(nationalId);
    const existing = await prisma.customer.findFirst({
      where: { OR: [{ mobile }, { nationalIdDigest: fingerprint }] },
      select: { id: true },
    });
    if (existing) return NextResponse.json({ error: "با این اطلاعات قبلاً حسابی ثبت شده است. برای ورود اقدام کن." }, { status: 409 });
    const passwordHash = await hashPassword(password);
    const customer = await prisma.customer.create({
      data: { fullName, mobile, nationalIdDigest: fingerprint,
        nationalIdLast4: nationalId.slice(-4), passwordHash, email, phoneVerified: false },
    });
    await createCustomerSession(customer.id);
    return NextResponse.json({ customer: publicCustomer(customer), mobileVerification: "not_configured" }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002")
      return NextResponse.json({ error: "این اطلاعات قبلاً ثبت شده‌اند" }, { status: 409 });
    console.error("Customer registration failed", error);
    return NextResponse.json({ error: "ثبت‌نام انجام نشد؛ دوباره تلاش کن." }, { status: 500 });
  }
}
