# Security policy

## Reporting a vulnerability

Please do not open a public issue for a suspected vulnerability.

Use the repository's **Security** tab to submit a private vulnerability report. If private reporting is unavailable, contact the repository owner privately through their GitHub profile. Include the affected route or component, reproduction steps, impact, and any suggested mitigation. Do not include real credentials or sensitive calendar data in the report.

## Production checklist

- Keep `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD_HASH`, and `SESSION_SECRET` only in Vercel's encrypted environment settings.
- Keep Supabase Row Level Security enabled and review policies after every schema change.
- Use a unique admin password of at least 12 characters and a randomly generated session secret of at least 32 characters.
- Enable GitHub secret scanning, push protection, Dependabot alerts, and private vulnerability reporting after making the repository public.
- Add rate limiting for `/api/login` in the Vercel Firewall or another durable edge layer. In-memory limits are not reliable across serverless instances.
- Review calendar entries for private locations, travel plans, or other sensitive information before publishing.
- Rotate all server-only secrets immediately if one is exposed, and purge it from Git history before relying on the rotation.
- Keep the protected branch's required CI checks enabled and dependencies updated.

## Supported versions

Security fixes are applied to the latest version on the default branch.
