import Link from "next/link";
import { resolveLocale } from "@/lib/i18n";

export default async function PaymentRetryPage({ searchParams }: { searchParams: Promise<{ memberId?: string; lang?: string }> }) {
  const params = await searchParams;
  const locale = resolveLocale(params.lang);
  return (
    <main className="min-h-screen bg-hub-mist px-5 py-8">
      <section className="mx-auto max-w-xl rounded-lg bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-hub-red">{locale === "fr" ? "Probleme de paiement" : "Payment issue"}</p>
        <h1 className="mt-2 text-3xl font-bold text-hub-ink">{locale === "fr" ? "Reessayer le paiement" : "Retry membership payment"}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {locale === "fr" ? "Le paiement n'a pas ete finalise. Vous pouvez reessayer ou contacter le support si le debit apparait sur votre compte." : "Your payment was not completed. You can retry checkout or contact support if the charge appears on your account."}
        </p>
        <Link className="mt-6 inline-flex rounded-md bg-hub-green px-5 py-3 font-bold text-white" href={`/?retryMemberId=${params.memberId ?? ""}&lang=${locale}`}>
          {locale === "fr" ? "Retour a l'inscription" : "Return to registration"}
        </Link>
      </section>
    </main>
  );
}
