import { NextResponse } from "next/server";
import { clearCustomerSession, sameOrigin } from "@/lib/customer-auth";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "درخواست نامعتبر است" }, { status: 403 });
  await clearCustomerSession();
  return NextResponse.json({ ok: true });
}
