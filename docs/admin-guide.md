# Admin Guide

## Member Operations

Admins should be able to:

- Search members.
- Filter by status, state, zone, community, tier, and expiration.
- Manually update member status.
- Resend card email.
- Deactivate or reactivate a member.
- Export CSV.

## Configuration Management

Admins can manage configuration from `/admin/config`.

Editable sections:

- Countries: name, flag, languages, currency, active status.
- Regions/states/provinces: name, country, flag, active status.
- Zones: name, country, region membership, badge color, active status.
- Membership tiers: name, price, duration, description, benefits, renewal rules, active status.
- Communities: official name, code, country, region, zone, logo, banner, description, contact email, support email, social links, admin user, active status.
- Card settings: template, accent colors, logo selection, displayed fields.
- Card templates: controlled community card designer with draft, pending approval, approved, and archived statuses.
- Physical cards: optional add-on options, pickup/mail availability, material/quality choices, shipping price, and delivery instructions.
- Registration fields: required, optional, or hidden.
- Branding: platform name, logo, colors, footer text, support email.
- Notifications: renewal reminder days and email copy.
- Public content: homepage text, about, FAQ, instructions, payment help, support contact.

Business settings should flow through the config API, not direct frontend constants.

## Community Card Designer

Community admins configure card appearance through controlled fields, not freeform design tools. The current controls cover logo selection, primary/accent colors, background style, front/back layout selection, signature area, contact info, and a live preview.

Template statuses:

- `draft`: local edits are saved but not used for member cards.
- `pending_approval`: ready for super admin review.
- `approved`: eligible for generated member cards.
- `archived`: retained for history but not used.

Generated member cards use an approved community template when available. If no local template is approved, the platform uses the first approved fallback template so members do not receive unapproved draft designs.

## Physical Card Add-On

Admins can enable a simple member-facing physical card choice:

- Digital card only.
- Pickup from community.
- Mail it to me.

Admins define the available physical card options, material/quality, extra price, active status, pickup/mail availability, shipping price, and delivery instructions. Mailing address fields appear only when the member selects mail delivery. Addresses are stored for fulfillment and must not be shown on public verification pages.

After Stripe webhook confirmation, paid physical card selections create print queue records. Community admins see their own queue; super admins see all queues.

## Admin Roles

Super admins can manage all countries, regions, zones, communities, admins, members, payments, platform settings, branding, notifications, and audit logs.

Community admins can manage only their scoped association: local logo, banner, contact details, local description, local members, reassignment requests, local reports, local payment analytics, local announcements, and assigned support tickets.

Community admins must not access other communities, modify global platform settings, manage super admins, or view restricted global data.

## Audit Logging

All admin actions should write audit logs with admin ID, admin role, action, affected record, timestamp, previous value, and new value.

Logged examples include logo uploads, community edits, reassignment approvals, member suspension, payment overrides, admin creation/deletion, card regeneration, and notification changes.

Admin impersonation must never be silent. Any admin acting as a member requires a stated reason and audit log entry.

## Payments

Admins can:

- Record manual payments for cash, Zelle, check, or event collection.
- Add notes to manual payments.
- Mark memberships/payments as refunded or canceled.
- Review failed payments and send retry links.

All manual payments, refunds, cancellations, and overrides must be audit logged.

## Data Requests

Members can request account closure or data deletion. Admins must verify identity before processing and preserve payment/audit records when required.

## Backup And Export

Admins can export member CSV data within their assigned scope. Exports are
formula-neutralized and audit-logged. Provider-backed environments must also
enable and test automated backups.

## Support Tickets

Member support requests route to the community admin first. If no local admin exists, the ticket can route to super admin and later escalate to zone or country admins.

Admins can view assigned tickets, reply by email once email integration is connected, mark resolved, or escalate.

## Reassignment Workflow

1. Member requests reassignment from portal.
2. Admin reviews old and requested state/community.
3. System recalculates zone from centralized config.
4. Admin approves or rejects request.
5. Approved reassignment updates the active member record.
6. Reassignment history is inserted.
7. Card is regenerated using the new state/community settings.
8. Member receives email confirmation.

Do not overwrite payment history or old reassignment records.

## Monitoring

Dashboard should surface:

- Failed card generation.
- Failed email delivery.
- Duplicate records.
- Failed payments.
- Pending reassignment requests.
- Expiring memberships.
