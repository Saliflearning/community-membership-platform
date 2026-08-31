"use client";

import { useMemo, useState } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { PlatformConfig } from "@/types/domain";

export function ReassignmentRequestForm({ config, dictionary, locale }: { config: PlatformConfig; dictionary: Dictionary; locale: Locale }) {
  const [stateCode, setStateCode] = useState("IN");
  const [status, setStatus] = useState("");
  const communities = useMemo(
    () => config.communities.filter((community) => community.active && community.state === stateCode),
    [config.communities, stateCode]
  );
  const zoneLabel = communities[0]?.zoneCode ?? communities[0]?.zone ?? "";

  async function submit(formData: FormData) {
    setStatus("");
    const response = await fetch("/api/reassignments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });
    setStatus(response.ok
      ? locale === "fr" ? "Demande envoyee pour validation admin." : "Request submitted for admin review."
      : locale === "fr" ? "La demande n'a pas pu etre envoyee." : "Request could not be submitted.");
  }

  return (
    <form action={submit} className="mt-6 rounded-lg bg-white p-5 shadow-soft">
      <h2 className="text-xl font-bold text-hub-ink">{locale === "fr" ? "Demander un changement de communaute" : "Request reassignment"}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-hub-ink">
          {dictionary.verify.memberId}
          <input className="min-h-12 rounded-md border border-slate-300 px-3" name="memberId" required />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-hub-ink">
          {locale === "fr" ? "Nouvelle region" : "New region"}
          <select className="min-h-12 rounded-md border border-slate-300 px-3" name="requestedState" value={stateCode} onChange={(event) => setStateCode(event.target.value)}>
            {Array.from(new Set(config.communities.filter((community) => community.active).map((community) => community.state))).map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-hub-ink">
          {locale === "fr" ? "Nouvelle communaute" : "New community"}
          <select className="min-h-12 rounded-md border border-slate-300 px-3" name="requestedCommunityCode">
            {communities.map((community) => (
              <option key={community.code} value={community.code}>{community.officialName}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-hub-ink">
          {locale === "fr" ? "Zone automatique" : "Auto zone"}
          <input className="min-h-12 rounded-md border border-slate-300 px-3" value={zoneLabel} readOnly />
        </label>
      </div>
      <label className="mt-4 grid gap-2 text-sm font-semibold text-hub-ink">
        {locale === "fr" ? "Raison" : "Reason"}
        <textarea className="min-h-24 rounded-md border border-slate-300 p-3" name="reason" />
      </label>
      <button className="mt-4 min-h-12 rounded-md bg-hub-green px-5 py-3 font-bold text-white" type="submit">
        {locale === "fr" ? "Envoyer la demande" : "Submit reassignment request"}
      </button>
      {status ? <p className="mt-3 text-sm font-semibold text-hub-green">{status}</p> : null}
    </form>
  );
}
