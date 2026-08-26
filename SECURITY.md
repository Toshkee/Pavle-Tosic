# Security policy

## Reporting a vulnerability

Please report suspected vulnerabilities privately to `tosiicsftw@gmail.com`.
Include the affected URL, impact, and the smallest safe reproduction you can.
Do not include secrets or personal data in the report.

Please avoid denial-of-service testing, automated high-volume scanning,
accessing other people's data, or changing production data. Good-faith reports
will be acknowledged as quickly as practical.

## Required production controls

The repository enforces application-level headers, request limits, origin
checks, dependency auditing, and regression checks. The following Cloudflare
zone controls live outside the repository and must also remain enabled:

- Minimum TLS version: TLS 1.2; TLS 1.3 enabled.
- Always Use HTTPS enabled; HSTS kept at two years with subdomains and preload.
- Cloudflare managed WAF rules and bot protection enabled.
- A rate-limiting rule for `POST /api/ask`, keyed by the verified client IP.
  Start at 10 requests per minute with a 60-second block and tune from logs.
- Cache bypass for `/api/*`; never cache assistant requests or responses.
- `GEMINI_API_KEY` stored only as a Worker secret and rotated after any suspected
  disclosure. Never store it as a plaintext Wrangler variable.
- Disable the public `workers.dev` route if the custom domain is the only
  intended entry point.
- Do not log request bodies on `/api/ask`.

After changing any of these controls, run the live-site workflow and verify the
deployed response headers and API boundary checks again.
