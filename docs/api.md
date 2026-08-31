# API Documentation

Example API base:

```text
https://your-domain.example/api
```

<details>
<summary>i Details</summary>

This app uses Next.js route handlers as the backend. Public showcase writes are
disabled. Some endpoints are browser-readable, such as `/api/health`; others
are authenticated, POST-only, or webhook-only.

</details>

## `GET /api/health`

Reports deployment readiness.

Healthy staging response:

```json
{
  "ok": true,
  "deploymentEnv": "staging",
  "dataBackend": "supabase",
  "supabaseConfigured": true,
  "missing": []
}
```

## `POST /api/registrations`

Creates a pending member and redirects to Stripe Checkout.

Form fields:

- `firstName`
- `lastName`
- `email`
- `phone`
- `state`
- `communityCode`
- `tier`
- `durationYears`
- `preferredLanguage`
- `profilePhoto` later stored through object storage
- `consentAccepted`
- `privacyAccepted`

Photo rules:

- Required.
- JPG/PNG only.
- Original browser-selected photo maximum: 5 MB.
- Stored/uploaded photo maximum after browser optimization: 1.5 MB.
- Stored privately for card generation.
- Optional physical card choice:
  - `physicalCardChoice`: `digital_only`, `pickup`, or `mail`.
  - `physicalCardOptionId`: required when pickup/mail is selected.
  - mailing address fields are required only for `mail`.
- Not returned by public verification.

Response:

- `303` redirect to Stripe Checkout or local development success page.
- `422` for validation errors.

Payment handoff:

1. The server creates the pending member before payment.
2. The server creates a Stripe Checkout Session with `client_reference_id = memberId`.
3. Stripe redirects the member to `/payment/success` after checkout.
4. `/payment/success` is only a processing/status page; it does not activate membership by itself.
5. Only `POST /api/payments/stripe/webhook` can activate the member, store membership dates, generate card metadata, and send the card email.
6. If a paid physical card option was selected, the webhook creates a physical card print queue record.

<details>
<summary>i Details</summary>

Do not redirect directly from Checkout success to `/card/[memberId]`. Stripe success redirects can happen before the webhook has finished. The success page must tolerate a pending member and ask the user to refresh while secure webhook processing completes.

After activation, the success page should route the member through `/portal` with a passwordless magic-link login. Full card pages are private and require the authenticated member email or a scoped admin.

</details>

## `POST /api/payments/stripe/webhook`

Trusted payment confirmation endpoint.

Production requirements:

- Verify `stripe-signature` using `stripe.webhooks.constructEvent`.
- Reject duplicate event IDs.
- Persist payment record.
- Activate or renew member.
- Generate card metadata.
- Send the configured card notification.

Current accepted event:

- `checkout.session.completed`

## `GET /api/verify/[verificationToken]`

Returns public-safe verification payload.

Fields:

- `name`
- `community`
- `status`
- `expirationDate`

The token is an opaque UUID distinct from the human-readable member ID. The
name is reduced to first name plus last initial.

Private data intentionally excluded:

- email
- phone
- payment details
- admin notes
- reassignment history
- member photo

## `GET /api/config`

Returns active platform configuration for public UI rendering.

Sections:

- `countries`
- `regions`
- `zones`
- `membershipTiers`
- `communities`
- `card`
- `communityCardTemplates`
- `physicalCards`
- `registrationFields`
- `branding`
- `notifications`
- `publicContent`

## `GET /api/admin/config`

Returns full editable platform configuration to an AAL2 super-admin session.

## `POST /api/admin/config`

Updates one configuration section.

Body:

- `section`
- `value`

## `GET /api/cards/[memberId]`

Returns generated card SVG for an active member. The `/card/[memberId]` page renders the card and provides PNG download.
Cards include the latest recorded version number when provider storage is configured.

## `POST /api/reassignments`

Creates a reassignment request for the authenticated member owner or a scoped admin.

Body:

- `memberId`
- `requestedState`
- `requestedCommunityCode`
- `reason`

## `POST /api/admin/reassignments/[requestId]`

Approves or rejects a reassignment request. Approval updates current member state/zone/community and stores immutable history.

## `GET /api/admin/users`

Lists admin users for an AAL2 super-admin session only.

## `POST /api/admin/users`

Creates an admin role assignment with role and scope.

## `GET /api/admin/audit`

Lists audit log entries. Super admins see all logs; scoped admins should see only logs in their scope once persistence/RBAC middleware is connected.

## `POST /api/support`

Creates a support ticket and assigns the right admin based on community.

## `POST /api/account-closure`

Creates an account closure or data deletion request. Admin must verify identity before processing.

## `POST /api/admin/payments/manual`

Records a manual payment for cash, Zelle, check, or event payment. Requires admin audit logging.

## `POST /api/admin/payments/[paymentId]/refund`

Marks payment as `refunded` or `canceled` with notes and audit log.

## `POST /api/admin/impersonation`

Starts an admin impersonation session. This must never be silent; every session requires reason and audit log.

## `GET /api/admin/export/members`

Exports only members within the caller's admin scope, neutralizes spreadsheet
formulas, and records the export in the audit log.
