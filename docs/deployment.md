# Deployment Checklist

## Safe showcase deployment

The public portfolio deployment must be synthetic and read-only:

```text
SHOWCASE_MODE=true
DATA_BACKEND=memory
```

Do not configure Supabase, Stripe, email, or administrator secrets for the
portfolio demo. The application disables public writes and labels the UI as a
showcase. Verify `/api/registrations` returns `503` after deployment.

Use Node.js 24 and `npm ci`. Both `vercel.json` and `netlify.toml` are included
for portability; neither file contains a provider project identifier.

## Provider-backed staging

A real staging environment is a separate security project and must never reuse
portfolio data or credentials. Configure values directly in the hosting
provider's encrypted environment store:

- public HTTPS application URL and `DEPLOYMENT_ENV=staging`;
- `DATA_BACKEND=supabase`;
- separate Supabase URL, anon key, service-role key, JWT secret, and private buckets;
- dedicated 32+ character `CARD_ACCESS_SECRET` unrelated to other secrets;
- Stripe secret/publishable keys and a route-specific webhook secret;
- transactional email key and verified sender;
- explicit admin and super-admin allowlists.

Apply migrations in order and test RLS with anon, authenticated, and service
roles. Confirm that member photos and cards have no direct client read policy.

## Release gates

```bash
npm ci
npm run verify
npm run build
npm run test:e2e
npm run test:safety
npm run test:safety:history
```

Before any provider-backed launch, additionally verify:

1. Stripe test-mode success, duplicate, invalid-signature, amount mismatch,
   currency mismatch, and retry behavior.
2. Member ownership and every admin scope with AAL1/AAL2 sessions.
3. Private storage access and signed URL expiration.
4. Durable distributed rate limiting, backup/restore, retention, alerting, and rollback.
5. Privacy notices, consent, deletion/retention policy, and applicable payment obligations.

The showcase repository does not authorize or certify a production launch.
