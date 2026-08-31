# Operations Runbook

## Portfolio showcase

The public environment is intentionally read-only. Healthy behavior:

- `/` returns `200` and displays the synthetic demo banner;
- `/api/health` returns a non-sensitive health response;
- public write endpoints return `503`;
- invalid verification tokens return a minimal `404` response;
- CSP, HSTS, frame, content-type, referrer, and permissions headers are present;
- browser smoke tests report no console or page errors.

If a public write succeeds or real provider configuration appears, disable the
deployment and rotate any affected credentials before investigating.

## Provider-backed incident priorities

1. Protect people and payment state: pause registrations/webhooks if integrity is uncertain.
2. Preserve evidence without logging personal data or credentials.
3. Rotate the narrowest affected secret and revoke active sessions if required.
4. Reconcile Stripe events against idempotent payment records before reprocessing.
5. Restore from a tested backup only after the cause and migration state are known.
6. Document scope, timeline, impact, remediation, and follow-up controls privately.

## Monitoring signals

- elevated authentication, authorization, validation, or rate-limit failures;
- webhook signature/amount mismatches and repeated provider events;
- failed membership activation, card generation, storage, or notification jobs;
- unusual admin exports, impersonation, payment reconciliation, or role changes;
- RLS denials and private-bucket access anomalies;
- dependency, CodeQL, secret-scanning, or CI regressions.

## Safe rollback

Application rollback and database rollback are separate decisions. Revert the
application to a verified release through the hosting provider. Do not reverse
a migration until compatibility and data-preservation consequences are reviewed.
Never copy production data into the portfolio showcase for debugging.
