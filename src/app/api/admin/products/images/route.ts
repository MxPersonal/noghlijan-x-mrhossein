import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { isAdminAuthenticated } from "@/lib/admin";

export const runtime = "nodejs";
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_INPUT_PIXELS = 40_000_000;
const MAX_DIMENSION = 2000;
const MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "مبدأ درخواست معتبر نیست" }, { status: 403 });
  }
  let formData: FormData;
  try { formData = await request.formData(); }
  catch { return NextResponse.json({ error: "درخواست آپلود نامعتبر است" }, { status: 400 }); }
  const file = formData.get("file");
  if (!(file instanceof File) || !MIME.has(file.type) || file.size === 0 || file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "تصویر باید JPEG، PNG یا WebP و حداکثر ۴ مگابایت باشد" }, { status: 400 });
  }
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !apiKey || !apiSecret) {
    return NextResponse.json({
      error: "ذخیره‌سازی ابری تنظیم نشده است. متغیرهای Cloudinary را در Vercel ثبت کنید. فایل محلی در Vercel ماندگار نیست.",
    }, { status: 503 });
  }
  try {
    const processed = await sharp(Buffer.from(await file.arrayBuffer()), {
      failOn: "error", limitInputPixels: MAX_INPUT_PIXELS,
    }).rotate().resize({
      width: MAX_DIMENSION, height: MAX_DIMENSION,
      fit: "inside", withoutEnlargement: true,
    }).webp({ quality: 88, effort: 4 }).toBuffer();

    const folder = "noghlijan/products";
    const publicId = randomUUID();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = createHash("sha1")
      .update("folder=" + folder + "&public_id=" + publicId + "&timestamp=" + timestamp + apiSecret)
      .digest("hex");
    const upload = new FormData();
    upload.append("file", "data:image/webp;base64," + processed.toString("base64"));
    upload.append("api_key", apiKey);
    upload.append("timestamp", timestamp);
    upload.append("signature", signature);
    upload.append("public_id", publicId);
    upload.append("folder", folder);

    const response = await fetch("https://api.cloudinary.com/v1_1/" + encodeURIComponent(cloud) + "/image/upload", {
      method: "POST", body: upload, cache: "no-store",
    });
    const result = await response.json() as { secure_url?: string; error?: { message?: string } };
    if (!response.ok || !result.secure_url?.startsWith("https://res.cloudinary.com/")) {
      console.error("Cloud media upload failed", response.status, result.error?.message);
      return NextResponse.json({ error: "آپلود ابری ناموفق بود؛ تنظیمات Cloudinary را بررسی کنید" }, { status: 502 });
    }
    return NextResponse.json({ imageUrl: result.secure_url }, { status: 201 });
  } catch (error) {
    console.error("Cloud media conversion/upload failed", error);
    return NextResponse.json({ error: "پردازش یا آپلود تصویر ناموفق بود" }, { status: 500 });
  }
}
