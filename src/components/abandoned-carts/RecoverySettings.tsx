"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getRecoverySettings, saveRecoverySettings } from "@/lib/firebase/abandoned-carts";
import type { RecoverySettings } from "@/lib/models/abandoned-cart";
import { DEFAULT_RECOVERY_SETTINGS } from "@/lib/models/abandoned-cart";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {hint && <p className="text-xs text-text-muted">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls =
  "w-full bg-surface border border-stroke rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent transition-colors placeholder:text-text-muted/50";

export default function RecoverySettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [settings, setSettings] = useState<RecoverySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    getRecoverySettings(user.uid).then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, [user?.uid]);

  const set = <K extends keyof RecoverySettings>(key: K, value: RecoverySettings[K]) =>
    setSettings((prev) => prev ? { ...prev, [key]: value } : prev);

  const handleSave = async () => {
    if (!settings || saving) return;
    setSaving(true);
    setSaved(false);
    try {
      await saveRecoverySettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/abandoned-carts")}
          className="p-1.5 rounded-lg hover:bg-surface transition-colors text-text-muted"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-heading font-bold">Recovery Settings</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Configure how Labeld follows up with customers who abandoned checkout.
          </p>
        </div>
      </div>

      {/* Master toggle */}
      <div className="rounded-[20px] border border-stroke bg-surface p-5 flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">Enable Recovery Emails</p>
          <p className="text-sm text-text-muted mt-0.5">
            Automatically email customers who didn't complete checkout.
          </p>
        </div>
        <button
          onClick={() => set("enabled", !settings.enabled)}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            settings.enabled ? "bg-accent" : "bg-stroke"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              settings.enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {settings.enabled && (
        <>
          {/* Frequency & timing */}
          <section className="rounded-[20px] border border-stroke p-5 space-y-5">
            <h3 className="font-semibold">Email Frequency</h3>

            <Field label="Number of emails" hint="How many follow-up emails to send per cart (max 3).">
              <div className="flex gap-2">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    onClick={() => set("reminderFrequency", n)}
                    className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
                      settings.reminderFrequency === n
                        ? "bg-text text-bg border-text"
                        : "border-stroke text-text-muted hover:border-text/40"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Hours between emails" hint="Delay between each follow-up.">
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 6, 24].map((h) => (
                  <button
                    key={h}
                    onClick={() => set("delayBetweenMessages", h)}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                      settings.delayBetweenMessages === h
                        ? "bg-text text-bg border-text"
                        : "border-stroke text-text-muted hover:border-text/40"
                    }`}
                  >
                    {h === 24 ? "24h" : `${h}h`}
                  </button>
                ))}
              </div>
            </Field>
          </section>

          {/* Email template */}
          <section className="rounded-[20px] border border-stroke p-5 space-y-5">
            <h3 className="font-semibold">Email Template</h3>
            <p className="text-xs text-text-muted -mt-3">
              Customize what customers receive. Keep it short and direct.
            </p>

            <Field label="Subject line">
              <input
                type="text"
                value={settings.emailSubject}
                onChange={(e) => set("emailSubject", e.target.value)}
                placeholder={DEFAULT_RECOVERY_SETTINGS.emailSubject}
                className={inputCls}
              />
            </Field>

            <Field label="Heading">
              <input
                type="text"
                value={settings.emailTitle}
                onChange={(e) => set("emailTitle", e.target.value)}
                placeholder={DEFAULT_RECOVERY_SETTINGS.emailTitle}
                className={inputCls}
              />
            </Field>

            <Field label="Body" hint="Keep it under 2–3 sentences.">
              <textarea
                value={settings.emailBody}
                onChange={(e) => set("emailBody", e.target.value)}
                placeholder={DEFAULT_RECOVERY_SETTINGS.emailBody}
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </Field>

            <Field label="Button text">
              <input
                type="text"
                value={settings.ctaText}
                onChange={(e) => set("ctaText", e.target.value)}
                placeholder={DEFAULT_RECOVERY_SETTINGS.ctaText}
                className={inputCls}
              />
            </Field>

            <Field label="Button link" hint="Where customers land when they click the button.">
              <input
                type="url"
                value={settings.ctaLink}
                onChange={(e) => set("ctaLink", e.target.value)}
                placeholder="https://shop.labeld.app/yourbrand"
                className={inputCls}
              />
            </Field>
          </section>
        </>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-3 bg-cta text-white rounded-full font-semibold text-sm disabled:opacity-50 hover:scale-[1.02] active:scale-95 transition-all"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {saved ? "Saved!" : saving ? "Saving…" : "Save Settings"}
      </button>
    </div>
  );
}
