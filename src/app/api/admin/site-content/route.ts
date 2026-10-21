import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin";
import { getSiteContent, parseSiteContent, saveSiteContent } from "@/lib/site-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const content = await getSiteContent();
    return NextResponse.json({ content }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Reading site content failed", error);
    return NextResponse.json({ error: "خواندن اطلاعات صفحه‌ها ناموفق بود" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const origin = request.headers.get("origin");
  const base = new URL(request.url).origin;
  if (!origin || origin !== base) return NextResponse.json({ error: "مبدأ درخواست معتبر نیست" }, { status: 403 });

  const length = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(length) && length > 160_000) {
    return NextResponse.json({ error: "حجم اطلاعات بیش از حد مجاز است" }, { status: 413 });
  }
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "فرمت درخواست معتبر نیست" }, { status: 400 });
  }
  try {
    const content = parseSiteContent(input);
    await saveSiteContent(content);
    return NextResponse.json({ content, saved: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && /معتبر نیست|طولانی|حداکثر|باید|واردشده|ثبت شود|نویسه/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("Saving public pages failed", error);
    return NextResponse.json({ error: "ذخیرهٔ تنظیمات صفحه‌ها ناموفق بود" }, { status: 500 });
  }
}
