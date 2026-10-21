import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { getCustomer, publicCustomer, sameOrigin } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "درخواست نامعتبر است" }, { status: 403 });
  const customer = await getCustomer();
  if (!customer) return NextResponse.json({ error: "ابتدا وارد حساب شوید" }, { status: 401 });
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) return NextResponse.json({ error: "آپلود عکس هنوز تنظیم نشده است" }, { status: 503 });
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
        !file.size || file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "عکس باید PNG، JPG یا WebP و حداکثر ۲ مگابایت باشد" }, { status: 422 });
    }
    const converted = await sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: 18_000_000, failOn: "error",
    }).rotate().resize(360, 360, { fit: "cover", position: "centre" }).webp({ quality: 84 }).toBuffer();
    const folder = "noghlijan/customer-avatars";
    const publicId = customer.id + "-" + randomUUID();
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = createHash("sha1")
      .update("folder=" + folder + "&public_id=" + publicId + "&timestamp=" + timestamp + secret).digest("hex");
    const upload = new FormData();
    upload.append("file", "data:image/webp;base64," + converted.toString("base64"));
    upload.append("api_key", key);
    upload.append("timestamp", timestamp);
    upload.append("signature", signature);
    upload.append("folder", folder);
    upload.append("public_id", publicId);
    const response = await fetch("https://api.cloudinary.com/v1_1/" + encodeURIComponent(cloud) + "/image/upload",
      { method: "POST", body: upload, cache: "no-store" });
    const result = await response.json() as { secure_url?: string };
    if (!response.ok || !result.secure_url?.startsWith("https://res.cloudinary.com/"))
      throw Error("Cloudinary upload failed");
    const updated = await prisma.customer.update({
      where: { id: customer.id }, data: { avatarUrl: result.secure_url },
    });
    return NextResponse.json({ customer: publicCustomer(updated) });
  } catch (error) {
    console.error("Customer avatar upload error", error);
    return NextResponse.json({ error: "آپلود تصویر ناموفق بود" }, { status: 500 });
  }
}
