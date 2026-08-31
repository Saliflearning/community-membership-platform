import { notFound } from "next/navigation";
import { HelpPanel } from "@/components/help-panel";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { toPublicVerificationPayloadAsync } from "@/services/card-service";
import { getPlatformConfig } from "@/services/config-service";
import { findMemberByVerificationToken } from "@/services/member-service";

export default async function VerifyPage({ params, searchParams }: { params: Promise<{ memberId: string }>; searchParams: Promise<{ lang?: string }> }) {
  const { memberId: verificationToken } = await params;
  const locale = resolveLocale((await searchParams).lang);
  const t = getDictionary(locale);
  const member = await findMemberByVerificationToken(verificationToken);

  if (!member) {
    notFound();
  }

  const payload = await toPublicVerificationPayloadAsync(member);
  const config = await getPlatformConfig();
  const statusClass =
    payload.status === "active"
      ? "bg-hub-green text-white"
      : payload.status === "expired"
        ? "bg-hub-gold text-hub-ink"
        : "bg-hub-red text-white";

  return (
    <main className="min-h-screen bg-hub-mist px-5 py-8">
      <section className="mx-auto max-w-xl rounded-lg bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-hub-green">Verification</p>
        <h1 className="mt-2 text-3xl font-bold text-hub-ink">{t.verify.title}</h1>

        <div className="mt-6 rounded-lg border border-slate-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">{t.verify.member}</p>
              <p className="mt-1 text-xl font-bold text-hub-ink">{payload.name}</p>
            </div>
            <span className={`rounded-md px-3 py-2 text-sm font-bold capitalize ${statusClass}`}>{payload.status}</span>
          </div>

          <dl className="mt-6 grid gap-4 text-sm">
            <Info label={t.verify.community} value={payload.community} />
            <Info label={t.verify.expiration} value={payload.expirationDate ? new Date(payload.expirationDate).toLocaleDateString() : t.verify.pending} />
          </dl>
        </div>
        <div className="mt-6">
          <HelpPanel config={config} dictionary={t} context={t.verify.help} defaultCommunityCode={member.communityCode} />
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="font-bold text-hub-ink">{value}</dd>
    </div>
  );
}
