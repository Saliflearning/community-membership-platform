import Link from "next/link";
import { getDictionary, resolveLocale } from "@/lib/i18n";

export default async function PrivacyPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const locale = resolveLocale((await searchParams).lang);
  const t = getDictionary(locale);
  return (
    <main className="min-h-screen bg-hub-mist px-5 py-8">
      <article className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-soft">
        <h1 className="text-3xl font-bold text-hub-ink">{t.common.privacy}</h1>
        <div className="mt-5 grid gap-4 text-sm leading-7 text-slate-700">
          <p>{locale === "fr" ? "Nous collectons les informations d'identite, les contacts, le choix de communaute, la photo membre, les paiements, les demandes support et les metadonnees de verification pour operer le systeme." : "We collect member identity details, contact information, community selection, member photo, payment records, support requests, and verification metadata to operate the membership system."}</p>
          <p>{locale === "fr" ? "Les photos servent a generer les cartes et ne sont pas affichees par defaut sur la page publique de verification." : "Member photos are used for card generation and are not exposed on the public verification page by default."}</p>
          <p>{locale === "fr" ? "Les admins accedent seulement aux dossiers dans leur perimetre autorise. Les actions admin sont journalisees." : "Admins can only access records within their authorized scope. Admin actions are audit logged."}</p>
          <p>{locale === "fr" ? "Les membres peuvent demander la fermeture du compte ou la suppression des donnees. Certains enregistrements peuvent etre conserves pour les paiements, l'audit, la prevention de fraude ou les obligations legales." : "Members may request account closure or data deletion. Some records may be retained where required for payment, audit, fraud prevention, or legal obligations."}</p>
          <p><Link className="font-bold text-hub-green underline" href={`/account/closure?lang=${locale}`}>{locale === "fr" ? "Demander une fermeture ou suppression" : "Request account closure or data deletion"}</Link></p>
        </div>
      </article>
    </main>
  );
}
