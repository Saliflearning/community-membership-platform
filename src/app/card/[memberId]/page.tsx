import { notFound, redirect } from "next/navigation";
import { CardDownload } from "@/components/card-download";
import { HelpPanel } from "@/components/help-panel";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { adminCanAccessMember, getAuthenticatedAdmin, getAuthenticatedUser } from "@/lib/security/authz";
import { verifyCardAccessToken } from "@/lib/security/card-access";
import { generateCardMetadata } from "@/services/card-service";
import { getPlatformConfig } from "@/services/config-service";
import { findMemberByPublicId } from "@/services/member-service";

export default async function CardPage({ params, searchParams }: { params: Promise<{ memberId: string }>; searchParams: Promise<{ lang?: string; token?: string }> }) {
  const { memberId } = await params;
  const query = await searchParams;
  const locale = resolveLocale(query.lang);
  const t = getDictionary(locale);
  const member = await findMemberByPublicId(memberId);

  if (!member || member.status !== "active") {
    notFound();
  }

  // A signed card-access token (issued right after payment) authorizes the member to
  // view and download their own card without a full portal login.
  if (!verifyCardAccessToken(query.token, member.memberId)) {
    const [user, adminContext] = await Promise.all([getAuthenticatedUser(), getAuthenticatedAdmin()]);
    const canView =
      user?.email === member.email.toLowerCase() ||
      (adminContext ? adminCanAccessMember(adminContext.admin, member) : false);

    if (!user || !canView) {
      redirect(`/portal?lang=${locale}` as never);
    }
  }

  const card = await generateCardMetadata(member);
  const config = await getPlatformConfig();

  return (
    <main className="min-h-screen bg-hub-mist px-5 py-8">
      <section className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-hub-green">{locale === "fr" ? "Carte membre digitale" : "Digital membership card"}</p>
        <h1 className="mt-2 text-3xl font-bold text-hub-ink">{member.firstName} {member.lastName}</h1>
        <div className="mt-6">
          <CardDownload
            svg={card.cardSvg}
            memberId={member.memberId}
            label={locale === "fr" ? "Telecharger la carte PNG" : "Download PNG card"}
            alt={locale === "fr" ? "Carte membre generee" : "Generated membership card"}
          />
        </div>
        <div className="mt-6">
          <HelpPanel config={config} dictionary={t} context={locale === "fr" ? "La carte ne s'affiche pas correctement ?" : "Card not showing correctly?"} defaultCommunityCode={member.communityCode} />
        </div>
      </section>
    </main>
  );
}
