# Testing Strategy

## Automated gates

- Domain tests cover geographic mapping, member-ID generation, membership
  dates, configuration hierarchy, card grants, image signatures, and rate limits.
- Static security assertions lock in authentication, MFA, webhook, storage,
  error, upload, verification, export, and security-header boundaries.
- Playwright runs desktop and mobile checks for read-only showcase behavior,
  responsive layout, headers, invalid verification, route rendering, and clean consoles.
- Repository safety scans current tracked files and reachable history for
  protected background terms, non-synthetic contacts, risky paths, and credential shapes.
- CI runs lint, tests, type checking, production build, dependency audit,
  CodeQL, and dependency review.

## Commands

```bash
npm run lint
npm test
npm run test:security
npm run typecheck
npm run build
npm audit --audit-level=high
npm run test:e2e
npm run test:safety
npm run test:safety:history
```

## Provider staging tests

The public showcase does not contain provider credentials. A separate staging
project must test Stripe signatures/retries/mismatches, Supabase RLS and private
storage, magic-link sessions, AAL2 admin access, email delivery, backup/restore,
distributed abuse controls, and failure recovery before real use.
