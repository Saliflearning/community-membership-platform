import Link from "next/link";
import { HelpPanel } from "@/components/help-panel";
import { MemberLoginForm } from "@/components/member-login-form";
import { ReassignmentRequestForm } from "@/components/reassignment-request-form";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { getAuthenticatedUser } from "@/lib/security/authz";
import { getPlatformConfig } from "@/services/config-service";
import { listMembersByEmail } from "@/services/member-service";

export default async function PortalPage({ searchParams }: { searchParams: Promise<{ lang?: string; email?: string; next?: string; authError?: string }> }) {
  const config = await getPlatformConfig();
  const params = await searchParams;
  const locale = resolveLocale(params.lang);
  const t = getDictionary(locale);
  const user = await getAuthenticatedUser();
  const members = user ? await listMembersByEmail(user.email) : [];
  const activeMembers = members.filter((member) => member.status === "active");
  const nextPath = params.next && params.next.startsWith("/") && !params.next.startsWith("//") ? params.next : "/portal";

  return (
    <main className="min-h-screen bg-hub-mist px-5 py-8">
      <section className="mx-auto max-w-4xl">
        <Link className="text-sm font-semibold text-hub-green" href={`/?lang=${locale}`}>
          {locale === "fr" ? "Retour a l'inscription" : "Back to registration"}
        </Link>
        <div className="mt-5 rounded-lg bg-white p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-wide text-hub-green">{t.common.portal}</p>
          <h1 className="mt-2 text-3xl font-bold text-hub-ink">
            {user
              ? locale === "fr"
                ? "Mes adhesions"
                : "My memberships"
              : locale === "fr"
                ? "Acces membre securise"
                : "Secure member access"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            {user
              ? locale === "fr"
                ? `Connecte avec ${user.email}. Seuls les dossiers rattaches a cet email sont affiches.`
                : `Signed in as ${user.email}. Only records tied to this email are shown.`
              : locale === "fr"
                ? "Recevez un lien magique par email pour acceder a votre carte, vos renouvellements et vos demandes."
                : "Receive a magic link by email to access your card, renewals, and requests."}
          </p>
          {params.authError ? (
            <div className="mt-4 rounded-md border border-hub-red/30 bg-hub-red/10 p-4 text-sm font-semibold text-hub-red">
              {locale === "fr"
                ? "Le lien de connexion est invalide ou expire. Demandez un nouveau lien ci-dessous."
                : "The sign-in link is invalid or expired. Request a new link below."}
            </div>
          ) : null}

          {!user ? (
            <MemberLoginForm locale={locale} initialEmail={params.email ?? ""} nextPath={nextPath} />
          ) : (
            <div className="mt-6 grid gap-3">
              {members.length ? (
                members.map((member) => (
                  <article key={member.memberId} className="rounded-md border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold text-hub-ink">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-600">{member.memberId}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {member.communityCode} / {member.regionCode} / {member.zoneCode}
                        </p>
                      </div>
                      <span className={`rounded-md px-3 py-2 text-xs font-bold ${member.status === "active" ? "bg-hub-green/10 text-hub-green" : "bg-hub-gold/20 text-yellow-800"}`}>
                        {member.status}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {member.status === "active" ? (
                        <Link className="rounded-md bg-hub-green px-4 py-3 text-sm font-bold text-white" href={`/card/${member.memberId}?lang=${locale}`}>
                          {locale === "fr" ? "Voir ma carte" : "View my card"}
                        </Link>
                      ) : (
                        <span className="rounded-md bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600">
                          {locale === "fr" ? "Carte disponible apres activation" : "Card available after activation"}
                        </span>
                      )}
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-md border border-dashed border-slate-300 bg-hub-mist p-5">
                  <p className="font-bold text-hub-ink">
                    {locale === "fr" ? "Aucune adhesion trouvee pour cet email" : "No memberships found for this email"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {locale === "fr"
                      ? "Utilisez le meme email que pendant l'inscription ou contactez le support de votre communaute."
                      : "Use the same email from registration or contact your community support team."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        {activeMembers.length ? <ReassignmentRequestForm config={config} dictionary={t} locale={locale} /> : null}
        <div className="mt-6">
          <HelpPanel config={config} dictionary={t} context={locale === "fr" ? "Besoin d'aide pour renouveler ou modifier votre profil ?" : "Need renewal, profile, or reassignment help?"} />
        </div>
      </section>
    </main>
  );
}
