import Link from "next/link";
import { signCardAccessToken } from "@/lib/security/card-access";
import { findMemberByPublicId } from "@/services/member-service";
import { isCheckoutSessionPaidForMember } from "@/services/payment-service";

export default async function PaymentSuccessPage({
  searchParams
}: {
  searchParams: Promise<{ memberId?: string; lang?: string; session_id?: string }>;
}) {
  const params = await searchParams;
  const locale = params.lang === "en" ? "en" : "fr";
  const member = params.memberId ? await findMemberByPublicId(params.memberId) : null;

  // The success page confirms only whether it may issue a short-lived card link.
  // Membership state changes remain webhook-only so browser navigation can never
  // become an activation authority.
  const paymentVerified =
    member && params.session_id ? await isCheckoutSessionPaidForMember(params.session_id, member.memberId) : false;

  // Grant card access only when this paid Stripe session belongs to this member.
  // Longer-term access goes through the passwordless member portal.
  const cardToken = member && paymentVerified && member.status === "active" ? signCardAccessToken(member.memberId) : null;
  const portalHref = member
    ? `/portal?lang=${locale}&email=${encodeURIComponent(member.email)}&next=${encodeURIComponent(`/card/${member.memberId}?lang=${locale}`)}`
    : `/portal?lang=${locale}`;

  return (
    <main className="min-h-screen bg-hub-mist px-5 py-8">
      <section className="mx-auto max-w-xl rounded-lg bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-hub-green">
          {locale === "fr" ? "Paiement recu" : "Payment received"}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-hub-ink">
          {cardToken
            ? locale === "fr"
              ? "Adhesion activee"
              : "Membership activated"
            : locale === "fr"
              ? "Activation en cours"
              : "Activation in progress"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {cardToken
            ? locale === "fr"
              ? "Votre paiement a ete confirme et votre carte membre est prete."
              : "Your payment has been confirmed and your membership card is ready."
            : locale === "fr"
              ? "Stripe confirme le paiement par webhook securise. Cela peut prendre quelques instants. Actualisez cette page si la carte n'apparait pas encore."
              : "Stripe confirms payment through a secure webhook. This can take a few moments. Refresh this page if the card is not ready yet."}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {cardToken ? (
            <Link
              className="rounded-md bg-hub-green px-5 py-3 font-bold text-white"
              href={`/card/${member!.memberId}?lang=${locale}&token=${cardToken}`}
            >
              {locale === "fr" ? "Voir ma carte" : "View my card"}
            </Link>
          ) : (
            <Link className="rounded-md bg-hub-green px-5 py-3 font-bold text-white" href={portalHref as never}>
              {locale === "fr" ? "Ouvrir le portail" : "Open portal"}
            </Link>
          )}
          {cardToken ? (
            <Link className="rounded-md border border-hub-green px-5 py-3 font-bold text-hub-green" href={portalHref as never}>
              {locale === "fr" ? "Portail membre" : "Member portal"}
            </Link>
          ) : null}
          <Link className="rounded-md border border-slate-300 px-5 py-3 font-bold text-hub-ink" href={`/?lang=${locale}`}>
            {locale === "fr" ? "Retour accueil" : "Return home"}
          </Link>
        </div>
      </section>
    </main>
  );
}
