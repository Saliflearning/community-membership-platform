import { resolveLocale } from "@/lib/i18n";

export default async function AccountClosurePage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const locale = resolveLocale((await searchParams).lang);
  return (
    <main className="min-h-screen bg-hub-mist px-5 py-8">
      <section className="mx-auto max-w-xl rounded-lg bg-white p-6 shadow-soft">
        <h1 className="text-3xl font-bold text-hub-ink">{locale === "fr" ? "Demande de fermeture de compte" : "Account closure request"}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{locale === "fr" ? "Demandez une fermeture de compte ou une revue de suppression. Un admin verifiera l'identite avant traitement." : "Request account closure or deletion review. An admin will verify identity before processing."}</p>
        <form action="/api/account-closure" method="post" className="mt-6 grid gap-4">
          <input className="min-h-12 rounded-md border border-slate-300 px-3" name="email" type="email" placeholder="Email" required />
          <input className="min-h-12 rounded-md border border-slate-300 px-3" name="memberId" placeholder={locale === "fr" ? "ID membre optionnel" : "Member ID optional"} />
          <select className="min-h-12 rounded-md border border-slate-300 px-3" name="requestType">
            <option value="close_account">{locale === "fr" ? "Fermer le compte" : "Close account"}</option>
            <option value="delete_data">{locale === "fr" ? "Supprimer les donnees" : "Delete data"}</option>
          </select>
          <textarea className="min-h-24 rounded-md border border-slate-300 p-3" name="reason" placeholder={locale === "fr" ? "Raison optionnelle" : "Reason optional"} />
          <button className="min-h-12 rounded-md bg-hub-green px-5 py-3 font-bold text-white" type="submit">{locale === "fr" ? "Envoyer la demande" : "Submit request"}</button>
        </form>
      </section>
    </main>
  );
}
