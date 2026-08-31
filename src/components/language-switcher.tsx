"use client";

import type { Locale } from "@/lib/i18n";

export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  function switchLanguage(nextLocale: Locale) {
    const url = new URL(window.location.href);
    url.searchParams.set("lang", nextLocale);
    window.location.href = url.toString();
  }

  return (
    <label className="inline-flex items-center gap-2 text-sm font-semibold">
      <span>{label}</span>
      <select
        className="min-h-10 rounded-md border border-slate-300 bg-white px-3 text-hub-ink"
        value={locale}
        onChange={(event) => switchLanguage(event.target.value as Locale)}
      >
        <option value="fr">Francais</option>
        <option value="en">English</option>
      </select>
    </label>
  );
}
