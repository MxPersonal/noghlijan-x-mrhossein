import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { finalizeOrder, verifyAqayepardakht } from "@/lib/payment-providers";

export const runtime = "nodejs";

async function callback(req: Request) {
  let transid = "";
  let tracking = "";
  const u = new URL(req.url);
  if (req.method === "POST") {
    const type = req.headers.get("content-type") || "";
    try {
      if (type.includes("json")) {
        const data = await req.json() as Record<string,unknown>;
        transid = String(data.transid ?? "");
        tracking = String(data.tracking_number ?? "");
      } else {
        const form = await req.formData();
        transid = String(form.get("transid") ?? "");
        tracking = String(form.get("tracking_number") ?? "");
      }
    } catch { /* Untrusted gateway callback; report failure, never mark paid. */ }
  } else {
    transid = u.searchParams.get("transid") ?? "";
    tracking = u.searchParams.get("tracking_number") ?? "";
  }
  const resultUrl = new URL("/payment/result", u.origin);
  if (!/^[a-zA-Z0-9_-]{8,150}$/.test(transid)) {
    resultUrl.searchParams.set("message", "invalid"); return NextResponse.redirect(resultUrl, 303);
  }
  const order = await prisma.order.findFirst({ where: { authority: transid, paymentProvider: "aqayepardakht" } });
  if (!order) { resultUrl.searchParams.set("message", "notfound"); return NextResponse.redirect(resultUrl, 303); }
  resultUrl.searchParams.set("orderId", order.id);
  if (order.status === "PENDING" && tracking) {
    try {
      const checked = await verifyAqayepardakht({ transid, amountToman: order.total });
      if (checked.ok) await finalizeOrder(order.id, "aqayepardakht", checked.refId || tracking);
    } catch (error) {
      console.error("Aqayepardakht server verification failed", order.id, error);
    }
  }
  return NextResponse.redirect(resultUrl, 303);
}

export async function POST(req: Request) { return callback(req); }
export async function GET(req: Request) { return callback(req); }
