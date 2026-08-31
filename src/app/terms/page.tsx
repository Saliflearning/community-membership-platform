import Link from "next/link";
import { getDictionary, resolveLocale } from "@/lib/i18n";

export default async function TermsPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const locale = resolveLocale((await searchParams).lang);
  const t = getDictionary(locale);
  return (
    <PolicyPage title={t.common.terms}>
      <p>{locale === "fr" ? "Les services d'adhesion servent a gerer l'identite communautaire, les contributions, les cartes, les renouvellements et la verification." : "Membership services are provided for community identity, contribution tracking, card generation, renewals, and verification."}</p>
      <p>{locale === "fr" ? "Les membres acceptent de fournir des informations exactes et d'utiliser leur carte uniquement pour leur propre verification d'identite." : "Members agree to provide accurate information and to use membership cards only for their own identity verification."}</p>
      <p>{locale === "fr" ? "Les paiements sont des contributions d'adhesion. Les remboursements, annulations et corrections manuelles sont traites par des admins autorises et journalises." : "Payments are membership contributions. Refunds, cancellations, and manual payment corrections are handled by authorized admins and logged."}</p>
      <p><Link className="font-bold text-hub-green underline" href={`/privacy?lang=${locale}`}>{locale === "fr" ? "Lire la politique de confidentialite" : "Read the Privacy Policy"}</Link></p>
    </PolicyPage>
  );
}

function PolicyPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-hub-mist px-5 py-8">
      <article className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-soft">
        <h1 className="text-3xl font-bold text-hub-ink">{title}</h1>
        <div className="mt-5 grid gap-4 text-sm leading-7 text-slate-700">{children}</div>
      </article>
    </main>
  );
}
