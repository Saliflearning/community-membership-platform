import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminConfigEditor } from "@/components/admin-config-editor";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { requireAdminPage } from "@/lib/security/authz";
import { getPlatformConfig } from "@/services/config-service";

export default async function AdminConfigPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const locale = resolveLocale((await searchParams).lang);
  const adminContext = await requireAdminPage();

  if (!adminContext) {
    redirect(`/admin/login?lang=${locale}` as never);
  }

  if (adminContext.admin.role !== "super_admin") {
    notFound();
  }

  const config = await getPlatformConfig();
  const t = getDictionary(locale);

  return (
    <main className="min-h-screen bg-hub-mist px-5 py-8">
      <section className="mx-auto max-w-6xl">
        <Link className="text-sm font-semibold text-hub-green" href={`/admin?lang=${locale}`}>
          {locale === "fr" ? "Retour tableau admin" : "Back to dashboard"}
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-hub-ink">{t.admin.configTitle}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          {t.admin.configSubtitle}
        </p>
        <div className="mt-6">
          <AdminConfigEditor initialConfig={config} dictionary={t} />
        </div>
      </section>
    </main>
  );
}
