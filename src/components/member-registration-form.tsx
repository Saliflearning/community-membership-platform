"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";
import { allowedPhotoTypes, maxOriginalPhotoBytes, maxStoredPhotoBytes, photoMaxDimension } from "@/lib/uploads/photo";
import type { PlatformConfig } from "@/types/domain";

export function MemberRegistrationForm({
  config,
  locale,
  dictionary,
  showcaseMode = false
}: {
  config: PlatformConfig;
  locale: Locale;
  dictionary: Dictionary;
  showcaseMode?: boolean;
}) {
  const activeCountries = [...config.countries].sort((a, b) => (a.code === "US" ? -1 : b.code === "US" ? 1 : a.name.localeCompare(b.name)));
  const [countryCode, setCountryCode] = useState("US");
  const country = activeCountries.find((candidate) => candidate.code === countryCode) ?? activeCountries[0];
  const regions = config.regions.filter((region) => region.countryCode === countryCode && region.active);
  const [regionCode, setRegionCode] = useState(regions[0]?.code ?? "");
  const selectedRegion = config.regions.find((region) => region.code === regionCode) ?? regions[0];
  const stateCode = selectedRegion?.code.replace(`${countryCode}-`, "") ?? "IN";
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoStatus, setPhotoStatus] = useState<string>("");
  const [photoPrepared, setPhotoPrepared] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isPreparing, setIsPreparing] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [communityCode, setCommunityCode] = useState("");
  const [physicalChoice, setPhysicalChoice] = useState<"digital_only" | "pickup" | "mail">("digital_only");
  const activePhysicalOptions = config.physicalCards.offered ? config.physicalCards.options.filter((option) => option.active && option.deliveryMethods.includes(physicalChoice as "pickup" | "mail")) : [];
  const activeCommunities = config.communities.filter(
    (community) => community.active && community.countryCode === countryCode
  );
  const activeTiers = config.membershipTiers.filter(
    (tier) => tier.active && tier.countryCode === countryCode
  );
  const availableCommunities = activeCommunities.filter(
    (community) => community.regionCode === selectedRegion?.code
  );
  const effectiveCommunityCode = availableCommunities.some(
    (community) => community.code === communityCode
  )
    ? communityCode
    : availableCommunities[0]?.code ?? "__setup_required__";
  const selectedCommunity = availableCommunities.find(
    (community) => community.code === effectiveCommunityCode
  );
  const selectedZone = selectedCommunity
    ? config.zones.find((zone) => zone.code === selectedCommunity.zoneCode)
    : config.zones.find((zone) => zone.regionCodes.includes(selectedRegion?.code ?? ""));
  const isCountryActive = country?.active;
  const communitySetupRequested = effectiveCommunityCode === "__setup_required__";
  const needsCommunitySetup = Boolean(isCountryActive && selectedRegion && communitySetupRequested);
  const canSubmit = Boolean(isCountryActive && selectedCommunity && activeTiers.length > 0 && !needsCommunitySetup);
  const t = dictionary;
  const visibility = (field: string) => config.registrationFields.find((item) => item.field === field)?.visibility ?? "required";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (photoPrepared) {
      return;
    }

    const input = photoInputRef.current;
    const file = input?.files?.[0];

    if (!file) {
      return;
    }

    const form = event.currentTarget;
    event.preventDefault();
    setSubmitError("");
    setIsPreparing(true);

    try {
      const compressed = await preparePhotoForUpload(file);
      const transfer = new DataTransfer();
      transfer.items.add(compressed);
      input.files = transfer.files;
      setPhotoPrepared(true);
      setPhotoStatus(
        locale === "fr"
          ? `Photo optimisee pour l'envoi (${formatBytes(compressed.size)}).`
          : `Photo optimized for upload (${formatBytes(compressed.size)}).`
      );
      window.setTimeout(() => form.requestSubmit(), 0);
    } catch (error) {
      setIsPreparing(false);
      setSubmitError(error instanceof Error ? error.message : locale === "fr" ? "Photo impossible a preparer." : "Unable to prepare photo.");
    }
  }

  return (
    <form className="rounded-lg bg-white p-5 shadow-soft md:p-7" action="/api/registrations" method="post" encType="multipart/form-data" onSubmit={handleSubmit}>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-hub-green">{locale === "fr" ? "Inscription membre" : "Member registration"}</p>
        <h2 className="mt-2 text-2xl font-bold text-hub-ink">{t.registration.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {t.registration.intro}
        </p>
      </div>

      <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-hub-ink">
          {t.registration.country}
          <select
            className="min-h-12 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 text-base outline-none transition focus:border-hub-green focus:ring-2 focus:ring-hub-green/20"
            name="countryCode"
            required
            value={countryCode}
            onChange={(event) => {
              const nextCountry = event.target.value;
              setCountryCode(nextCountry);
              setRegionCode(config.regions.find((region) => region.countryCode === nextCountry && region.active)?.code ?? "");
            }}
          >
            {activeCountries.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name} {!item.active ? `- ${t.common.setupRequired}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-hub-ink">
          {t.registration.region}
          <select
            className="min-h-12 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 text-base outline-none transition focus:border-hub-green focus:ring-2 focus:ring-hub-green/20"
            name="regionCode"
            required
            value={selectedRegion?.code ?? ""}
            disabled={!isCountryActive}
            onChange={(event) => setRegionCode(event.target.value)}
          >
            {regions.map((region) => (
              <option key={region.code} value={region.code}>
                {region.name}
              </option>
            ))}
          </select>
        </label>

        <input name="state" type="hidden" value={stateCode} />
        <Field label={t.registration.firstName} name="firstName" required disabled={!isCountryActive} />
        <Field label={t.registration.lastName} name="lastName" required disabled={!isCountryActive} />
        <Field label={t.registration.email} name="email" type="email" required disabled={!isCountryActive} />
        {visibility("phone") !== "hidden" ? (
          <Field label={t.registration.phone} name="phone" type="tel" required={visibility("phone") === "required"} disabled={!isCountryActive} />
        ) : null}

        <label className="grid gap-2 text-sm font-semibold text-hub-ink sm:col-span-2">
          {t.registration.community}
          <select
            className="min-h-12 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 text-base outline-none transition focus:border-hub-green focus:ring-2 focus:ring-hub-green/20 disabled:bg-slate-100"
            name="communityCode"
            required
            disabled={!isCountryActive}
            value={effectiveCommunityCode}
            onChange={(event) => setCommunityCode(event.target.value)}
          >
            {availableCommunities.map((community) => (
              <option key={community.code} value={community.code}>
                {community.officialName}
              </option>
            ))}
            <option value="__setup_required__">{t.registration.communityNotListed}</option>
          </select>
        </label>

        {needsCommunitySetup ? (
          <div className="rounded-md border border-hub-gold/40 bg-hub-gold/10 p-4 text-sm leading-6 text-hub-ink sm:col-span-2">
            <p className="font-bold">{t.registration.communitySetupTitle}</p>
            <p className="mt-1 text-slate-700">{t.registration.communitySetupBody}</p>
            <a className="mt-3 inline-flex min-h-10 items-center rounded-md bg-hub-ink px-4 text-sm font-bold text-white" href="#support">
              {t.registration.requestCommunitySetup}
            </a>
          </div>
        ) : null}

        {visibility("membershipTier") !== "hidden" ? <label className="grid gap-2 text-sm font-semibold text-hub-ink">
          {t.registration.tier}
          <select className="min-h-12 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 text-base disabled:bg-slate-100" name="tier" required={visibility("membershipTier") === "required"} disabled={!isCountryActive}>
            {activeTiers.map((tier) => (
              <option key={tier.code} value={tier.code}>
                {tier.name} - ${tier.priceUsd}
              </option>
            ))}
          </select>
        </label> : <input name="tier" type="hidden" value={activeTiers[0]?.code ?? ""} />}

        {config.physicalCards.offered ? (
          <section className="grid gap-3 rounded-md border border-slate-200 bg-hub-mist/50 p-4 sm:col-span-2">
            <div>
              <p className="text-sm font-bold text-hub-ink">{t.registration.physicalCardTitle}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{config.physicalCards.deliveryInstructions}</p>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              <ChoiceRadio label={t.registration.digitalOnly} value="digital_only" checked={physicalChoice === "digital_only"} onChange={setPhysicalChoice} />
              {config.physicalCards.pickupEnabled ? <ChoiceRadio label={t.registration.pickupCard} value="pickup" checked={physicalChoice === "pickup"} onChange={setPhysicalChoice} /> : null}
              {config.physicalCards.mailEnabled ? <ChoiceRadio label={t.registration.mailCard} value="mail" checked={physicalChoice === "mail"} onChange={setPhysicalChoice} /> : null}
            </div>
            {physicalChoice !== "digital_only" ? (
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-hub-ink">
                  {t.registration.cardQuality}
                  <select className="min-h-12 rounded-md border border-slate-300 bg-white px-3" name="physicalCardOptionId" required>
                    {activePhysicalOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name} - ${option.extraPriceUsd}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="rounded-md bg-white p-3 text-sm text-slate-700">
                  <p className="font-bold text-hub-ink">{t.registration.priceBreakdown}</p>
                  <p>{physicalChoice === "mail" ? `+ $${config.physicalCards.shippingPriceUsd} ${t.registration.shipping}` : t.registration.noShipping}</p>
                </div>
              </div>
            ) : null}
            {physicalChoice === "mail" ? (
              <div className="grid gap-3 md:grid-cols-2">
                <Field label={t.registration.mailingFullName} name="mailingFullName" required />
                <Field label={t.registration.mailingStreet} name="mailingStreet" required />
                <Field label={t.registration.mailingUnit} name="mailingUnit" />
                <Field label={t.registration.mailingCity} name="mailingCity" required />
                <Field label={t.registration.mailingRegion} name="mailingRegion" required />
                <Field label={t.registration.mailingPostalCode} name="mailingPostalCode" required />
                <Field label={t.registration.mailingCountry} name="mailingCountry" required />
                <Field label={t.registration.mailingPhone} name="mailingPhone" type="tel" />
              </div>
            ) : null}
          </section>
        ) : null}

        <input name="durationYears" type="hidden" value={activeTiers[0]?.durationYears ?? 1} />

        {visibility("languagePreference") !== "hidden" ? <label className="grid gap-2 text-sm font-semibold text-hub-ink">
          {t.registration.language}
          <select className="min-h-12 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 text-base" name="preferredLanguage" defaultValue={locale}>
            <option value="fr">{t.common.french}</option>
            <option value="en">{t.common.english}</option>
          </select>
        </label> : <input name="preferredLanguage" type="hidden" value={locale} />}

        {visibility("photo") !== "hidden" ? <label className="grid gap-2 text-sm font-semibold text-hub-ink">
          {t.registration.photo}
          <span className="text-xs font-normal text-slate-500">{t.registration.photoHint}</span>
          <input
            ref={photoInputRef}
            className="min-h-12 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-hub-ink file:px-3 file:py-2 file:text-sm file:font-bold file:text-white"
            name="profilePhoto"
            type="file"
            accept="image/png,image/jpeg"
            required={visibility("photo") === "required"}
            disabled={!isCountryActive}
            onChange={(event) => {
              const file = event.target.files?.[0];
              setPhotoPrepared(false);
              setSubmitError("");
              setPhotoStatus(file ? `${file.name} / ${formatBytes(file.size)}` : "");
              setPhotoPreview(file ? URL.createObjectURL(file) : null);
            }}
          />
        </label> : null}
      </div>

      {photoPreview ? (
        <div className="mt-5 flex items-center gap-4 rounded-md border border-slate-200 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="h-20 w-20 rounded-md object-cover" src={photoPreview} alt="Selected member photo preview" />
          <div>
            <p className="text-sm font-semibold text-slate-700">{t.registration.previewReady}</p>
            {photoStatus ? <p className="mt-1 text-xs font-semibold text-slate-500">{photoStatus}</p> : null}
          </div>
        </div>
      ) : null}

      {submitError ? (
        <div className="mt-5 rounded-md border border-hub-red/30 bg-hub-red/10 p-4 text-sm font-semibold text-hub-red">
          {submitError}
        </div>
      ) : null}

      <div className="mt-5 rounded-md border border-hub-green/15 bg-hub-green/5 p-4 text-sm text-hub-ink">
        <span className="font-semibold">{t.registration.autoAssigned}:</span> {country?.name ?? "USA"} / {selectedRegion?.name ?? stateCode} / {selectedZone?.name ?? selectedCommunity?.zoneCode ?? ""}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {country?.flagDataUrl ? <IdentityImage src={country.flagDataUrl} label={country.demonym} /> : null}
          {selectedRegion?.flagDataUrl ? <IdentityImage src={selectedRegion.flagDataUrl} label={selectedRegion.name} /> : null}
          {selectedZone ? <span className="rounded-md bg-hub-green px-2 py-1 text-xs font-bold text-white">{selectedZone.code}</span> : null}
          {selectedCommunity ? <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-hub-ink">{selectedCommunity.code}</span> : null}
        </div>
        {!isCountryActive ? <p className="mt-3 font-semibold text-hub-red">{t.common.setupRequired}</p> : null}
        {needsCommunitySetup ? <p className="mt-3 font-semibold text-hub-red">{t.registration.communitySetupShort}</p> : null}
      </div>

      <div className="mt-5 grid gap-3 rounded-md border border-slate-200 p-4 text-sm text-slate-700">
        <label className="flex gap-3">
          <input className="mt-1 h-5 w-5" name="consentAccepted" type="checkbox" required />
          <span>{t.registration.consentIdentity}</span>
        </label>
        <label className="flex gap-3">
          <input className="mt-1 h-5 w-5" name="privacyAccepted" type="checkbox" required />
          <span>
            {t.registration.consentPolicy} <Link className="font-bold text-hub-green underline" href={`/terms?lang=${locale}`}>{t.common.terms}</Link>{" "}
            <Link className="font-bold text-hub-green underline" href={`/privacy?lang=${locale}`}>{t.common.privacy}</Link>
          </span>
        </label>
      </div>

      {needsCommunitySetup ? (
        <a
          className="mt-6 flex min-h-12 w-full items-center justify-center rounded-md bg-hub-ink px-5 py-3 text-base font-bold text-white transition hover:bg-black"
          href="#support"
        >
          {t.registration.requestCommunitySetup}
        </a>
      ) : (
        <button
          className="mt-6 min-h-12 w-full rounded-md bg-hub-green px-5 py-3 text-base font-bold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          type="submit"
          disabled={showcaseMode || !canSubmit || isPreparing}
        >
          {showcaseMode
            ? locale === "fr"
              ? "Mode demonstration - envoi desactive"
              : "Demo mode - submission disabled"
            : isPreparing
              ? locale === "fr"
                ? "Preparation de la photo..."
                : "Preparing photo..."
              : canSubmit
                ? t.registration.continue
                : t.common.comingSoon}
        </button>
      )}
    </form>
  );
}

async function preparePhotoForUpload(file: File) {
  if (!allowedPhotoTypes.includes(file.type as (typeof allowedPhotoTypes)[number])) {
    throw new Error("Photo must be JPG or PNG.");
  }

  if (file.size > maxOriginalPhotoBytes) {
    throw new Error("Photo must be 5 MB or smaller before optimization.");
  }

  const image = await loadImage(file);
  const scale = Math.min(1, photoMaxDimension / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Photo could not be processed in this browser.");
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  for (const quality of [0.86, 0.78, 0.7, 0.62]) {
    const blob = await canvasToBlob(canvas, "image/jpeg", quality);

    if (blob.size <= maxStoredPhotoBytes) {
      return new File([blob], renameAsJpeg(file.name), { type: "image/jpeg" });
    }
  }

  throw new Error("Photo is still too large after optimization. Please choose a smaller image.");
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Photo could not be read."));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Photo could not be compressed."));
      }
    }, type, quality);
  });
}

function renameAsJpeg(name: string) {
  return name.replace(/\.[^.]+$/, "") + ".jpg";
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ChoiceRadio({
  label,
  value,
  checked,
  onChange
}: {
  label: string;
  value: "digital_only" | "pickup" | "mail";
  checked: boolean;
  onChange: (value: "digital_only" | "pickup" | "mail") => void;
}) {
  return (
    <label className={`flex min-h-12 items-center gap-3 rounded-md border px-3 text-sm font-bold ${checked ? "border-hub-green bg-white text-hub-green" : "border-slate-200 bg-white text-hub-ink"}`}>
      <input name="physicalCardChoice" type="radio" value={value} checked={checked} onChange={() => onChange(value)} />
      {label}
    </label>
  );
}

function IdentityImage({ src, label }: { src: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md bg-white px-2 py-1 text-xs font-bold text-hub-ink">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="h-4 w-7 rounded-sm object-cover" src={src} alt="" />
      {label}
    </span>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  disabled = false
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-hub-ink">
      {label}
      <input
        className="min-h-12 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 text-base outline-none transition focus:border-hub-green focus:ring-2 focus:ring-hub-green/20 disabled:bg-slate-100"
        name={name}
        type={type}
        required={required}
        disabled={disabled}
      />
    </label>
  );
}
