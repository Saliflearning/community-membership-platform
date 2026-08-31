"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import type { PlatformConfig } from "@/types/domain";

export function HelpPanel({
  config,
  dictionary,
  context,
  defaultCommunityCode
}: {
  config: PlatformConfig;
  dictionary: Dictionary;
  context: string;
  defaultCommunityCode?: string;
}) {
  const [open, setOpen] = useState(false);
  const [communityCode, setCommunityCode] = useState(defaultCommunityCode ?? config.communities.find((community) => community.active)?.code ?? "");
  const [status, setStatus] = useState("");
  const community = useMemo(
    () => config.communities.find((candidate) => candidate.code === communityCode),
    [communityCode, config.communities]
  );
  const country = config.countries.find((candidate) => candidate.code === community?.countryCode);
  const region = config.regions.find((candidate) => candidate.code === community?.regionCode);
  const zone = config.zones.find((candidate) => candidate.code === community?.zoneCode);
  const categories = [
    ["registration", dictionary.registration.title],
    ["payment", dictionary.steps.payment],
    ["card", dictionary.steps.card],
    ["renewal", dictionary.admin.expiringSoon],
    ["reassignment", dictionary.admin.reassignments],
    ["profile", dictionary.verify.member],
    ["other", dictionary.common.support]
  ] as const;

  async function submit(formData: FormData) {
    setStatus("");
    const response = await fetch("/api/support", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });
    setStatus(response.ok ? dictionary.help.sent : dictionary.help.failed);
  }

  return (
    <section className="rounded-lg bg-white shadow-soft">
      <button
        className="flex min-h-14 w-full items-center justify-between gap-4 p-5 text-left"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-hub-green">{dictionary.common.support}</p>
          <h2 className="mt-1 text-xl font-bold text-hub-ink">{context}</h2>
        </div>
        <span className="rounded-md bg-hub-mist px-3 py-2 text-sm font-bold text-hub-green">
          {open ? "−" : "+"}
        </span>
      </button>

      {open ? <div className="border-t border-slate-200 p-5 pt-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <p className="max-w-xl text-sm leading-6 text-slate-600">{dictionary.help.routeNote}</p>
        <div className="flex flex-wrap items-center gap-2">
          {country?.flagDataUrl ? <MiniFlag src={country.flagDataUrl} label={country.demonym} /> : null}
          {region?.flagDataUrl ? <MiniFlag src={region.flagDataUrl} label={region.name} /> : null}
          {zone ? <span className="rounded-md px-2 py-1 text-xs font-bold text-white" style={{ background: zone.badgeColor }}>{zone.name}</span> : null}
          {community ? <span className="rounded-md bg-hub-mist px-2 py-1 text-xs font-bold text-hub-ink">{community.code}</span> : null}
        </div>
      </div>

      <form action={submit} className="mt-5 grid gap-3 sm:grid-cols-2">
        <input className="min-h-11 rounded-md border border-slate-300 px-3" name="memberName" placeholder={dictionary.common.name} required />
        <input className="min-h-11 rounded-md border border-slate-300 px-3" name="email" placeholder={dictionary.common.email} type="email" required />
        <select className="min-h-11 rounded-md border border-slate-300 px-3" name="issueCategory" defaultValue="registration">
          {categories.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select className="min-h-11 rounded-md border border-slate-300 px-3" name="communityCode" value={communityCode} onChange={(event) => setCommunityCode(event.target.value)}>
          {config.communities.filter((item) => item.active).map((item) => (
            <option key={item.code} value={item.code}>{item.officialName}</option>
          ))}
        </select>
        <select className="min-h-11 rounded-md border border-slate-300 px-3" name="priority" defaultValue="normal">
          <option value="normal">{dictionary.help.normal}</option>
          <option value="urgent">{dictionary.help.urgent}</option>
        </select>
        <textarea className="min-h-24 rounded-md border border-slate-300 p-3 sm:col-span-2" name="message" placeholder={dictionary.help.placeholder} required />
        <button className="min-h-11 rounded-md bg-hub-green px-5 py-3 font-bold text-white sm:col-span-2" type="submit">
          {dictionary.common.contactSupport}
        </button>
      </form>
      {status ? <p className="mt-3 text-sm font-semibold text-hub-green">{status}</p> : null}
      </div> : null}
    </section>
  );
}

function MiniFlag({ src, label }: { src: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-hub-ink">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="h-4 w-7 rounded-sm object-cover" src={src} alt="" />
      {label}
    </span>
  );
}
