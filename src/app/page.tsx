import Link from "next/link";
import { HelpPanel } from "@/components/help-panel";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MemberRegistrationForm } from "@/components/member-registration-form";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { env } from "@/lib/env";
import { getPlatformConfig } from "@/services/config-service";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const config = await getPlatformConfig();
  const locale = resolveLocale((await searchParams).lang);
  const t = getDictionary(locale);
  const activeZones = config.zones.filter((zone) => zone.active).length;
  const activeCommunities = config.communities.filter((community) => community.active).length;
  const activeTiers = config.membershipTiers.filter((tier) => tier.active).length;
  const launchCountry = config.countries.find((country) => country.code === "US") ?? config.countries.find((country) => country.active);

  return (
    <main id="main-content" className="min-h-screen bg-[linear-gradient(180deg,#eef6ee_0%,#f6f7f2_42%,#ffffff_100%)]">
      <section className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-5 md:px-8">
        <nav className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/80 bg-white/85 px-4 py-3 shadow-soft backdrop-blur md:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-hub-green text-sm font-black text-white">
              CM
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-hub-ink">{t.home.brandKicker}</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-600">{t.home.layer}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <LanguageSwitcher locale={locale} label={t.common.language} />
            <Link
              href={`/portal?lang=${locale}`}
              className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-hub-ink transition hover:border-hub-green hover:text-hub-green"
            >
              {t.common.portal}
            </Link>
          </div>
        </nav>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 pb-8 pt-3 sm:px-5 md:px-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
        <div className="grid gap-6">
          <section className="overflow-hidden rounded-lg bg-hub-ink text-white shadow-soft">
            <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:p-10">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-wide text-hub-gold">
                  <span className="h-2 w-2 rounded-full bg-hub-gold" />
                  {t.home.secureBadge}
                </div>
                <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
                  {t.home.headline}
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-white/78 sm:text-lg">
                  {t.home.body}
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <a
                    className="inline-flex min-h-12 items-center justify-center rounded-md bg-hub-gold px-5 py-3 text-sm font-black text-hub-ink transition hover:bg-yellow-300"
                    href="#registration"
                  >
                    {t.home.primaryAction}
                  </a>
                  <a
                    className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/25 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
                    href="#how-it-works"
                  >
                    {t.home.secondaryAction}
                  </a>
                </div>
              </div>

              <div className="rounded-lg border border-white/15 bg-white/8 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-hub-gold">{t.home.startHere}</p>
                <div className="mt-4 grid gap-3">
                  <TrustItem title={t.home.countryFirstTitle} body={launchCountry?.name ?? "Community Platform"} />
                  <TrustItem title={t.home.paymentTrustTitle} body={t.home.paymentTrustBody} />
                  <TrustItem title={t.home.cardTrustTitle} body={t.home.cardTrustBody} />
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <Stat label={t.home.statsZones} value={activeZones.toString()} tone="green" />
            <Stat label={t.home.statsCommunities} value={activeCommunities.toString()} tone="gold" />
            <Stat label={t.home.statsTiers} value={activeTiers.toString()} tone="red" />
          </section>

          <OnboardingSteps t={t} />
        </div>

        <aside className="lg:sticky lg:top-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-sm font-bold uppercase tracking-wide text-hub-green">{t.home.memberPathTitle}</p>
            <h2 className="mt-2 text-2xl font-black text-hub-ink">{t.registration.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{t.home.memberPathBody}</p>
            <div className="mt-5 grid gap-3">
              <a className="inline-flex min-h-12 items-center justify-center rounded-md bg-hub-green px-5 py-3 text-sm font-black text-white" href="#registration">
                {t.home.primaryAction}
              </a>
              <Link className="inline-flex min-h-12 items-center justify-center rounded-md border border-slate-300 px-5 py-3 text-sm font-black text-hub-ink" href={`/portal?lang=${locale}`}>
                {t.common.portal}
              </Link>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">{t.home.trustNote}</p>
          </div>
        </aside>
      </section>

      <section id="registration" className="mx-auto grid w-full max-w-7xl gap-6 px-4 pb-8 sm:px-5 md:px-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-lg bg-white p-5 shadow-soft">
          <p className="text-sm font-bold uppercase tracking-wide text-hub-green">{t.home.formGuideKicker}</p>
          <h2 className="mt-2 text-2xl font-black text-hub-ink">{t.home.formGuideTitle}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{t.registration.intro}</p>
          <div className="mt-5 grid gap-3">
            <GuideItem number="1" label={t.steps.country} body={t.home.countryGuide} />
            <GuideItem number="2" label={t.steps.community} body={t.home.communityGuide} />
            <GuideItem number="3" label={t.steps.payment} body={t.home.paymentGuide} />
          </div>
        </div>
        <div className="min-w-0">
          {env.showcaseMode ? (
            <p className="mb-3 rounded-md border border-hub-gold bg-yellow-50 px-4 py-3 text-sm font-semibold text-hub-ink">
              Portfolio demo mode: all data shown is synthetic and submissions are disabled.
            </p>
          ) : null}
          <MemberRegistrationForm config={config} locale={locale} dictionary={t} showcaseMode={env.showcaseMode} />
        </div>
      </section>

      <section id="support" className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-5 md:px-8">
        <HelpPanel config={config} dictionary={t} context={t.home.helpTitle} />
      </section>
    </main>
  );
}

function OnboardingSteps({ t }: { t: ReturnType<typeof getDictionary> }) {
  const steps = [
    { label: t.steps.country, icon: "01", body: t.home.stepCountryBody },
    { label: t.steps.identity, icon: "02", body: t.home.stepIdentityBody },
    { label: t.steps.payment, icon: "03", body: t.home.stepPaymentBody },
    { label: t.steps.card, icon: "04", body: t.home.stepCardBody }
  ];

  return (
    <section id="how-it-works" className="rounded-lg bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-hub-green">{t.home.stepsTitle}</p>
          <h2 className="mt-1 text-2xl font-black text-hub-ink">{t.home.stepsHeading}</h2>
        </div>
        <span className="rounded-full bg-hub-mist px-3 py-2 text-xs font-bold text-hub-green">{t.home.mobileReady}</span>
      </div>
      <div className="mt-5 grid auto-rows-fr gap-3 md:grid-cols-4">
        {steps.map((step, index) => (
          <div key={step.label} className="min-h-[150px] rounded-md border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-hub-green text-xs font-black text-white">{step.icon}</span>
              <span className="text-xs font-bold text-slate-400">{index + 1}/4</span>
            </div>
            <h3 className="mt-4 text-base font-black leading-5 text-hub-ink">{step.label}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p>
          </div>
        ))}
      </div>
      <p className="mt-5 rounded-md bg-hub-mist p-4 text-sm leading-6 text-slate-700">
        {t.home.trustNote}
      </p>
    </section>
  );
}

function TrustItem({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/8 p-3">
      <p className="text-sm font-black text-white">{title}</p>
      <p className="mt-1 text-xs leading-5 text-white/68">{body}</p>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "green" | "gold" | "red" }) {
  const toneClass =
    tone === "green"
      ? "border-hub-green/20 bg-hub-green/10 text-hub-green"
      : tone === "gold"
        ? "border-hub-gold/40 bg-hub-gold/20 text-yellow-800"
        : "border-hub-red/20 bg-hub-red/10 text-hub-red";

  return (
    <div className={`rounded-lg border p-5 shadow-soft ${toneClass}`}>
      <p className="text-3xl font-black sm:text-4xl">{value}</p>
      <p className="mt-2 text-sm font-bold capitalize leading-5 text-hub-ink">{label}</p>
    </div>
  );
}

function GuideItem({ number, label, body }: { number: string; label: string; body: string }) {
  return (
    <div className="grid grid-cols-[34px_1fr] gap-3 rounded-md border border-slate-200 p-3">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-hub-green text-xs font-black text-white">{number}</span>
      <div>
        <p className="text-sm font-black text-hub-ink">{label}</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">{body}</p>
      </div>
    </div>
  );
}
