import Link from "next/link";
import { AdminLoginForm } from "@/components/admin-login-form";
import { resolveLocale } from "@/lib/i18n";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const locale = resolveLocale((await searchParams).lang);

  return (
    <main className="min-h-screen bg-hub-mist px-5 py-8">
      <section className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-soft">
        <Link className="text-sm font-semibold text-hub-green" href={`/?lang=${locale}`}>
          {locale === "fr" ? "Retour accueil" : "Return home"}
        </Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-hub-green">
          {locale === "fr" ? "Acces admin securise" : "Secure admin access"}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-hub-ink">
          {locale === "fr" ? "Connexion administrateur" : "Admin sign in"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {locale === "fr"
            ? "Utilisez un compte Supabase autorise par role admin. Les outils d'administration restent bloques sans session valide."
            : "Use a Supabase account that has an authorized admin role. Admin tools stay blocked without a valid session."}
        </p>
        <AdminLoginForm locale={locale} />
      </section>
    </main>
  );
}
