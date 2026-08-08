import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { isAdminAuthenticated } from "@/lib/admin";

export const runtime = "nodejs";

const MAX_INPUT_PIXELS = 40_000_000;
const MAX_IMAGE_DIMENSION = 2_000;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return errorResponse("Unauthorized", 401);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("درخواست آپلود نامعتبر است", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return errorResponse("فایل تصویر ارسال نشده است", 400);
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return errorResponse("فرمت تصویر باید JPEG، PNG یا WebP باشد", 415);
  }
  if (file.size === 0) {
    return errorResponse("فایل تصویر خالی است", 400);
  }

  let image: Buffer;
  try {
    const input = Buffer.from(await file.arrayBuffer());
    image = await sharp(input, {
      failOn: "error",
      limitInputPixels: MAX_INPUT_PIXELS,
    })
      .rotate()
      .resize({
        width: MAX_IMAGE_DIMENSION,
        height: MAX_IMAGE_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85, effort: 4 })
      .toBuffer();
  } catch {
    return errorResponse("فایل انتخاب‌شده تصویر معتبری نیست", 400);
  }

  const fileName = `${randomUUID()}.webp`;
  const uploadDirectory = join(
    process.cwd(),
    "public",
    "images",
    "products",
  );

  try {
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(join(uploadDirectory, fileName), image, { flag: "wx" });
  } catch (error) {
    console.error("Failed to store product image", error);
    return errorResponse("ذخیره‌سازی تصویر در سرور ناموفق بود", 500);
  }

  return NextResponse.json(
    { imageUrl: `/images/products/${fileName}` },
    { status: 201 },
  );
}
