import "server-only";
import { createHash, createHmac, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const scrypt = promisify(nodeScrypt);
export const CUSTOMER_COOKIE = "noghlijan_customer_session";
const SESSION_DAYS = 14;

export function normalizeDigits(value: string): string {
  return value.replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 1632));
}

export function normalizeMobile(input: unknown): string {
  if (typeof input !== "string") return "";
  let value = normalizeDigits(input).replace(/[\s()-]/g, "");
  if (value.startsWith("+98")) value = "0" + value.slice(3);
  else if (value.startsWith("0098")) value = "0" + value.slice(4);
  else if (value.startsWith("98") && value.length === 12) value = "0" + value.slice(2);
  return /^09\d{9}$/.test(value) ? value : "";
}

export function normalizeNationalId(input: unknown): string {
  if (typeof input !== "string") return "";
  const value = normalizeDigits(input).trim();
  if (!/^\d{10}$/.test(value) || /^(\d)\1{9}$/.test(value)) return "";
  const check = Number(value[9]);
  const sum = [...value.slice(0,9)].reduce((acc, n, i) => acc + Number(n) * (10 - i), 0) % 11;
  return (sum < 2 ? check === sum : check === 11 - sum) ? value : "";
}

export function normalizePostal(input: unknown): string {
  if (typeof input !== "string") return "";
  const value = normalizeDigits(input).trim().replace(/[-\s]/g, "");
  return /^\d{10}$/.test(value) ? value : "";
}

export function validateEmail(input: unknown): string | null {
  if (input == null || input === "") return null;
  if (typeof input !== "string") throw new Error("ایمیل معتبر نیست.");
  const value = input.trim().toLowerCase();
  if (value.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error("ایمیل معتبر نیست.");
  return value;
}

function authSecret() {
  const key = process.env.CUSTOMER_AUTH_SECRET;
  if (!key || key.length < 32) throw new Error("CUSTOMER_AUTH_SECRET is missing or too short");
  return key;
}

export function nationalIdFingerprint(nationalId: string): string {
  return createHmac("sha256", authSecret()).update("iran-national-id:v1:" + nationalId).digest("hex");
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64) as Buffer;
  return "scrypt:v1:" + salt + ":" + derived.toString("hex");
}

export async function verifyPassword(password: string, encoded: string) {
  const parts = encoded.split(":");
  if (parts.length !== 4 || parts[0] !== "scrypt" || parts[1] !== "v1") return false;
  const hash = Buffer.from(parts[3], "hex");
  if (hash.length !== 64) return false;
  const proposed = await scrypt(password, parts[2], 64) as Buffer;
  return timingSafeEqual(proposed, hash);
}

function sessionHash(token: string) { return createHash("sha256").update(token).digest("hex"); }

export async function createCustomerSession(customerId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await prisma.customerSession.create({ data: { id: sessionHash(token), customerId, expiresAt } });
  const jar = await cookies();
  jar.set(CUSTOMER_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", expires: expiresAt,
  });
}

export async function clearCustomerSession() {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_COOKIE)?.value;
  if (token && token.length < 200) await prisma.customerSession.deleteMany({ where: { id: sessionHash(token) } });
  jar.set(CUSTOMER_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: 0 });
}

export async function getCustomer() {
  const token = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (!token || token.length < 35 || token.length > 200) return null;
  const session = await prisma.customerSession.findFirst({
    where: { id: sessionHash(token), expiresAt: { gt: new Date() } },
    include: { customer: true },
  });
  return session?.customer ?? null;
}

export function publicCustomer(customer: NonNullable<Awaited<ReturnType<typeof getCustomer>>>) {
  return {
    id: customer.id,
    fullName: customer.fullName,
    mobile: customer.mobile,
    email: customer.email,
    nationalIdMasked: "******" + customer.nationalIdLast4,
    phoneVerified: customer.phoneVerified,
    postalCode: customer.postalCode,
    address: customer.address,
    avatarUrl: customer.avatarUrl,
  };
}

export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  return !origin || origin === new URL(req.url).origin;
}

export async function consumeAuthAttempt(req: Request, identity: string) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const ip = forwarded || req.headers.get("x-real-ip") || "unknown";
  const key = createHmac("sha256", authSecret()).update("auth-rate:" + ip + ":" + identity).digest("hex");
  const now = new Date();
  const record = await prisma.customerAuthThrottle.findUnique({ where: { id: key } });
  if (record && record.windowEnds > now && record.attempts >= 12) return false;
  const newWindow = !record || record.windowEnds <= now;
  await prisma.customerAuthThrottle.upsert({
    where: { id: key },
    create: { id: key, attempts: 1, windowEnds: new Date(Date.now() + 15 * 60_000) },
    update: newWindow
      ? { attempts: 1, windowEnds: new Date(Date.now() + 15 * 60_000) }
      : { attempts: { increment: 1 } },
  });
  return true;
}

export function isAuthConfigured() {
  return Boolean(process.env.CUSTOMER_AUTH_SECRET && process.env.CUSTOMER_AUTH_SECRET.length >= 32);
}
