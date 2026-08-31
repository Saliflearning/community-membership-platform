import Link from "next/link";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { requireAdminPage } from "@/lib/security/authz";
import { listAdmins } from "@/services/admin-service";
import { listAuditLogs } from "@/services/audit-service";
import { getPlatformConfig } from "@/services/config-service";
import { getAdminMetrics } from "@/services/member-service";
import { listPhysicalCardPrintRequests } from "@/services/physical-card-service";
import { listReassignmentRequests } from "@/services/reassignment-service";
import { listSupportTickets } from "@/services/support-service";

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<{ lang?: string; role?: string; community?: string }>;
}) {
  const params = await searchParams;
  const locale = resolveLocale(params.lang);
  const adminContext = await requireAdminPage();

  if (!adminContext) {
    redirect(`/admin/login?lang=${locale}` as never);
  }

  const t = getDictionary(locale);
  const config = await getPlatformConfig();
  const metrics = await getAdminMetrics();
  const reassignmentRequests = await listReassignmentRequests();
  const admins = await listAdmins();
  const auditLogs = await listAuditLogs();
  const supportTickets = await listSupportTickets();
  const isCommunityView = params.role === "community";
  const scopedCommunityCode = params.community ?? "ABIN";
  const scopedCommunity = config.communities.find((community) => community.code === scopedCommunityCode) ?? config.communities[0];
  const visibleTickets = isCommunityView ? supportTickets.filter((ticket) => ticket.communityCode === scopedCommunity?.code) : supportTickets;
  const printRequests = await listPhysicalCardPrintRequests(isCommunityView ? scopedCommunity?.code : undefined);
  const pendingReassignments = reassignmentRequests.filter((request) => request.status === "pending");
  const urgentSupport = visibleTickets.filter((ticket) => ticket.priority === "urgent" && ticket.status !== "closed");
  const operationalAlerts = [
    { label: t.admin.pendingPayments, value: metrics.pendingPayments, tone: "gold" },
    { label: t.admin.pendingReassignments, value: pendingReassignments.length, tone: "green" },
    { label: t.admin.failedCards, value: metrics.failedCardGeneration, tone: "red" },
    { label: t.admin.failedEmail, value: metrics.failedEmailDelivery, tone: "red" },
    { label: t.admin.supportTickets, value: urgentSupport.length, tone: "gold" },
    { label: t.admin.printQueue, value: printRequests.filter((request) => request.printStatus !== "printed" && request.printStatus !== "canceled").length, tone: "green" }
  ];
  const communityRows = config.communities.slice(0, 6).map((community) => ({
    ...community,
    members: metrics.membersByCommunity[community.code] ?? 0,
    support: supportTickets.filter((ticket) => ticket.communityCode === community.code && ticket.status !== "closed").length
  }));
  const dashboardTitle = isCommunityView
    ? locale === "fr"
      ? `Operations locales ${scopedCommunity?.code ?? ""}`
      : `${scopedCommunity?.code ?? ""} local operations`
    : t.admin.title;
  const dashboardSubtitle = isCommunityView
    ? locale === "fr"
      ? "Vue locale pour les membres, paiements, renouvellements, support et approbations de la communaute."
      : "Local view for community members, payments, renewals, support, and approvals."
    : t.admin.subtitle;

  return (
    <main className="min-h-screen bg-hub-mist px-4 py-6 sm:px-5 md:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-lg bg-hub-ink p-5 text-white shadow-soft md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-hub-gold">
                {isCommunityView ? t.config.communities : t.admin.kicker}
              </p>
              <h1 className="mt-2 text-3xl font-bold leading-tight md:text-4xl">{dashboardTitle}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/74">{dashboardSubtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <LanguageSwitcher locale={locale} label={t.common.language} />
              <Link className="rounded-md bg-white px-4 py-3 text-sm font-bold text-hub-ink" href={`/admin/config?lang=${locale}`}>
                {t.common.configuration}
              </Link>
              <a className="rounded-md border border-white/25 px-4 py-3 text-sm font-bold text-white" href="/api/admin/export/members">
                {t.common.exportCsv}
              </a>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {operationalAlerts.map((item) => (
              <AlertCard key={item.label} {...item} />
            ))}
          </div>
        </div>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label={t.admin.total} value={isCommunityView ? metrics.membersByCommunity[scopedCommunity?.code ?? ""] ?? 0 : metrics.totalMembers} helper={locale === "fr" ? "Dossiers membres" : "Member records"} />
            <Metric label={t.admin.active} value={metrics.activeMembers} helper={locale === "fr" ? "Adhesions valides" : "Valid memberships"} />
            <Metric label={t.admin.expiringSoon} value={metrics.expiringSoon} helper={locale === "fr" ? "A relancer" : "Needs renewal follow-up"} />
            <Metric label={t.admin.supportTickets} value={visibleTickets.length} helper={locale === "fr" ? "Demandes ouvertes" : "Open requests"} />
          </div>

          <section className="rounded-lg bg-white p-5 shadow-soft">
            <SectionHeader title={locale === "fr" ? "Actions rapides" : "Quick actions"} eyebrow={locale === "fr" ? "Operations" : "Operations"} />
            <div className="mt-4 grid gap-2">
              <QuickAction href={`/admin/config?lang=${locale}`} label={locale === "fr" ? "Modifier la configuration" : "Edit configuration"} />
              <QuickAction href="/api/admin/export/members" label={locale === "fr" ? "Exporter les membres" : "Export members"} />
              <QuickAction href={`/admin?lang=${locale}&role=community&community=ABIN`} label={locale === "fr" ? "Voir mode admin ABIN" : "View ABIN admin mode"} />
            </div>
          </section>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <Panel title={isCommunityView ? t.admin.supportQueue : locale === "fr" ? "Priorites operationnelles" : "Operational priorities"} eyebrow={locale === "fr" ? "A traiter" : "Needs action"}>
            <div className="grid gap-3">
              <PriorityItem label={t.admin.pendingPayments} value={metrics.pendingPayments} detail={locale === "fr" ? "Verifier les paiements et relances." : "Review payments and recovery links."} />
              <PriorityItem label={t.admin.pendingReassignments} value={pendingReassignments.length} detail={locale === "fr" ? "Approuver ou rejeter les changements de communaute." : "Approve or reject community moves."} />
              <PriorityItem label={t.admin.supportTickets} value={visibleTickets.length} detail={locale === "fr" ? "Repondre aux demandes assignees." : "Respond to assigned requests."} />
            </div>
          </Panel>

          <Panel title={locale === "fr" ? "Sante plateforme" : "Platform health"} eyebrow={locale === "fr" ? "Surveillance" : "Monitoring"}>
            <div className="grid gap-3">
              <HealthRow label={t.admin.failedCards} value={metrics.failedCardGeneration} />
              <HealthRow label={t.admin.failedEmail} value={metrics.failedEmailDelivery} />
              <HealthRow label={t.admin.duplicateRecords} value={0} />
              <HealthRow label={t.admin.failedPayments} value={0} />
            </div>
          </Panel>
        </section>

        <section className="mt-6 rounded-lg bg-white p-5 shadow-soft">
          <SectionHeader title={isCommunityView ? locale === "fr" ? "Organisation locale" : "Local organization" : locale === "fr" ? "Communautes" : "Communities"} eyebrow={locale === "fr" ? "Sante communautaire" : "Community health"} />
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {communityRows.length ? (
              communityRows.map((community) => (
                <CommunityCard key={community.code} community={community} locale={locale} />
              ))
            ) : (
              <EmptyState title={locale === "fr" ? "Aucune communaute configuree" : "No communities configured"} body={locale === "fr" ? "Ajoutez une communaute dans Configuration pour commencer le suivi local." : "Add a community in Configuration to start local tracking."} />
            )}
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <Panel title={t.admin.memberDistribution} eyebrow={locale === "fr" ? "Analyse" : "Analytics"}>
            <div className="grid gap-4 sm:grid-cols-3">
              <Breakdown title={t.admin.byRegion} data={metrics.membersByState} emptyTitle={locale === "fr" ? "Aucune region active" : "No active regions"} />
              <Breakdown title={t.admin.byZone} data={metrics.membersByZone} emptyTitle={locale === "fr" ? "Aucune zone active" : "No active zones"} />
              <Breakdown title={t.admin.byCommunity} data={metrics.membersByCommunity} emptyTitle={locale === "fr" ? "Aucune communaute active" : "No active communities"} />
            </div>
          </Panel>

          <Panel title={t.admin.auditActivity} eyebrow={locale === "fr" ? "Journal" : "Timeline"}>
            <Timeline entries={auditLogs.slice(0, 6)} locale={locale} />
          </Panel>
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-3">
          <Panel title={t.admin.reassignments} eyebrow={locale === "fr" ? "Approbations" : "Approvals"}>
            <div className="grid gap-3">
              {pendingReassignments.length ? (
                pendingReassignments.map((request) => (
                  <div key={request.id} className="rounded-md border border-slate-200 p-4 text-sm">
                    <p className="font-bold text-hub-ink">{request.memberId}</p>
                    <p className="mt-1 text-slate-600">
                      {request.previousState}/{request.previousCommunityCode} to {request.requestedState}/{request.requestedCommunityCode}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState title={locale === "fr" ? "Aucune approbation en attente" : "No pending approvals"} body={locale === "fr" ? "Les demandes de reassignment apparaitront ici avec les actions admin." : "Reassignment requests will appear here with admin actions."} />
              )}
            </div>
          </Panel>

          <Panel title={t.admin.printQueue} eyebrow={locale === "fr" ? "Cartes physiques" : "Physical cards"}>
            <div className="grid gap-3">
              {printRequests.length ? (
                printRequests.slice(0, 6).map((request) => (
                  <div key={request.id} className="flex items-center justify-between gap-4 rounded-md border border-slate-200 p-4 text-sm">
                    <div>
                      <p className="font-bold text-hub-ink">{request.memberId}</p>
                      <p className="text-slate-600">{request.communityCode} / {request.optionName} / v{request.cardVersion}</p>
                    </div>
                    <span className="rounded-md bg-hub-mist px-2 py-1 text-xs font-bold text-hub-green">{request.printStatus}</span>
                  </div>
                ))
              ) : (
                <EmptyState title={locale === "fr" ? "Aucune carte physique a imprimer" : "No physical cards to print"} body={locale === "fr" ? "Les cartes physiques payees apparaitront ici avec statut impression, livraison ou retrait." : "Paid physical card requests will appear here with print, shipping, and pickup status."} />
              )}
            </div>
          </Panel>

          <Panel title={t.admin.supportQueue} eyebrow={locale === "fr" ? "Assistance" : "Support"}>
            <div className="grid gap-3">
              {visibleTickets.length ? (
                visibleTickets.slice(0, 6).map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between gap-4 rounded-md border border-slate-200 p-4 text-sm">
                    <div>
                      <p className="font-bold text-hub-ink">{ticket.issueCategory} / {ticket.priority}</p>
                      <p className="text-slate-600">{ticket.communityCode} - {ticket.status}</p>
                    </div>
                    <span className="rounded-md bg-hub-mist px-2 py-1 text-xs font-bold text-hub-green">{ticket.priority}</span>
                  </div>
                ))
              ) : (
                <EmptyState title={locale === "fr" ? "Aucun ticket ouvert" : "No open support tickets"} body={locale === "fr" ? "Les demandes membres seront routees ici selon pays, region, zone et communaute." : "Member requests will route here by country, region, zone, and community."} />
              )}
            </div>
          </Panel>
        </section>
      </section>
    </main>
  );
}

function AlertCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  const colors = tone === "red" ? "border-hub-red/25 bg-hub-red/10 text-hub-red" : tone === "gold" ? "border-hub-gold/40 bg-hub-gold/15 text-yellow-800" : "border-hub-green/20 bg-hub-green/10 text-hub-green";
  return (
    <div className={`rounded-md border p-4 ${colors}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide">{label}</p>
    </div>
  );
}

function Metric({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <div className="rounded-lg bg-white p-5 shadow-soft">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-hub-ink">{value}</p>
      <p className="mt-2 text-xs font-semibold text-slate-500">{helper}</p>
    </div>
  );
}

function Panel({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg bg-white p-5 shadow-soft">
      <SectionHeader title={title} eyebrow={eyebrow} />
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SectionHeader({ title, eyebrow }: { title: string; eyebrow: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-hub-green">{eyebrow}</p>
      <h2 className="mt-1 text-lg font-bold text-hub-ink">{title}</h2>
    </div>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <a className="flex min-h-11 items-center justify-between rounded-md border border-slate-200 px-3 text-sm font-bold text-hub-ink transition hover:border-hub-green hover:text-hub-green" href={href}>
      <span>{label}</span>
      <span aria-hidden="true">-&gt;</span>
    </a>
  );
}

function PriorityItem({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="grid gap-3 rounded-md border border-slate-200 p-4 sm:grid-cols-[72px_1fr]">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-hub-green text-xl font-bold text-white">{value}</span>
      <div>
        <p className="font-bold text-hub-ink">{label}</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p>
      </div>
    </div>
  );
}

function HealthRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-slate-200 p-4 text-sm">
      <span className="font-bold text-slate-700">{label}</span>
      <span className={`rounded-md px-2 py-1 text-xs font-bold ${value ? "bg-hub-red/10 text-hub-red" : "bg-hub-green/10 text-hub-green"}`}>{value ? "Review" : "OK"}</span>
    </div>
  );
}

function CommunityCard({
  community,
  locale
}: {
  community: { officialName: string; code: string; countryCode: string; regionCode: string; members: number; support: number; logoDataUrl?: string; active: boolean };
  locale: "fr" | "en";
}) {
  return (
    <article className="rounded-md border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-md bg-hub-mist font-bold text-hub-green">
            {community.logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="h-10 w-10 object-contain" src={community.logoDataUrl} alt="" />
            ) : (
              community.code.slice(0, 2)
            )}
          </div>
          <div>
            <h3 className="font-bold leading-5 text-hub-ink">{community.officialName}</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">{community.countryCode} / {community.regionCode}</p>
          </div>
        </div>
        <span className={`rounded-md px-2 py-1 text-xs font-bold ${community.active ? "bg-hub-green/10 text-hub-green" : "bg-slate-100 text-slate-500"}`}>
          {community.active ? "Active" : "Inactive"}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <MiniStat label={locale === "fr" ? "Membres" : "Members"} value={community.members} />
        <MiniStat label={locale === "fr" ? "Renouv." : "Renewals"} value={0} />
        <MiniStat label="Support" value={community.support} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link className="rounded-md border border-hub-green px-3 py-2 text-xs font-bold text-hub-green" href={`/admin/config?lang=${locale}`}>
          {locale === "fr" ? "Parametres" : "Settings"}
        </Link>
        <a className="rounded-md bg-hub-green px-3 py-2 text-xs font-bold text-white" href="/api/admin/export/members">
          Export
        </a>
      </div>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-hub-mist p-3">
      <p className="text-lg font-bold text-hub-ink">{value}</p>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function Breakdown({ title, data, emptyTitle }: { title: string; data: Record<string, number>; emptyTitle: string }) {
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, value]) => value), 1);

  return (
    <div className="rounded-md border border-slate-200 p-4">
      <h3 className="font-bold text-hub-ink">{title}</h3>
      <div className="mt-3 grid gap-3">
        {entries.length ? entries.map(([key, value]) => (
          <div key={key} className="grid gap-1 text-sm">
            <div className="flex justify-between gap-3">
              <span className="font-semibold text-slate-600">{key}</span>
              <span className="font-bold text-hub-ink">{value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-hub-mist">
              <div className="h-full rounded-full bg-hub-green" style={{ width: `${Math.max(8, (value / max) * 100)}%` }} />
            </div>
          </div>
        )) : <EmptyState title={emptyTitle} body="Configure and activate records to populate this chart." compact />}
      </div>
    </div>
  );
}

function Timeline({ entries, locale }: { entries: Array<{ id: string; action: string; adminRole: string; affectedRecordType: string; affectedRecordId: string; timestamp: string }>; locale: "fr" | "en" }) {
  if (!entries.length) {
    return <EmptyState title={locale === "fr" ? "Aucune activite audit" : "No audit activity"} body={locale === "fr" ? "Les actions admin importantes apparaitront ici avec horodatage." : "Important admin actions will appear here with timestamps."} />;
  }

  return (
    <ol className="relative grid gap-4 border-l border-slate-200 pl-5">
      {entries.map((entry) => (
        <li key={entry.id} className="relative">
          <span className="absolute -left-[29px] top-1 grid h-4 w-4 place-items-center rounded-full bg-hub-green" />
          <p className="font-bold text-hub-ink">{humanize(entry.action)}</p>
          <p className="mt-1 text-sm text-slate-600">{entry.adminRole} / {entry.affectedRecordType} / {entry.affectedRecordId}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{new Date(entry.timestamp).toLocaleString(locale === "fr" ? "fr-FR" : "en-US")}</p>
        </li>
      ))}
    </ol>
  );
}

function EmptyState({ title, body, compact = false }: { title: string; body: string; compact?: boolean }) {
  return (
    <div className={`rounded-md border border-dashed border-slate-300 bg-hub-mist/60 ${compact ? "p-3" : "p-5"}`}>
      <p className="font-bold text-hub-ink">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

function humanize(value: string) {
  return value.replaceAll("_", " ");
}
