import { notFound } from "next/navigation";
import { isProductionLike } from "@/lib/security/lockdown";
import { calculateMembershipTerm } from "@/lib/membership/dates";
import { signCardAccessToken } from "@/lib/security/card-access";
import { generateCardMetadata } from "@/services/card-service";
import { activateMember, findMemberByPublicId } from "@/services/member-service";

export default async function DevPaymentSuccessPage({ searchParams }: { searchParams: { memberId?: string } }) {
  if (isProductionLike()) {
    notFound();
  }

  const memberId = searchParams.memberId;
  const member = memberId ? await findMemberByPublicId(memberId) : null;

  if (!member) {
    return (
      <main className="min-h-screen bg-hub-mist px-5 py-8">
        <section className="mx-auto max-w-xl rounded-lg bg-white p-6 shadow-soft">
          <h1 className="text-2xl font-bold text-hub-ink">Member record not found</h1>
        </section>
      </main>
    );
  }

  const term = calculateMembershipTerm(new Date(), member.durationYears);
  const activeMember = await activateMember(member.memberId, term);

  const card = await generateCardMetadata(activeMember ?? member);
  const cardMemberId = activeMember?.memberId ?? member.memberId;
  const cardToken = signCardAccessToken(cardMemberId);

  return (
    <main className="min-h-screen bg-hub-mist px-5 py-8">
      <section className="mx-auto max-w-xl rounded-lg bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-hub-green">Development payment</p>
        <h1 className="mt-2 text-3xl font-bold text-hub-ink">Membership activated</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This local-only page simulates the post-webhook state when Stripe credentials are not configured.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="mt-6 h-40 w-40 rounded-md border border-slate-200 p-2" src={card.qrCodeDataUrl} alt="Membership QR code" />
        <a className="mt-6 inline-flex rounded-md bg-hub-green px-5 py-3 font-bold text-white" href={`/card/${cardMemberId}?token=${cardToken}`}>
          View digital card
        </a>
        <a className="ml-3 mt-6 inline-flex rounded-md border border-hub-green px-5 py-3 font-bold text-hub-green" href={card.verificationUrl}>
          Open verification page
        </a>
      </section>
    </main>
  );
}
