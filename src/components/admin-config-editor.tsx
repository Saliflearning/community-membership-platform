"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import type { PlatformConfig, RegistrationFieldSetting } from "@/types/domain";

type Section = "publicContent" | "branding" | "locations" | "tiers" | "communities" | "notifications" | "registration" | "card" | "cardTemplates" | "physicalCards";

export function AdminConfigEditor({ initialConfig, dictionary }: { initialConfig: PlatformConfig; dictionary: Dictionary }) {
  const [config, setConfig] = useState(initialConfig);
  const [section, setSection] = useState<Section>("publicContent");
  const [status, setStatus] = useState("");
  const t = dictionary;

  async function save(sectionName: keyof PlatformConfig, value: PlatformConfig[keyof PlatformConfig]) {
    setStatus("");
    const response = await fetch("/api/admin/config", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ section: sectionName, value })
    });
    const updated = (await response.json()) as PlatformConfig;
    setConfig(updated);
    setStatus(t.common.saved);
  }

  const nav: Array<{ id: Section; label: string }> = [
    { id: "publicContent", label: t.config.publicContent },
    { id: "branding", label: t.config.branding },
    { id: "locations", label: t.config.locations },
    { id: "tiers", label: t.config.tiers },
    { id: "communities", label: t.config.communities },
    { id: "notifications", label: t.config.notifications },
    { id: "registration", label: t.config.registration },
    { id: "card", label: t.config.card },
    { id: "cardTemplates", label: t.config.cardTemplates },
    { id: "physicalCards", label: t.config.physicalCards }
  ];
  const navGroups = [
    { label: t.config.supportSettings, items: nav.filter((item) => ["publicContent", "notifications"].includes(item.id)) },
    { label: t.config.globalSettings, items: nav.filter((item) => ["branding", "locations", "registration"].includes(item.id)) },
    { label: t.config.communitySettings, items: nav.filter((item) => ["communities", "card", "cardTemplates"].includes(item.id)) },
    { label: t.config.paymentSettings, items: nav.filter((item) => ["tiers", "physicalCards"].includes(item.id)) }
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
      <nav className="grid gap-4 self-start rounded-lg bg-white p-4 shadow-soft" aria-label="Configuration sections">
        {navGroups.map((group) => (
          <div key={group.label} className="grid gap-2">
            <p className="px-1 text-xs font-black uppercase tracking-wide text-slate-500">{group.label}</p>
            {group.items.map((item) => (
              <button
                key={item.id}
                className={`rounded-md px-3 py-3 text-left text-sm font-bold ${section === item.id ? "bg-hub-green text-white" : "bg-hub-mist text-hub-ink"}`}
                type="button"
                onClick={() => {
                  setSection(item.id);
                  setStatus("");
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <section className="rounded-lg bg-white p-5 shadow-soft">
        <div className="flex min-h-10 items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-hub-ink">{nav.find((item) => item.id === section)?.label}</h2>
          <span className="text-sm font-semibold text-hub-green" role="status">{status}</span>
        </div>

        {section === "publicContent" ? (
          <PublicContentForm config={config} labels={t} onSave={(value) => save("publicContent", value)} />
        ) : null}
        {section === "branding" ? (
          <BrandingForm config={config} labels={t} onSave={(value) => save("branding", value)} />
        ) : null}
        {section === "locations" ? (
          <LocationForm
            config={config}
            labels={t}
            onSaveCountries={(value) => save("countries", value)}
            onSaveRegions={(value) => save("regions", value)}
          />
        ) : null}
        {section === "tiers" ? (
          <TierForm config={config} labels={t} onSave={(value) => save("membershipTiers", value)} />
        ) : null}
        {section === "communities" ? (
          <CommunityForm config={config} labels={t} onSave={(value) => save("communities", value)} />
        ) : null}
        {section === "notifications" ? (
          <NotificationForm config={config} labels={t} onSave={(value) => save("notifications", value)} />
        ) : null}
        {section === "registration" ? (
          <RegistrationFieldsForm config={config} labels={t} onSave={(value) => save("registrationFields", value)} />
        ) : null}
        {section === "card" ? (
          <CardForm config={config} labels={t} onSave={(value) => save("card", value)} />
        ) : null}
        {section === "cardTemplates" ? (
          <CardTemplateForm config={config} labels={t} onSave={(value) => save("communityCardTemplates", value)} />
        ) : null}
        {section === "physicalCards" ? (
          <PhysicalCardsForm config={config} labels={t} onSave={(value) => save("physicalCards", value)} />
        ) : null}

        <details className="mt-8 rounded-md border border-slate-200 p-4">
          <summary className="cursor-pointer text-sm font-bold text-hub-ink">{t.config.debugJson}</summary>
          <pre className="mt-4 max-h-96 overflow-auto rounded-md bg-hub-ink p-4 text-xs text-white">{JSON.stringify(config, null, 2)}</pre>
        </details>
      </section>
    </div>
  );
}

function PublicContentForm({ config, labels, onSave }: FormProps<PlatformConfig["publicContent"]>) {
  const [value, setValue] = useState(config.publicContent);
  return (
    <FormShell onSave={() => onSave(value)} saveLabel={labels.common.save}>
      <Input label={labels.config.headline} value={value.homepageHeadline} onChange={(homepageHeadline) => setValue({ ...value, homepageHeadline })} />
      <Textarea label={labels.config.homepageBody} value={value.homepageBody} onChange={(homepageBody) => setValue({ ...value, homepageBody })} />
      <Input label={labels.config.heroMediaUrl} value={value.heroMediaUrl ?? ""} onChange={(heroMediaUrl) => setValue({ ...value, heroMediaUrl })} />
      <label className="grid gap-2 text-sm font-bold text-hub-ink">
        {labels.config.heroMediaType}
        <select className="min-h-11 rounded-md border border-slate-300 px-3 font-normal" value={value.heroMediaType ?? "image"} onChange={(event) => setValue({ ...value, heroMediaType: event.target.value as PlatformConfig["publicContent"]["heroMediaType"] })}>
          <option value="image">Image</option>
          <option value="video">Video</option>
          <option value="animation">Animation</option>
        </select>
      </label>
      <Textarea label={labels.config.paymentInstructions} value={value.paymentInstructions} onChange={(paymentInstructions) => setValue({ ...value, paymentInstructions })} />
      <Input label={labels.config.supportContact} value={value.supportContact} onChange={(supportContact) => setValue({ ...value, supportContact })} />
    </FormShell>
  );
}

function LocationForm({
  config,
  labels,
  onSaveCountries,
  onSaveRegions
}: {
  config: PlatformConfig;
  labels: Dictionary;
  onSaveCountries: (value: PlatformConfig["countries"]) => void;
  onSaveRegions: (value: PlatformConfig["regions"]) => void;
}) {
  const [countries, setCountries] = useState(config.countries);
  const [regions, setRegions] = useState(config.regions);

  return (
    <div className="mt-5 grid gap-6">
      <section className="grid gap-3">
        <h3 className="text-lg font-bold text-hub-ink">{labels.config.country}</h3>
        {countries.map((country, index) => (
          <div key={country.code} className="grid gap-3 rounded-md border border-slate-200 p-4 md:grid-cols-[1fr_120px_140px_110px]">
            <Input label={labels.common.name} value={country.name} onChange={(name) => updateCountry(index, { ...country, name })} />
            <Input label={labels.config.code} value={country.code} onChange={(code) => updateCountry(index, { ...country, code: code.toUpperCase() })} />
            <Input label={labels.config.currency} value={country.currencyCode} onChange={(currencyCode) => updateCountry(index, { ...country, currencyCode: currencyCode.toUpperCase() })} />
            <Toggle label={labels.config.active} checked={country.active} onChange={(active) => updateCountry(index, { ...country, active })} />
          </div>
        ))}
        <button className="min-h-11 rounded-md border border-hub-green px-4 font-bold text-hub-green" type="button" onClick={() => setCountries([...countries, { code: "NEW", name: "New country", demonym: "Country", defaultLanguage: "fr", supportedLanguages: ["fr", "en"], currencyCode: "USD", active: false }])}>
          {labels.config.addCountry}
        </button>
        <button className="min-h-12 rounded-md bg-hub-green px-5 py-3 font-bold text-white" type="button" onClick={() => onSaveCountries(countries)}>
          {labels.common.save}
        </button>
      </section>

      <section className="grid gap-3">
        <h3 className="text-lg font-bold text-hub-ink">{labels.config.region}</h3>
        {regions.map((region, index) => (
          <div key={`${region.countryCode}-${region.code}-${index}`} className="grid gap-3 rounded-md border border-slate-200 p-4 md:grid-cols-[1fr_120px_120px_110px]">
            <Input label={labels.common.name} value={region.name} onChange={(name) => updateRegion(index, { ...region, name })} />
            <Input label={labels.config.code} value={region.code} onChange={(code) => updateRegion(index, { ...region, code: code.toUpperCase() })} />
            <Input label={labels.config.country} value={region.countryCode} onChange={(countryCode) => updateRegion(index, { ...region, countryCode: countryCode.toUpperCase() })} />
            <Toggle label={labels.config.active} checked={region.active} onChange={(active) => updateRegion(index, { ...region, active })} />
          </div>
        ))}
        <button className="min-h-11 rounded-md border border-hub-green px-4 font-bold text-hub-green" type="button" onClick={() => setRegions([...regions, { code: "US-NEW", name: "New region", countryCode: "US", active: false }])}>
          {labels.config.addRegion}
        </button>
        <button className="min-h-12 rounded-md bg-hub-green px-5 py-3 font-bold text-white" type="button" onClick={() => onSaveRegions(regions)}>
          {labels.common.save}
        </button>
      </section>
    </div>
  );

  function updateCountry(index: number, next: PlatformConfig["countries"][number]) {
    setCountries(countries.map((item, itemIndex) => (itemIndex === index ? next : item)));
  }

  function updateRegion(index: number, next: PlatformConfig["regions"][number]) {
    setRegions(regions.map((item, itemIndex) => (itemIndex === index ? next : item)));
  }
}

function BrandingForm({ config, labels, onSave }: FormProps<PlatformConfig["branding"]>) {
  const [value, setValue] = useState(config.branding);
  return (
    <FormShell onSave={() => onSave(value)} saveLabel={labels.common.save}>
      <Input label={labels.config.platformName} value={value.platformName} onChange={(platformName) => setValue({ ...value, platformName })} />
      <Input label={labels.config.supportEmail} value={value.supportEmail} onChange={(supportEmail) => setValue({ ...value, supportEmail })} />
      <ColorInput label={labels.config.primaryColor} resetLabel={labels.config.resetDefaults} value={value.primaryColor} onChange={(primaryColor) => setValue({ ...value, primaryColor })} />
      <ColorInput label={labels.config.accentColor} resetLabel={labels.config.resetDefaults} value={value.accentColor} onChange={(accentColor) => setValue({ ...value, accentColor })} />
    </FormShell>
  );
}

function TierForm({ config, labels, onSave }: FormProps<PlatformConfig["membershipTiers"]>) {
  const [items, setItems] = useState(config.membershipTiers);
  return (
    <FormShell onSave={() => onSave(items)} saveLabel={labels.common.save}>
      {items.map((tier, index) => (
        <div key={tier.code} className="grid gap-3 rounded-md border border-slate-200 p-4 md:grid-cols-4">
          <Input label={labels.config.tierName} value={tier.name} onChange={(name) => update(index, { ...tier, name })} />
          <Input label={labels.config.price} type="number" value={tier.priceUsd.toString()} onChange={(priceUsd) => update(index, { ...tier, priceUsd: Number(priceUsd) })} />
          <Input label={labels.config.duration} type="number" value={tier.durationYears.toString()} onChange={(durationYears) => update(index, { ...tier, durationYears: Number(durationYears) as 1 | 2 | 3 })} />
          <Toggle label={labels.config.active} checked={tier.active} onChange={(active) => update(index, { ...tier, active })} />
        </div>
      ))}
      <button className="min-h-11 rounded-md border border-hub-green px-4 font-bold text-hub-green" type="button" onClick={() => setItems([...items, { code: `TIER-${items.length + 1}`, countryCode: config.countries[0]?.code ?? "US", name: "New tier", priceUsd: 50, durationYears: 1, description: "Membership tier description.", benefits: [], renewalRules: "Standard renewal.", addOns: [], active: false }])}>
        {labels.config.addTier}
      </button>
    </FormShell>
  );

  function update(index: number, next: PlatformConfig["membershipTiers"][number]) {
    setItems(items.map((item, itemIndex) => (itemIndex === index ? next : item)));
  }
}

function CommunityForm({ config, labels, onSave }: FormProps<PlatformConfig["communities"]>) {
  const [items, setItems] = useState(config.communities);
  return (
    <FormShell onSave={() => onSave(items)} saveLabel={labels.common.save}>
      {items.map((community, index) => (
        <div key={community.code} className="grid gap-4 rounded-md border border-slate-200 p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.4fr)_120px_minmax(190px,1fr)_100px]">
            <Input label={labels.config.communityName} value={community.officialName} onChange={(officialName) => update(index, { ...community, officialName })} />
            <Input label={labels.config.code} value={community.code} onChange={(code) => update(index, { ...community, code })} />
            <Input label={labels.config.contactEmail} value={community.contactEmail ?? ""} onChange={(contactEmail) => update(index, { ...community, contactEmail })} />
            <Toggle label={labels.config.active} checked={community.active} onChange={(active) => update(index, { ...community, active })} />
          </div>
          <div className="grid gap-3 lg:grid-cols-[minmax(220px,260px)_minmax(280px,1fr)]">
          <LogoUpload
            label={labels.config.logo}
            uploadLabel={labels.config.uploadLogo}
            uploadedLabel={labels.config.uploaded}
            failedLabel={labels.config.uploadFailed}
            communityCode={community.code}
            logoDataUrl={community.logoDataUrl}
            onUploaded={(logoDataUrl) => update(index, { ...community, logoDataUrl })}
          />
          <Textarea label={labels.config.description} value={community.description ?? ""} onChange={(description) => update(index, { ...community, description })} />
          </div>
        </div>
      ))}
      <button className="min-h-11 rounded-md border border-hub-green px-4 font-bold text-hub-green" type="button" onClick={() => setItems([...items, { officialName: "New community", code: `COMM${items.length + 1}`, countryCode: config.countries[0]?.code ?? "US", regionCode: config.regions[0]?.code ?? "US-IN", zoneCode: config.zones[0]?.code ?? "US-ZE", state: "IN", zone: "ZE", description: "Local community description.", contactEmail: "", supportEmail: "", socialLinks: [], active: false }])}>
        {labels.config.addCommunity}
      </button>
    </FormShell>
  );

  function update(index: number, next: PlatformConfig["communities"][number]) {
    setItems(items.map((item, itemIndex) => (itemIndex === index ? next : item)));
  }
}

function LogoUpload({
  label,
  uploadLabel,
  uploadedLabel,
  failedLabel,
  communityCode,
  logoDataUrl,
  onUploaded
}: {
  label: string;
  uploadLabel: string;
  uploadedLabel: string;
  failedLabel: string;
  communityCode: string;
  logoDataUrl?: string;
  onUploaded: (logoDataUrl: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");

  async function upload() {
    if (!file) {
      return;
    }

    setStatus("");
    const formData = new FormData();
    formData.set("logo", file);
    const response = await fetch(`/api/admin/communities/${encodeURIComponent(communityCode)}/logo`, {
      method: "POST",
      body: formData
    });
    const payload = (await response.json()) as { logoDataUrl?: string; error?: string };

    if (!response.ok || !payload.logoDataUrl) {
      setStatus(payload.error ?? failedLabel);
      return;
    }

    onUploaded(payload.logoDataUrl);
    setStatus(uploadedLabel);
  }

  return (
    <div className="grid gap-2 text-sm font-bold text-hub-ink">
      {label}
      {logoDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="h-14 w-14 rounded-md border border-slate-200 object-contain p-1" src={logoDataUrl} alt="" />
      ) : null}
      <input
        className="min-h-11 rounded-md border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-hub-ink file:px-3 file:py-2 file:text-sm file:font-bold file:text-white"
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />
      <button className="min-h-10 rounded-md border border-hub-green px-3 font-bold text-hub-green" type="button" onClick={upload}>
        {uploadLabel}
      </button>
      {status ? <span className="text-xs font-semibold text-slate-600">{status}</span> : null}
    </div>
  );
}

function NotificationForm({ config, labels, onSave }: FormProps<PlatformConfig["notifications"]>) {
  const [value, setValue] = useState(config.notifications);
  return (
    <FormShell onSave={() => onSave(value)} saveLabel={labels.common.save}>
      <Input label={labels.config.reminderDays} value={value.renewalReminderDays.join(", ")} onChange={(days) => setValue({ ...value, renewalReminderDays: days.split(",").map((day) => Number(day.trim())).filter((day) => !Number.isNaN(day)) })} />
      <Textarea label={labels.config.confirmationEmail} value={value.confirmationEmailText} onChange={(confirmationEmailText) => setValue({ ...value, confirmationEmailText })} />
      <Textarea label={labels.config.cardDeliveryEmail} value={value.cardDeliveryEmailText} onChange={(cardDeliveryEmailText) => setValue({ ...value, cardDeliveryEmailText })} />
      <Textarea label={labels.config.expirationNotice} value={value.expirationNoticeText} onChange={(expirationNoticeText) => setValue({ ...value, expirationNoticeText })} />
    </FormShell>
  );
}

function RegistrationFieldsForm({ config, labels, onSave }: FormProps<PlatformConfig["registrationFields"]>) {
  const [items, setItems] = useState(config.registrationFields);
  return (
    <FormShell onSave={() => onSave(items)} saveLabel={labels.common.save}>
      {items.map((field, index) => (
        <label key={field.field} className="grid gap-2 rounded-md border border-slate-200 p-4 text-sm font-bold text-hub-ink">
          <input className="min-h-11 rounded-md border border-slate-300 px-3 font-normal" value={field.label ?? field.field} onChange={(event) => update(index, { ...field, label: event.target.value })} />
          <select
            className="min-h-11 rounded-md border border-slate-300 px-3"
            value={field.visibility}
            onChange={(event) => update(index, { ...field, visibility: event.target.value as RegistrationFieldSetting["visibility"] })}
          >
            <option value="required">{labels.config.required}</option>
            <option value="optional">{labels.config.optional}</option>
            <option value="hidden">{labels.config.hidden}</option>
          </select>
        </label>
      ))}
      <button className="min-h-11 rounded-md border border-hub-green px-4 font-bold text-hub-green" type="button" onClick={() => setItems([...items, { field: `custom_${items.length + 1}`, label: labels.config.customField, visibility: "optional" }])}>
        {labels.config.addField}
      </button>
    </FormShell>
  );

  function update(index: number, next: RegistrationFieldSetting) {
    setItems(items.map((item, itemIndex) => (itemIndex === index ? next : item)));
  }
}

function CardForm({ config, labels, onSave }: FormProps<PlatformConfig["card"]>) {
  const [value, setValue] = useState(config.card);
  return (
    <FormShell onSave={() => onSave(value)} saveLabel={labels.common.save}>
      <div className="grid gap-4 rounded-md border border-slate-200 p-4 md:grid-cols-2">
        <ColorInput label={labels.config.primaryColor} resetLabel={labels.config.resetDefaults} value={value.primaryColor} defaultValue="#0f7a3b" onChange={(primaryColor) => setValue({ ...value, primaryColor })} />
        <ColorInput label={labels.config.accentColor} resetLabel={labels.config.resetDefaults} value={value.accentColor} defaultValue="#f2c94c" onChange={(accentColor) => setValue({ ...value, accentColor })} />
        <ColorInput label={labels.config.backgroundColor} resetLabel={labels.config.resetDefaults} value={value.backgroundColor ?? "#f8faf7"} defaultValue="#f8faf7" onChange={(backgroundColor) => setValue({ ...value, backgroundColor })} />
        <ColorInput label={labels.config.textColor} resetLabel={labels.config.resetDefaults} value={value.textColor ?? "#17211c"} defaultValue="#17211c" onChange={(textColor) => setValue({ ...value, textColor })} />
        <ColorInput label={labels.config.dangerColor} resetLabel={labels.config.resetDefaults} value={value.dangerColor ?? "#c7352f"} defaultValue="#c7352f" onChange={(dangerColor) => setValue({ ...value, dangerColor })} />
      </div>
      <label className="grid gap-2 text-sm font-bold text-hub-ink">
        {labels.config.logo}
        <select className="min-h-11 rounded-md border border-slate-300 px-3" value={value.logoSelection} onChange={(event) => setValue({ ...value, logoSelection: event.target.value as PlatformConfig["card"]["logoSelection"] })}>
          <option value="community">{labels.config.communityLogo}</option>
          <option value="platform">{labels.config.platformLogo}</option>
          <option value="both">{labels.config.bothLogos}</option>
        </select>
      </label>
    </FormShell>
  );
}

function CardTemplateForm({ config, labels, onSave }: FormProps<PlatformConfig["communityCardTemplates"]>) {
  const [items, setItems] = useState(config.communityCardTemplates);

  return (
    <FormShell onSave={() => onSave(items)} saveLabel={labels.common.save}>
      {items.map((template, index) => {
        const community = config.communities.find((item) => item.code === template.communityCode);

        return (
          <div key={template.id} className="grid gap-4 rounded-md border border-slate-200 p-4 xl:grid-cols-[1fr_300px]">
            <div className="grid gap-3 md:grid-cols-2">
              <Input label={labels.config.communityName} value={template.communityCode} onChange={(communityCode) => update(index, { ...template, communityCode: communityCode.toUpperCase() })} />
              <Input label={labels.common.name} value={template.templateName} onChange={(templateName) => update(index, { ...template, templateName })} />
              <Select
                label={labels.config.templateStatus}
                value={template.status}
                options={[
                  ["draft", labels.config.draft],
                  ["pending_approval", labels.config.pendingApproval],
                  ["approved", labels.config.approved],
                  ["archived", labels.config.archived]
                ]}
                onChange={(status) => update(index, { ...template, status: status as PlatformConfig["communityCardTemplates"][number]["status"], approvedAt: status === "approved" ? new Date().toISOString() : template.approvedAt })}
              />
              <Select
                label={labels.config.backgroundStyle}
                value={template.backgroundStyle}
                options={[
                  ["light", "Light"],
                  ["white", "White"],
                  ["cream", "Cream"],
                  ["deep-green", "Deep green"]
                ]}
                onChange={(backgroundStyle) => update(index, { ...template, backgroundStyle: backgroundStyle as PlatformConfig["communityCardTemplates"][number]["backgroundStyle"] })}
              />
              <ColorInput label={labels.config.primaryColor} resetLabel={labels.config.resetDefaults} value={template.primaryColor} defaultValue="#0f7a3b" onChange={(primaryColor) => update(index, { ...template, primaryColor })} />
              <ColorInput label={labels.config.accentColor} resetLabel={labels.config.resetDefaults} value={template.accentColor} defaultValue="#f2c94c" onChange={(accentColor) => update(index, { ...template, accentColor })} />
              <Select
                label={labels.config.frontLayout}
                value={template.frontLayout}
                options={[
                  ["badge-horizontal", "Badge horizontal"],
                  ["badge-vertical", "Badge vertical"]
                ]}
                onChange={(frontLayout) => update(index, { ...template, frontLayout: frontLayout as PlatformConfig["communityCardTemplates"][number]["frontLayout"] })}
              />
              <Select
                label={labels.config.backLayout}
                value={template.backLayout}
                options={[
                  ["details", "Details"],
                  ["minimal", "Minimal"]
                ]}
                onChange={(backLayout) => update(index, { ...template, backLayout: backLayout as PlatformConfig["communityCardTemplates"][number]["backLayout"] })}
              />
              <Toggle label={labels.config.signatureArea} checked={template.showSignatureArea} onChange={(showSignatureArea) => update(index, { ...template, showSignatureArea })} />
              <Input label={labels.config.contactEmail} value={template.contactInfo ?? ""} onChange={(contactInfo) => update(index, { ...template, contactInfo })} />
            </div>
            <CardTemplatePreview labels={labels} template={template} communityName={community?.officialName ?? template.communityCode} />
          </div>
        );
      })}
      <button className="min-h-11 rounded-md border border-hub-green px-4 font-bold text-hub-green" type="button" onClick={() => setItems([...items, {
        id: `card-template-${Date.now()}`,
        communityCode: config.communities[0]?.code ?? "NEW",
        status: "draft",
        templateName: "Local card template",
        accentColor: config.card.accentColor,
        primaryColor: config.card.primaryColor,
        backgroundStyle: "light",
        logoSelection: "community",
        frontLayout: "badge-horizontal",
        backLayout: "details",
        displayedFields: config.card.displayedFields,
        fieldOrder: config.card.displayedFields,
        showCountryFlag: true,
        showRegionFlag: true,
        showSignatureArea: false,
        updatedAt: new Date().toISOString()
      }])}>
        {labels.config.addCardTemplate}
      </button>
    </FormShell>
  );

  function update(index: number, next: PlatformConfig["communityCardTemplates"][number]) {
    setItems(items.map((item, itemIndex) => (itemIndex === index ? { ...next, updatedAt: new Date().toISOString() } : item)));
  }
}

function PhysicalCardsForm({ config, labels, onSave }: FormProps<PlatformConfig["physicalCards"]>) {
  const [value, setValue] = useState(config.physicalCards);
  return (
    <FormShell onSave={() => onSave(value)} saveLabel={labels.common.save}>
      <div className="grid gap-3 md:grid-cols-4">
        <Toggle label={labels.config.physicalOffered} checked={value.offered} onChange={(offered) => setValue({ ...value, offered })} />
        <Toggle label={labels.config.pickupEnabled} checked={value.pickupEnabled} onChange={(pickupEnabled) => setValue({ ...value, pickupEnabled })} />
        <Toggle label={labels.config.mailEnabled} checked={value.mailEnabled} onChange={(mailEnabled) => setValue({ ...value, mailEnabled })} />
        <Input label={labels.config.shippingPrice} type="number" value={value.shippingPriceUsd.toString()} onChange={(shippingPriceUsd) => setValue({ ...value, shippingPriceUsd: Number(shippingPriceUsd) })} />
      </div>
      <Textarea label={labels.config.description} value={value.deliveryInstructions} onChange={(deliveryInstructions) => setValue({ ...value, deliveryInstructions })} />
      {value.options.map((option, index) => (
        <div key={option.id} className="grid gap-3 rounded-md border border-slate-200 p-4 md:grid-cols-5">
          <Input label={labels.config.optionName} value={option.name} onChange={(name) => updateOption(index, { ...option, name })} />
          <Input label={labels.config.description} value={option.description} onChange={(description) => updateOption(index, { ...option, description })} />
          <Input label={labels.config.extraPrice} type="number" value={option.extraPriceUsd.toString()} onChange={(extraPriceUsd) => updateOption(index, { ...option, extraPriceUsd: Number(extraPriceUsd) })} />
          <Select
            label={labels.config.material}
            value={option.material}
            options={[
              ["standard_pvc", "Standard PVC"],
              ["premium_pvc", "Premium PVC"],
              ["laminated", "Laminated"]
            ]}
            onChange={(material) => updateOption(index, { ...option, material: material as PlatformConfig["physicalCards"]["options"][number]["material"] })}
          />
          <Toggle label={labels.config.active} checked={option.active} onChange={(active) => updateOption(index, { ...option, active })} />
        </div>
      ))}
      <button className="min-h-11 rounded-md border border-hub-green px-4 font-bold text-hub-green" type="button" onClick={() => setValue({ ...value, options: [...value.options, { id: `physical-${Date.now()}`, name: "Physical card", description: "Community physical card option.", extraPriceUsd: 10, material: "standard_pvc", deliveryMethods: ["pickup", "mail"], active: true }] })}>
        {labels.config.addCardOption}
      </button>
    </FormShell>
  );

  function updateOption(index: number, next: PlatformConfig["physicalCards"]["options"][number]) {
    setValue({ ...value, options: value.options.map((item, itemIndex) => (itemIndex === index ? next : item)) });
  }
}

function CardTemplatePreview({
  labels,
  template,
  communityName
}: {
  labels: Dictionary;
  template: PlatformConfig["communityCardTemplates"][number];
  communityName: string;
}) {
  const background = template.backgroundStyle === "deep-green" ? "#102118" : template.backgroundStyle === "cream" ? "#fff8e1" : "#ffffff";
  const text = template.backgroundStyle === "deep-green" ? "#ffffff" : "#17211c";
  const contrastSafe = template.backgroundStyle === "deep-green" || template.backgroundStyle === "white" || template.backgroundStyle === "light";

  return (
    <div className="grid gap-4 rounded-md bg-hub-mist p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-hub-green">{labels.config.preview}</p>
        <span className={`rounded-full px-2 py-1 text-[11px] font-black ${contrastSafe ? "bg-hub-green/10 text-hub-green" : "bg-hub-gold/20 text-yellow-800"}`}>
          {contrastSafe ? labels.config.contrastOk : labels.config.contrastRisk}
        </span>
      </div>
      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">{labels.config.frontPreview}</p>
        <div className="aspect-[1.586/1] overflow-hidden rounded-lg border border-slate-200 shadow-sm" style={{ background, color: text }}>
          <div className="h-3" style={{ background: `linear-gradient(90deg, ${template.primaryColor}, ${template.accentColor})` }} />
          <div className="grid h-[calc(100%-12px)] grid-cols-[34%_1fr] gap-4 p-4">
            <div className="rounded-lg bg-white/85 p-2">
              <div className="h-full rounded-md bg-slate-200" />
            </div>
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wide" style={{ color: template.accentColor }}>Member credential</p>
                  <p className="mt-2 truncate text-xl font-black leading-tight">Member Name</p>
                  <p className="mt-1 truncate text-[11px] font-bold opacity-80">CMP-US-2026-ZE-IN-INCN-000123</p>
                </div>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-xs font-black" style={{ color: template.primaryColor }}>{template.communityCode}</div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full px-3 py-1 text-[11px] font-black text-white" style={{ background: template.primaryColor }}>{template.communityCode}</span>
                <span className="rounded-full bg-white/85 px-3 py-1 text-[11px] font-black" style={{ color: template.primaryColor }}>EXP 05/10/2027</span>
              </div>
              <p className="mt-4 truncate text-xs font-bold opacity-75">{communityName}</p>
            </div>
          </div>
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">{labels.config.backPreview}</p>
        <div className="aspect-[1.586/1] rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-full items-center gap-4">
            <div className="grid h-28 w-28 shrink-0 place-items-center rounded-lg border-2 border-slate-900 text-lg font-black text-hub-ink">QR</div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-wide text-hub-green">Secure verification</p>
              <p className="mt-2 text-sm font-bold text-hub-ink">community.example/verify/opaque-token</p>
              <p className="mt-4 text-xs leading-5 text-slate-600">{template.contactInfo || communityName}</p>
              <p className="mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black text-white" style={{ background: template.primaryColor }}>{template.status.replace("_", " ")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type FormProps<T> = {
  config: PlatformConfig;
  labels: Dictionary;
  onSave: (value: T) => void;
};

function FormShell({ children, onSave, saveLabel }: { children: React.ReactNode; onSave: () => void; saveLabel: string }) {
  return (
    <div className="mt-5 grid gap-4">
      {children}
      <button className="min-h-12 rounded-md bg-hub-green px-5 py-3 font-bold text-white" type="button" onClick={onSave}>
        {saveLabel}
      </button>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-hub-ink">
      {label}
      <input className="min-h-11 rounded-md border border-slate-300 px-3 font-normal" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ColorInput({ label, value, onChange, defaultValue, resetLabel }: { label: string; value: string; onChange: (value: string) => void; defaultValue?: string; resetLabel: string }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-hub-ink">
      <span className="flex items-center justify-between gap-3">
        {label}
        {defaultValue ? (
          <button className="rounded-md bg-hub-mist px-2 py-1 text-xs font-black text-hub-green" type="button" onClick={() => onChange(defaultValue)}>
            {resetLabel}
          </button>
        ) : null}
      </span>
      <span className="flex min-h-11 overflow-hidden rounded-md border border-slate-300">
        <input className="h-11 w-14 border-0" type="color" value={value} onChange={(event) => onChange(event.target.value)} />
        <input className="min-w-0 flex-1 px-3 font-normal" value={value} onChange={(event) => onChange(event.target.value)} />
      </span>
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-hub-ink">
      {label}
      <select className="min-h-11 rounded-md border border-slate-300 px-3 font-normal" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-hub-ink md:col-span-2">
      {label}
      <textarea className="min-h-28 rounded-md border border-slate-300 p-3 font-normal" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md bg-hub-mist px-3 py-2 text-sm font-bold text-hub-ink">
      {label}
      <input className="h-5 w-5" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}
