import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export type BaleApiResult<T> = {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
};

export const BALE_TEST_TOKEN = "WALLET-TEST-1111111111111111";

/** Explicit merchant activation: protects storefront from half-configured payments. */
export function isBaleWalletConfigured() {
  const bot = process.env.BALE_BOT_TOKEN?.trim() ?? "";
  const wallet = process.env.BALE_WALLET_PROVIDER_TOKEN?.trim() ?? "";
  const username = process.env.BALE_BOT_USERNAME?.replace(/^@/, "").trim() ?? "";
  const webhookSecret = process.env.BALE_WEBHOOK_SECRET ?? "";
  return Boolean(
    /^\d+:[A-Za-z0-9_-]{20,}$/.test(bot) &&
    wallet.length >= 20 &&
    (process.env.NODE_ENV !== "production" || wallet !== BALE_TEST_TOKEN) &&
    /^[A-Za-z0-9_]{5,32}$/.test(username) &&
    webhookSecret.length >= 32 &&
    process.env.BALE_MINIAPP_READY === "true" &&
    process.env.BALE_WEBHOOK_READY === "true"
  );
}

export function baleMiniAppUrl(orderId: string) {
  const username = (process.env.BALE_BOT_USERNAME ?? "").replace(/^@/, "").trim();
  if (!isBaleWalletConfigured() || !/^[a-z0-9]{15,50}$/i.test(orderId)) return "";
  // The deep link opens the bot's MAIN miniapp; it is NOT an external checkout URL.
  return "https://ble.ir/" + username + "?startapp=" + encodeURIComponent(orderId);
}

function getToken() {
  const token = process.env.BALE_BOT_TOKEN;
  if (!token || !/^\d+:[A-Za-z0-9_-]{20,}$/.test(token)) throw Error("Bale bot not configured");
  return token;
}

export async function baleCall<T>(method: string, data: Record<string, unknown>): Promise<BaleApiResult<T>> {
  if (!/^[a-zA-Z]{3,35}$/.test(method)) throw Error("Invalid Bale method");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);
  try {
    const response = await fetch(
      "https://tapi.bale.ai/bot" + getToken() + "/" + method,
      { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data), signal: controller.signal, cache: "no-store" }
    );
    const json: unknown = await response.json().catch(() => null);
    if (!response.ok || !json || typeof json !== "object" || !("ok" in json)) {
      return { ok: false, description: "Bale API request failed" };
    }
    return json as BaleApiResult<T>;
  } finally {
    clearTimeout(timeout);
  }
}

/** Bale documents the same WebAppData HMAC derivation as Telegram-style miniapps. */
export function verifyBaleInitData(raw: unknown): { userId: string } | null {
  if (typeof raw !== "string" || raw.length > 8000 || raw.length < 30) return null;
  const token = process.env.BALE_BOT_TOKEN;
  if (!token) return null;
  const query = new URLSearchParams(raw);
  const signature = query.get("hash");
  const authDate = query.get("auth_date");
  const userRaw = query.get("user");
  if (!signature || !/^[0-9a-f]{64}$/i.test(signature) || !authDate || !/^\d{10}$/.test(authDate)) return null;
  if (Array.from(query.keys()).filter(key => key === "hash").length !== 1) return null;
  const age = Math.floor(Date.now() / 1000) - Number(authDate);
  if (age < -90 || age > 3600) return null;
  const checkString = Array.from(query.entries())
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => key + "=" + value).join("\n");
  const key = createHmac("sha256", "WebAppData").update(token).digest();
  const expected = createHmac("sha256", key).update(checkString).digest("hex");
  if (!timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"))) return null;
  try {
    const user: unknown = JSON.parse(userRaw ?? "{}");
    if (!user || typeof user !== "object" || !("id" in user)) return null;
    const id = String((user as { id: unknown }).id);
    return /^\d{1,20}$/.test(id) ? { userId: id } : null;
  } catch { return null; }
}

export function correctRialAmount(toman: number) {
  return Number.isSafeInteger(toman) && toman > 0 &&
    Number.isSafeInteger(toman * 10) ? toman * 10 : null;
}

export async function inquireBaleTransaction(transactionId: string) {
  if (!transactionId || transactionId.length > 150) return null;
  const response = await baleCall<{
    id: string; status: string; amount: number; userID?: number;
  }>("inquireTransaction", { transaction_id: transactionId });
  if (!response.ok || !response.result || typeof response.result !== "object") return null;
  return response.result;
}

/** The Bale bot update webhook has no documented signed header; use a high-entropy secret in its URL. */
export function verifyBaleWebhookSecret(received: string | null) {
  const secret = process.env.BALE_WEBHOOK_SECRET;
  if (!secret || secret.length < 32 || !received || received.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(received), Buffer.from(secret));
}
