import { NextResponse } from "next/server";
import { createPendingMember } from "@/services/member-service";
import { createStripeCheckoutSession } from "@/services/payment-service";
import { validateAndStoreMemberPhoto } from "@/services/photo-service";
import { assertRateLimit, isRateLimitError } from "@/services/abuse-protection-service";
import { registrationSchema } from "@/lib/validation/registration";
import { getPlatformConfig } from "@/services/config-service";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  if (env.showcaseMode) {
    return NextResponse.json({ error: "Submissions are disabled in portfolio demo mode." }, { status: 503 });
  }

  try {
    assertRateLimit(`registration:${request.headers.get("x-forwarded-for") ?? "local"}`, 10, 60_000);
  } catch (error) {
    if (isRateLimitError(error)) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429, headers: { "retry-after": String(error.retryAfterSeconds) } }
      );
    }
    throw error;
  }
  const config = await getPlatformConfig();
  const formData = await request.formData();
  const payload = Object.fromEntries(formData.entries());
  const parsed = registrationSchema.safeParse(payload);
  const photo = formData.get("profilePhoto");
  const visibility = (field: string) =>
    config.registrationFields.find((setting) => setting.field === field)?.visibility ?? "required";

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid registration data.", issues: parsed.error.flatten() }, { status: 422 });
  }

  if (visibility("phone") === "required" && !parsed.data.phone) {
    return NextResponse.json({ error: "Phone number is required." }, { status: 422 });
  }

  if ((!(photo instanceof File) || photo.size === 0) && visibility("photo") === "required") {
    return NextResponse.json({ error: "Member photo is required." }, { status: 422 });
  }

  let member;
  let checkout;

  try {
    const profilePhotoDataUrl = photo instanceof File && photo.size > 0 ? await validateAndStoreMemberPhoto(photo) : undefined;
    member = await createPendingMember(parsed.data, profilePhotoDataUrl);
    checkout = await createStripeCheckoutSession(member);
  } catch {
    return NextResponse.json({ error: "Registration could not be completed." }, { status: 422 });
  }

  return NextResponse.redirect(new URL(checkout.checkoutUrl, request.url), 303);
}
