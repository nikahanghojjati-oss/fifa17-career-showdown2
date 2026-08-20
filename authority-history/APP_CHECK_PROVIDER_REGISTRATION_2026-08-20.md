# Production App Check provider registration evidence — 2026-08-20

Status: OWNER-PROVIDED PROVIDER EVIDENCE / PRODUCTION REGISTRATION VERIFIED / ENFORCEMENT OFF / WEBSITE RUNTIME NOT YET CONNECTED.

This record preserves the minimum provider facts needed to distinguish successful Firebase App Check registration from later client integration and enforcement.

Owner screenshots supplied on 2026-08-20 establish all of the following for production project `fifa17-career-showdown-prod`:

1. Google Cloud reCAPTCHA Enterprise API is enabled.
2. Production Web key display name is `Career Mode Showdown Production App Check`.
3. Application type is Web.
4. Production domain is exactly `nikahanghojjati-oss.github.io`.
5. Domain verification remains enabled.
6. AMP, interactive challenges, testing-only mode and WAF mode remain disabled.
7. Firebase App Check registration uses `reCAPTCHA Enterprise`, not classic reCAPTCHA.
8. Token time to live is one hour.
9. App risk threshold is Medium (`0.5`).
10. Firebase displayed `App registration successful` and the Career Mode Showdown Web App status became `Registered` with a green reCAPTCHA Enterprise provider indicator.

What this evidence does not prove:

- the production website has loaded or initialized the Firebase/App Check SDK;
- legitimate production browser requests are carrying App Check tokens;
- App Check metrics are healthy;
- App Check enforcement is enabled;
- trusted runtime IAM is activated;
- application-client Firestore writes are authorized;
- Stage 3 Registered Devices / Private Pairing is authorized.

Security locks:

- App Check enforcement remains off until legitimate production client integration and metrics are proven.
- Browser Firestore create/update/delete remains deny-all.
- The reCAPTCHA Enterprise site key and Firebase Web API key are public project configuration but concrete values remain outside committed runtime source under the existing controlled-injection policy.
- No service-account credentials, OAuth refresh tokens or other long-lived secrets belong in this evidence record.

This is provider evidence, not independent implementation authority. Current source, `NEXT_TASK.md`, WEC and later owner instructions remain authoritative.
