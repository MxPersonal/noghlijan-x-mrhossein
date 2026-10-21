// ZarinPal v4: production must never point to the sandbox gateway.
const useSandbox = () => process.env.NODE_ENV !== "production" && process.env.ZARINPAL_SANDBOX === "true";
const apiBase = () => useSandbox() ? "https://sandbox.zarinpal.com" : "https://api.zarinpal.com";
const startPay = () => useSandbox()
  ? "https://sandbox.zarinpal.com/pg/StartPay/"
  : "https://www.zarinpal.com/pg/StartPay/";

export function isZarinpalConfigured(): boolean {
  return Boolean(process.env.ZARINPAL_MERCHANT_ID?.trim());
}

export async function requestPayment(params: {
  amount: number;
  description: string;
  callbackUrl: string;
  mobile?: string;
}): Promise<{ authority: string; paymentUrl: string } | { error: string }> {
  const merchantId = process.env.ZARINPAL_MERCHANT_ID?.trim();
  if (!merchantId) {
    return { error: "MERCHANT_NOT_SET" };
  }

  const res = await fetch(apiBase() + "/pg/v4/payment/request.json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      merchant_id: merchantId,
      amount: params.amount * 10,
      description: params.description,
      callback_url: params.callbackUrl,
      metadata: params.mobile ? { mobile: params.mobile } : undefined,
    }),
  });

  const data = (await res.json()) as {
    data?: { authority?: string; code?: number };
    errors?: unknown;
  };

  if (data.data?.authority && data.data.code === 100) {
    return {
      authority: data.data.authority,
      paymentUrl: startPay() + data.data.authority,
    };
  }

  return { error: "PAYMENT_REQUEST_FAILED" };
}

export async function verifyPayment(params: {
  authority: string;
  amount: number;
}): Promise<{ ok: true; refId: string } | { ok: false; error: string }> {
  const merchantId = process.env.ZARINPAL_MERCHANT_ID?.trim();
  if (!merchantId) {
    return { ok: false, error: "MERCHANT_NOT_SET" };
  }

  const res = await fetch(apiBase() + "/pg/v4/payment/verify.json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      merchant_id: merchantId,
      amount: params.amount * 10,
      authority: params.authority,
    }),
  });

  const data = (await res.json()) as {
    data?: { code?: number; ref_id?: number };
  };

  if (data.data?.code === 100 || data.data?.code === 101) {
    return { ok: true, refId: String(data.data.ref_id ?? "") };
  }

  return { ok: false, error: "VERIFY_FAILED" };
}
