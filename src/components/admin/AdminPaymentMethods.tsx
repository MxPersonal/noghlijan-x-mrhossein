import type { MethodOption } from "@/lib/payment-providers";

const envKeys: Record<string,string[]> = {
  zarinpal: ["ZARINPAL_MERCHANT_ID"],
  aqayepardakht: ["AQAYEPARDAKHT_PIN"],
  balepay: [
    "BALE_BOT_TOKEN", "BALE_WALLET_PROVIDER_TOKEN", "BALE_BOT_USERNAME",
    "BALE_WEBHOOK_SECRET", "BALE_MINIAPP_READY", "BALE_WEBHOOK_READY",
  ],
  ircryptopay: ["IRCRYPTO_KEY", "IRCRYPTO_WEBHOOK_SECRET"],
  nowpayments: [
    "NOWPAYMENTS_COMPLIANCE_APPROVED", "NOWPAYMENTS_API_KEY", "NOWPAYMENTS_IPN_SECRET",
    "CRYPTO_USD_TOMAN_RATE", "CRYPTO_RATE_VALID_UNTIL",
  ],
};

export function AdminPaymentMethods({ methods }: { methods: MethodOption[] }) {
  return (
    <section className="admin-payments" id="admin-payment-methods">
      <div className="admin-payments-heading">
        <p className="admin-panel-overline">01 / روش‌های پرداخت</p>
        <h2>درگاه‌های نقلی‌جان <span aria-hidden="true">✿</span></h2>
        <p>وضعیت اتصال هر روش بر اساس تنظیمات واقعی سرور نمایش داده می‌شود؛ کلیدهای محرمانه هرگز در مرورگر ارسال نمی‌شوند.</p>
      </div>
      <div className="admin-payment-grid">
        {methods.map(method => (
          <article className="admin-payment-card" key={method.id}>
            <div className="admin-payment-card-top">
              <span aria-hidden="true" className="admin-payment-card-icon">
                {method.id === "zarinpal" ? "✦" : method.id === "aqayepardakht" ? "◈" :
                  method.id === "balepay" ? "♡" : "₿"}
              </span>
              <span className={"admin-payment-availability" + (method.available ? " is-ready" : "")}>
                {method.available ? "قابل استفاده در تسویه" : "فعلاً غیرفعال"}
              </span>
            </div>
            <h3>{method.title}</h3>
            <p>{method.description}</p>
            <div className="admin-payment-config">
              <span>پیش‌نیازهای اتصال</span>
              <ul>{envKeys[method.id].map(key => <li key={key}><code dir="ltr">{key}</code></li>)}</ul>
            </div>
          </article>
        ))}
      </div>
      <div className="admin-payment-notice">
        <h3>قبل از دریافت اولین پرداخت</h3>
        <p>
          پذیرندگی هر سرویس و اعتبار حساب آن را تأیید کن، کلیدهای مربوط را در تنظیمات امن Vercel قرار بده
          و پس از انتشار مجدد، درخواست و تأیید پرداخت را با تراکنش واقعی کم‌مبلغ آزمایش کن.
          اتصال بله اکنون بر اساس مستندات رسمی بازو و مینی‌اپ پیاده‌سازی شده است؛
          باید بازوی بله را در @botfather بسازی، توکن کیف پول را بگیری، مینی‌اپ اصلی را
          به نشانی /bale-pay وصل کنی و وب‌هوک بازو را روی مسیر امن پروژه تنظیم کنی.
          تا زمان فعال‌شدن این تنظیمات، بله در تسویه غیرفعال می‌ماند.
        </p>
        <p>
          برای درگاه رمزارزی ایرانی، دریافت فاکتور به ریال و وب‌هوک امن از API سرویس «آی‌آر کریپتو» پیش‌بینی شده است.
          پیش از فعال‌سازی، اعتبار و شرایط قانونی پذیرندگی این سرویس را مستقل بررسی کن.
          طبق محدودیت‌های منتشرشدهٔ NOWPayments، خدمات آن برای برخی حوزه‌های قضایی از جمله ایران ممکن نیست. این اتصال تنها در صورت تأیید واقعی واجدشرایط‌بودن پذیرنده نزد سرویس‌دهنده و ثبت کلید API، IPN Secret و نرخ تبدیل تومان به دلار با زمان اعتبار محدود
          فعال می‌شود. سازگاری قانونی و امکان ارائهٔ خدمات به کشور و کسب‌وکار خودت را نیز از سرویس‌دهنده بررسی کن.
        </p>
      </div>
    </section>
  );
}
