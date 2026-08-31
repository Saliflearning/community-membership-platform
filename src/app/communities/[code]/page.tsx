import { notFound } from "next/navigation";
import { HelpPanel } from "@/components/help-panel";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { getPlatformConfig } from "@/services/config-service";

export default async function CommunityPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ lang?: string }> }) {
  const { code } = await params;
  const locale = resolveLocale((await searchParams).lang);
  const t = getDictionary(locale);
  const config = await getPlatformConfig();
  const community = config.communities.find((candidate) => candidate.code === code && candidate.active);

  if (!community) {
    notFound();
  }

  const country = config.countries.find((candidate) => candidate.code === community.countryCode);
  const region = config.regions.find((candidate) => candidate.code === community.regionCode);
  const zone = config.zones.find((candidate) => candidate.code === community.zoneCode);

  return (
    <main className="min-h-screen bg-hub-mist px-5 py-8">
      <section className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-lg bg-white shadow-soft">
          <div className="h-36 bg-hub-ink">
            {community.bannerDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="h-full w-full object-cover" src={community.bannerDataUrl} alt="" />
            ) : null}
          </div>
          <div className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="grid h-20 w-20 place-items-center rounded-lg border border-slate-200 bg-hub-mist text-xl font-bold text-hub-green">
                  {community.logoDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="h-full w-full rounded-lg object-contain p-2" src={community.logoDataUrl} alt="" />
                  ) : (
                    community.code
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-hub-green">{community.code}</p>
                  <h1 className="text-3xl font-bold text-hub-ink">{community.officialName}</h1>
                  <p className="mt-2 text-sm text-slate-600">{community.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                {country?.flagDataUrl ? <BadgeImage src={country.flagDataUrl} label={country.demonym} /> : null}
                {region?.flagDataUrl ? <BadgeImage src={region.flagDataUrl} label={region.name} /> : null}
                {zone ? <span className="rounded-md px-2 py-1 text-white" style={{ background: zone.badgeColor }}>{zone.name}</span> : null}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Info label="Support email" value={community.supportEmail ?? community.contactEmail ?? config.branding.supportEmail} />
              <Info label="Phone" value={community.phone ?? "Not provided"} />
              <Info label="Region" value={region?.name ?? community.state} />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <HelpPanel config={config} dictionary={t} context={locale === "fr" ? `Besoin d'aide de ${community.code} ?` : `Need help from ${community.code}?`} defaultCommunityCode={community.code} />
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-hub-ink">{value}</p>
    </div>
  );
}

function BadgeImage({ src, label }: { src: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-hub-ink">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="h-4 w-7 rounded-sm object-cover" src={src} alt="" />
      {label}
    </span>
  );
}
