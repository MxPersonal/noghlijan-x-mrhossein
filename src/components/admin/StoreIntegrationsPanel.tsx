"use client";

import { useCallback, useEffect, useState } from "react";

type Provider = "TOROB" | "DIGIKALA" | "INSTAGRAM";

type FeedSettings = {
  feedUrl: string;
  hasApiToken: boolean;
  priceDivisor: number;
};

type InstagramSettings = {
  appId: string;
  hasAppSecret: boolean;
  callbackUrl: string;
};

type Integration = {
  provider: Provider;
  label: string;
  configured: boolean;
  connected: boolean;
  accountLabel?: string;
  message: string;
  settings: FeedSettings | InstagramSettings;
};

type Draft = {
  feedUrl: string;
  apiToken: string;
  clearApiToken: boolean;
  priceDivisor: string;
  appId: string;
  appSecret: string;
};

const PROVIDERS: Array<{ provider: Provider; description: string; accent: string }> = [
  {
    provider: "TOROB",
    description: "اتصال فید رسمی فروشنده و همگام‌سازی کالاها",
    accent: "bg-red-50 text-red-700",
  },
  {
    provider: "DIGIKALA",
    description: "اتصال API یا فید رسمی پنل فروشنده دیجی‌کالا",
    accent: "bg-rose-50 text-rose-700",
  },
  {
    provider: "INSTAGRAM",
    description: "ورود رسمی با حساب حرفه‌ای و دریافت پست‌ها",
    accent: "bg-fuchsia-50 text-fuchsia-700",
  },
];

const FALLBACK_LABELS: Record<Provider, string> = {
  TOROB: "ترب",
  DIGIKALA: "دیجی‌کالا",
  INSTAGRAM: "Instagram",
};

const EMPTY_DRAFT: Draft = {
  feedUrl: "",
  apiToken: "",
  clearApiToken: false,
  priceDivisor: "1",
  appId: "",
  appSecret: "",
};

function isInstagramSettings(
  settings: FeedSettings | InstagramSettings,
): settings is InstagramSettings {
  return "appId" in settings;
}

export function StoreIntegrationsPanel({ onImported }: { onImported: () => void }) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [drafts, setDrafts] = useState<Record<Provider, Draft>>({
    TOROB: { ...EMPTY_DRAFT },
    DIGIKALA: { ...EMPTY_DRAFT },
    INSTAGRAM: { ...EMPTY_DRAFT },
  });
  const [openSettings, setOpenSettings] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<{ provider: Provider; action: string } | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const applyIntegrations = useCallback((items: Integration[]) => {
    setIntegrations(items);
    setDrafts((current) => {
      const next = { ...current };
      for (const integration of items) {
        if (isInstagramSettings(integration.settings)) {
          next.INSTAGRAM = {
            ...next.INSTAGRAM,
            appId: integration.settings.appId,
            appSecret: "",
          };
        } else {
          next[integration.provider] = {
            ...next[integration.provider],
            feedUrl: integration.settings.feedUrl,
            apiToken: "",
            clearApiToken: false,
            priceDivisor: String(integration.settings.priceDivisor),
          };
        }
      }
      return next;
    });
  }, []);

  const loadStatuses = useCallback(async () => {
    const response = await fetch("/api/admin/integrations", { cache: "no-store" });
    const data = (await response.json()) as { integrations?: Integration[]; error?: string };
    if (!response.ok || !data.integrations) {
      throw new Error(data.error ?? "بررسی اتصال‌ها ناموفق بود");
    }
    applyIntegrations(data.integrations);
  }, [applyIntegrations]);

  useEffect(() => {
    let active = true;
    async function initialize() {
      const result = new URLSearchParams(window.location.search).get("integration");
      try {
        await loadStatuses();
        if (!active) return;
        if (result === "instagram-connected") {
          setSuccess("حساب Instagram با موفقیت متصل شد");
        } else if (result) {
          setError("ورود Instagram کامل نشد؛ تنظیمات Meta و آدرس بازگشت را بررسی کنید");
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "بررسی اتصال‌ها ناموفق بود");
        }
      } finally {
        if (active) setLoading(false);
      }

      if (result) {
        const url = new URL(window.location.href);
        url.searchParams.delete("integration");
        window.history.replaceState({}, "", url);
      }
    }

    void initialize();
    return () => {
      active = false;
    };
  }, [loadStatuses]);

  function updateIntegration(integration: Integration) {
    applyIntegrations([
      ...integrations.filter(({ provider }) => provider !== integration.provider),
      integration,
    ]);
  }

  function updateDraft(provider: Provider, patch: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [provider]: { ...current[provider], ...patch },
    }));
  }

  async function requestAction(
    provider: Provider,
    action: "save" | "connect" | "disconnect" | "import",
  ) {
    if (busy) return;
    setBusy({ provider, action });
    setError("");
    setSuccess("");

    try {
      const draft = drafts[provider];
      const settings =
        provider === "INSTAGRAM"
          ? { appId: draft.appId, appSecret: draft.appSecret }
          : {
              feedUrl: draft.feedUrl,
              apiToken: draft.apiToken,
              clearApiToken: draft.clearApiToken,
              priceDivisor: Number(draft.priceDivisor),
            };
      const response = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, action, settings }),
      });
      const data = (await response.json()) as {
        integration?: Integration;
        authorizationUrl?: string;
        error?: string;
        message?: string;
      };
      if (data.integration?.settings) updateIntegration(data.integration);
      if (!response.ok) {
        throw new Error(data.error ?? data.integration?.message ?? "عملیات ناموفق بود");
      }

      if (data.authorizationUrl) {
        window.location.assign(data.authorizationUrl);
        return;
      }
      if (action === "import") onImported();
      if (action === "save") setOpenSettings(null);
      setSuccess(
        data.message ??
          (action === "import"
            ? "کالاها با موفقیت وارد شدند"
            : action === "disconnect"
              ? "اتصال با موفقیت قطع شد"
              : action === "save"
                ? "تنظیمات با موفقیت ذخیره شد"
                : `${FALLBACK_LABELS[provider]} با موفقیت متصل شد`),
      );
      if (action === "import" || action === "connect") await loadStatuses();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "عملیات ناموفق بود");
    } finally {
      setBusy(null);
    }
  }

  async function copyCallback(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setSuccess("آدرس بازگشت کپی شد");
    } catch {
      setError("کپی خودکار انجام نشد؛ آدرس را دستی انتخاب کنید");
    }
  }

  return (
    <section className="glass-surface mb-8 rounded-2xl p-5">
      <div>
        <h2 className="font-display text-2xl text-ink">اتصال فروشگاه‌ها</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-ink-soft">
          تنظیمات از داخل همین پنل انجام و اطلاعات محرمانه به‌صورت رمزگذاری‌شده در
          سرور نگهداری می‌شود؛ دیگر نیازی به ویرایش فایل <span dir="ltr">.env</span> نیست.
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {PROVIDERS.map(({ provider, description, accent }) => {
          const integration = integrations.find((item) => item.provider === provider);
          const isBusy = busy?.provider === provider;
          const settings = integration?.settings;
          const draft = drafts[provider];

          return (
            <article
              key={provider}
              className="flex flex-col rounded-2xl bg-cream/50 p-4 ring-1 ring-ink/8"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl text-ink">
                    {integration?.label ?? FALLBACK_LABELS[provider]}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-ink-soft">{description}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${
                    integration?.connected
                      ? "bg-mint text-teal-deep"
                      : integration?.configured
                        ? "bg-amber-50 text-amber-700"
                        : accent
                  }`}
                >
                  {loading
                    ? "در حال بررسی"
                    : integration?.connected
                      ? "متصل شده"
                      : integration?.configured
                        ? "آماده اتصال"
                        : "تنظیم نشده"}
                </span>
              </div>

              <div className="glass-soft mt-4 min-h-24 rounded-xl p-3 text-xs leading-5 text-ink-soft">
                {loading
                  ? "در حال خواندن وضعیت اتصال..."
                  : integration?.message ?? "وضعیت اتصال در دسترس نیست"}
                {integration?.accountLabel ? (
                  <p className="mt-1 font-medium text-ink">حساب/فید: {integration.accountLabel}</p>
                ) : null}
              </div>

              {openSettings === provider ? (
                <div className="glass-soft mt-4 space-y-3 rounded-xl border border-ink/10 p-3">
                  {provider === "INSTAGRAM" ? (
                    <>
                      <label className="block text-xs text-ink-soft">
                        Instagram App ID
                        <input
                          dir="ltr"
                          inputMode="numeric"
                          value={draft.appId}
                          onChange={(event) => updateDraft(provider, { appId: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2 text-left text-sm"
                        />
                      </label>
                      <label className="block text-xs text-ink-soft">
                        Instagram App Secret
                        <input
                          dir="ltr"
                          type="password"
                          autoComplete="new-password"
                          value={draft.appSecret}
                          placeholder={
                            settings && isInstagramSettings(settings) && settings.hasAppSecret
                              ? "ذخیره شده؛ برای حفظ آن خالی بگذارید"
                              : "App Secret"
                          }
                          onChange={(event) => updateDraft(provider, { appSecret: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2 text-left text-sm"
                        />
                      </label>
                      {settings && isInstagramSettings(settings) ? (
                        <div className="text-xs text-ink-soft">
                          <span>Valid OAuth Redirect URI</span>
                          <div className="mt-1 flex gap-2">
                            <input
                              dir="ltr"
                              readOnly
                              value={settings.callbackUrl}
                              className="min-w-0 flex-1 rounded-lg border border-ink/10 bg-cream/40 px-2 py-2 text-left"
                            />
                            <button
                              type="button"
                              onClick={() => copyCallback(settings.callbackUrl)}
                              className="rounded-lg bg-mint px-2 text-teal-deep"
                            >
                              کپی
                            </button>
                          </div>
                        </div>
                      ) : null}
                      <p className="text-xs leading-5 text-ink-soft">
                        این دو مقدار فقط یک‌بار از برنامه‌ای که در Meta Developers ساخته‌اید
                        وارد می‌شوند؛ پس از آن ورود مدیر با خود Instagram انجام می‌شود.
                      </p>
                    </>
                  ) : (
                    <>
                      <label className="block text-xs text-ink-soft">
                        آدرس HTTPS فید/API رسمی محصولات
                        <input
                          dir="ltr"
                          type="url"
                          value={draft.feedUrl}
                          onChange={(event) => updateDraft(provider, { feedUrl: event.target.value })}
                          placeholder="https://..."
                          className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2 text-left text-sm"
                        />
                      </label>
                      <label className="block text-xs text-ink-soft">
                        توکن API (در صورت نیاز)
                        <input
                          dir="ltr"
                          type="password"
                          autoComplete="new-password"
                          value={draft.apiToken}
                          disabled={draft.clearApiToken}
                          placeholder={
                            settings && !isInstagramSettings(settings) && settings.hasApiToken
                              ? "ذخیره شده؛ برای حفظ آن خالی بگذارید"
                              : "اختیاری"
                          }
                          onChange={(event) => updateDraft(provider, { apiToken: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2 text-left text-sm disabled:opacity-50"
                        />
                      </label>
                      {settings && !isInstagramSettings(settings) && settings.hasApiToken ? (
                        <label className="flex items-center gap-2 text-xs text-ink-soft">
                          <input
                            type="checkbox"
                            checked={draft.clearApiToken}
                            onChange={(event) =>
                              updateDraft(provider, { clearApiToken: event.target.checked, apiToken: "" })
                            }
                          />
                          حذف توکن ذخیره‌شده
                        </label>
                      ) : null}
                      <label className="block text-xs text-ink-soft">
                        تقسیم قیمت بر
                        <select
                          value={draft.priceDivisor}
                          onChange={(event) => updateDraft(provider, { priceDivisor: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2 text-sm"
                        >
                          <option value="1">۱ — قیمت فید تومان است</option>
                          <option value="10">۱۰ — قیمت فید ریال است</option>
                        </select>
                      </label>
                    </>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => requestAction(provider, "save")}
                      className="flex-1 rounded-lg bg-teal px-3 py-2 text-sm text-white disabled:opacity-50"
                    >
                      {isBusy && busy.action === "save" ? "در حال ذخیره..." : "ذخیره امن"}
                    </button>
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => setOpenSettings(null)}
                      className="rounded-lg bg-cream-deep px-3 py-2 text-sm"
                    >
                      بستن
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  disabled={loading || busy !== null || !integration?.configured}
                  onClick={() => requestAction(provider, "connect")}
                  className="glass-input rounded-xl border border-teal/25 px-4 py-2 text-sm font-medium text-teal-deep transition hover:bg-mint disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isBusy && busy.action === "connect"
                    ? "در حال اتصال..."
                    : provider === "INSTAGRAM"
                      ? integration?.connected
                        ? "ورود دوباره با Instagram"
                        : "ورود با Instagram"
                      : integration?.connected
                        ? "بررسی دوباره اتصال"
                        : "بررسی و اتصال"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpenSettings(openSettings === provider ? null : provider)}
                  disabled={busy !== null}
                  className="rounded-xl bg-cream-deep px-4 py-2 text-sm text-ink transition hover:bg-mint disabled:opacity-50"
                >
                  {integration?.configured ? "ویرایش تنظیمات اتصال" : "تنظیم اتصال"}
                </button>
                <button
                  type="button"
                  disabled={!integration?.connected || busy !== null}
                  onClick={() => requestAction(provider, "import")}
                  className="rounded-xl bg-teal px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isBusy && busy.action === "import" ? "در حال ورود کالاها..." : "دریافت و ورود کالاها"}
                </button>
                {integration?.connected ? (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => requestAction(provider, "disconnect")}
                    className="rounded-xl px-4 py-2 text-xs text-peach transition hover:bg-peach/10 disabled:opacity-50"
                  >
                    قطع اتصال
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      <div aria-live="polite">
        {error ? <p role="alert" className="mt-4 text-sm text-peach">{error}</p> : null}
        {success ? <p className="mt-4 text-sm text-teal">{success}</p> : null}
      </div>
    </section>
  );
}
