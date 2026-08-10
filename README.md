# Medicare Spokane Site

A production-ready Next.js (App Router) website for a local Medicare insurance agency serving Spokane, WA and surrounding Eastern Washington communities.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Deployment**: Google Cloud Run (Docker)

## Features

- SEO-optimized layout with metadata, Open Graph, and Twitter cards
- JSON-LD structured data (LocalBusiness + FAQPage schemas)
- Dynamic XML sitemap and robots.txt generation
- Local SEO page structure:
  - **Directory pages**: `/directory/[city-state]` for canonicalized legacy city URLs
  - **Local area Medicare pages**: `/medicare-spokane`, `/medicare-spokane-valley`, etc.
  - **ZIP code pages**: `/zip/[zip]` (e.g., `/zip/99201`)
  - **Topic pages**: `/topics/[topic]` (e.g., `/topics/medicare-advantage`)
- Fully responsive design
- Static generation with `generateStaticParams`

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Building for Production

```bash
npm run build
npm start
```

## Docker / Google Cloud Run

The Dockerfile is a multi-stage Alpine/Node 20 build that produces the Next.js [`standalone`](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) output. The runtime stage runs as a non-root user and listens on `0.0.0.0:8080` (Cloud Run's expected contract).

```bash
# Build Docker image
docker build -t medicare-spokane-site .

# Run locally (Cloud Run-style: PORT 8080)
docker run -p 8080:8080 \
  -e NEXT_PUBLIC_SITE_URL=http://localhost:8080 \
  medicare-spokane-site

# Manual one-off deploy (for emergencies — normal deploys go through CI)
gcloud run deploy medicare-spokane-site \
  --image=REGION-docker.pkg.dev/PROJECT/REPO/medicare-spokane-site:TAG \
  --platform=managed \
  --region=us-west1 \
  --allow-unauthenticated \
  --service-account=cloud-run-runtime@PROJECT.iam.gserviceaccount.com \
  --set-env-vars=NEXT_PUBLIC_SITE_URL=https://www.medicareinspokane.com,FIREBASE_PROJECT_ID=PROJECT,NODE_ENV=production
```

## Continuous Deployment (GitHub Actions → Cloud Run)

The workflow at `.github/workflows/deploy.yml` runs on every push to `main` (and on manual dispatch). It:

1. Lints (`npm run lint`), tests (`npm test`), and builds (`npm run build`) the project.
2. Builds the Docker image and pushes it to Artifact Registry, tagged with the commit SHA.
3. Deploys the new image to Cloud Run, binding the runtime service account so the container picks up Application Default Credentials for Firestore.

### Required GitHub configuration

Set these in **Settings → Secrets and variables → Actions**.

#### Variables (not secrets — visible in logs)

| Variable | Example | Purpose |
|---|---|---|
| `GCP_PROJECT_ID` | `medicareinspokane-prod` | Target GCP project |
| `GCP_REGION` | `us-west1` | Cloud Run + Artifact Registry region |
| `CLOUD_RUN_SERVICE` | `medicare-spokane-site` | Cloud Run service name |
| `ARTIFACT_REGISTRY_REPO` | `web` | Existing Artifact Registry repo in `GCP_REGION` |
| `RUNTIME_SERVICE_ACCOUNT` | `cloud-run-runtime@<project>.iam.gserviceaccount.com` | SA the container runs as. **Must have `roles/datastore.user`** on the Firestore project. Before enabling the CMS, it also needs `firebaseauth.users.get` and `firebaseauth.users.createSession`. |
| `FIREBASE_PROJECT_ID` | same as `GCP_PROJECT_ID` (usually) | Tells `firebase-admin` which project's Firestore to talk to |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web API key | Public browser identifier for the private CMS sign-in; required only before enabling the CMS |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `<project>.firebaseapp.com` | Firebase Auth domain for the private CMS sign-in; required only before enabling the CMS |
| `KNOWLEDGE_CMS_ENABLED` | `false` | Server-only feature gate; absence and every value except exact `true` keep the CMS hidden |
| `KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED` | `false` | Separate server-only gate for explicitly confirmed, one-article-at-a-time private-draft creation; requires the CMS gate |
| `KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED` | `false` | Separate server-only gate for one explicitly confirmed topic/FAQ private draft; requires the CMS gate |
| `KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED` | `false` | Separate server-only gate for one immutable article rendering artifact; requires the CMS gate and exact `shadow` mode |
| `KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_EXECUTION_ENABLED` | `false` | Beta-only, admin-only gate for creating one immutable, expiring approval after fresh 45-record and 22-route verification |
| `KNOWLEDGE_CMS_PUBLIC_CUTOVER_ENABLED` | `false` | Final public-routing gate. Exact `true` is accepted only with `cutover`, a matching approval receipt, and every mutation gate disabled |
| `KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_RECEIPT` | _empty_ | Lowercase 64-character receipt of the current immutable approval; required only for guarded cutover |
| `KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE` | `static` | Server-only renderer gate. `shadow` is private; `cutover` routes only the 22 governed paths when every independent gate is exact. |

#### Authentication — pick **one**

**A) Workload Identity Federation (recommended — no long-lived keys):**

| Variable | Purpose |
|---|---|
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Full provider resource name, e.g. `projects/123456789/locations/global/workloadIdentityPools/github/providers/github` |
| `GCP_DEPLOY_SERVICE_ACCOUNT` | Deployer SA email, e.g. `github-deployer@<project>.iam.gserviceaccount.com` |

The deployer SA needs: `roles/run.admin`, `roles/artifactregistry.writer`, and `roles/iam.serviceAccountUser` on the runtime SA.

**B) Service-account JSON key (legacy fallback):**

| Secret | Purpose |
|---|---|
| `GCP_SERVICE_ACCOUNT_KEY` | Entire JSON key for the deployer SA. Store as a **secret**, never a variable. |

The workflow auto-detects which path to use based on whether `GCP_WORKLOAD_IDENTITY_PROVIDER` is set.

### One-time GCP setup checklist

- [ ] Enable APIs: `run.googleapis.com`, `artifactregistry.googleapis.com`, `firestore.googleapis.com`, `iamcredentials.googleapis.com`.
- [ ] Create the Firestore database in **Native** mode in the chosen region.
- [ ] Create an Artifact Registry **Docker** repo (`gcloud artifacts repositories create web --repository-format=docker --location=$REGION`).
- [ ] Create the **runtime** service account and grant it `roles/datastore.user`.
- [ ] Before enabling the CMS, grant the runtime service account a least-privilege custom role containing `firebaseauth.users.get` and `firebaseauth.users.createSession` (or use `roles/firebaseauth.admin` only if broader Auth administration is intentionally acceptable).
- [ ] Create the **deployer** service account and grant it `roles/run.admin`, `roles/artifactregistry.writer`, `roles/iam.serviceAccountUser` (on the runtime SA).
- [ ] (WIF only) Create a Workload Identity Pool + Provider for GitHub OIDC and bind the deployer SA to the GitHub repo.
- [ ] Configure all GitHub variables/secrets listed above.
- [ ] (Optional, after first dedupe query in prod) Click the auto-generated link in Cloud Run logs to create the composite indexes for `website_leads`.

### Deployment checklist (per release)

- [ ] PR is green (lint, test, build all pass via the `ci` job).
- [ ] No new `FIREBASE_*` secrets are needed — the runtime SA's ADC is used in Cloud Run.
- [ ] If the CMS flag is enabled, Firebase Google sign-in, authorized domains, browser variables, current CMS role claims, and runtime Auth permissions are verified first.
- [ ] Merge to `main` → workflow auto-deploys.
- [ ] Verify the new revision in Cloud Run console; check `100%` traffic is on the new revision.
- [ ] Hit `https://www.medicareinspokane.com/api/leads` with a smoke test payload and confirm a doc appears in Firestore.
- [ ] Watch Cloud Run logs for ~5 min for any `[leads]` or `[api/leads]` errors.

## Project Structure

```
app/
├── layout.tsx          # Root layout — metadata, Header, Footer
├── page.tsx            # Home page
├── sitemap.ts          # Dynamic XML sitemap
├── robots.ts           # robots.txt
├── not-found.tsx       # 404 page
├── directory/[location]/ # Canonical legacy directory pages
├── medicare-*/         # Local area Medicare pages
├── cities/[city]/      # Legacy city URLs redirected to canonical local pages
├── zip/[zip]/          # ZIP code local SEO pages
└── topics/[topic]/     # Medicare topic pages
components/
├── Header.tsx
├── Footer.tsx
├── CTASection.tsx
└── LocalBusinessSchema.tsx
lib/
├── cities.ts           # City data
├── zips.ts             # ZIP code data
├── topics.ts           # Medicare topic data
└── site.ts             # Site-wide config
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | The canonical URL of the site | `https://www.medicareinspokane.com` |
| `PORT` | Port the server listens on (Cloud Run sets this automatically) | `8080` |
| `LEADS_COLLECTION` | Firestore collection for lead documents | `website_leads` |
| `FIREBASE_PROJECT_ID` | GCP project that owns the Firestore database | _required for lead capture_ |
| `FIREBASE_CLIENT_EMAIL` | Service-account client email (admin SDK) | _required if not using ADC_ |
| `FIREBASE_PRIVATE_KEY` | Service-account private key. Newlines may be escaped as `\n` — they are unescaped at runtime. **Server-only — never expose to the client.** | _required if not using ADC_ |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web app API key used by the private CMS Google sign-in. This is a public Firebase identifier, not a service-account secret. | _required before enabling the CMS_ |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain used by the private CMS Google sign-in. | _required before enabling the CMS_ |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID used by the browser Auth SDK. It must match the server-side Firebase project. | _required before enabling the CMS_ |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to a service-account JSON. Used as a fallback when the three vars above are not set. | _optional_ |
| `CRM_API_BASE_URL` | Base URL for the CRM public form submission endpoint. **Server-only — never expose to the client.** | _required for CRM sync_ |
| `CRM_API_KEY` | Optional server-side API key forwarded to the CRM public form submission endpoint as an `x-api-key` header. Never expose it to the client. | _optional_ |
| `KNOWLEDGE_CMS_ENABLED` | Server-only gate for the editorial CMS and private workspace. Only the exact value `true` enables it. Keep disabled until Firebase Auth, authorized domains, and explicit CMS role claims are configured. | `false` |
| `KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED` | Server-only gate for publisher/admin creation of one explicitly confirmed Resource Library article draft per transaction. It cannot activate unless `KNOWLEDGE_CMS_ENABLED=true`; bulk execution remains unavailable. | `false` |
| `KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED` | Server-only gate for one explicitly confirmed topic or FAQ private draft per transaction. It requires the CMS gate and has no bulk path. | `false` |
| `KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED` | Server-only gate for one revision-bound immutable rendering artifact plus audit event. It requires exact CMS and private-shadow activation. | `false` |
| `KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_EXECUTION_ENABLED` | Beta-only server gate for one admin-confirmed immutable approval. It requires exact shadow mode, all record/artifact execution gates disabled, and fresh complete evidence. | `false` |
| `KNOWLEDGE_CMS_PUBLIC_CUTOVER_ENABLED` | Independent public-routing gate. It requires exact CMS enablement, `cutover`, a current approval receipt, and every execution gate disabled. | `false` |
| `KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_RECEIPT` | Receipt suffix of the current immutable cutover approval. It must be exactly 64 lowercase hexadecimal characters. | _empty_ |
| `KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE` | Server-only renderer mode. `static` is the default, `shadow` enables private comparison, and `cutover` is effective only through the complete guarded routing configuration. | `static` |
| `KNOWLEDGE_CMS_SEO_ENABLED` | Enables the admin-only deterministic SEO workbench. When the repository variable is unset, deployment follows the private CMS gate; explicit `false` remains the kill switch. It does not change public content. | follows `KNOWLEDGE_CMS_ENABLED` |
| `KNOWLEDGE_CMS_SEARCH_CONSOLE_ENABLED` | Adds Search Console page/query evidence to SEO scans through Application Default Credentials. | `false` |
| `SEARCH_CONSOLE_SITE_URL` | Search Console property, normally `sc-domain:medicareinspokane.com`. | _required when Search Console is enabled_ |
| `KNOWLEDGE_CMS_AI_ENABLED` | Enables the admin-only OpenAI copilot. Proposals remain advisory until explicitly applied as private drafts. | `false` |
| `OPENAI_API_KEY` | OpenAI API credential supplied to Cloud Run from Secret Manager. Never use a browser-exposed variable. | _required when AI is enabled_ |
| `KNOWLEDGE_CMS_AI_MODEL` | Routine structured research/drafting model. | `gpt-5.6-terra` |
| `KNOWLEDGE_CMS_AI_DEEP_MODEL` | Higher-capability model used only when the administrator selects deeper research. | `gpt-5.6-sol` |
| `KNOWLEDGE_CMS_AI_MAX_OUTPUT_TOKENS` | Hard response ceiling for routine copilot requests, including reasoning tokens. | `16000` |
| `KNOWLEDGE_CMS_AI_DEEP_MAX_OUTPUT_TOKENS` | Hard response ceiling for administrator-selected deeper research. | `24000` |
| `KNOWLEDGE_CMS_AI_TIMEOUT_MS` | OpenAI request timeout; deployment accepts 30,000–240,000 milliseconds. | `180000` |
| `KNOWLEDGE_CMS_CONTINUOUS_SEO_ENABLED` | Enables the protected scheduled-scan endpoint. Deployment also requires Search Console, and execution requires current live activation evidence for the exact environment/configuration. | `false` |
| `KNOWLEDGE_CMS_SEO_CRON_TOKEN` | Random 32+ character bearer token supplied from Secret Manager to the scheduled endpoint. | _required when continuous SEO is enabled_ |
| `NEXT_PUBLIC_GTM_ID` | Google Tag Manager container ID (e.g. `GTM-XXXXXXX`). When set, GTM is loaded site-wide and lead submissions fire a `generate_lead` dataLayer event. Empty disables GTM entirely. | _optional_ |
| `NEXT_PUBLIC_SITE_ENV` | `production`, `staging`, `beta`, `preview`, or `development`. Anything other than `production` forces `noindex,nofollow` on every page and a blanket `Disallow: /` in `robots.txt`. The conversion event is tagged with this so you can filter staging traffic out of GA4 / Ads. | `production` |

**Production (Cloud Run):** keep `KNOWLEDGE_CMS_ENABLED=false` until the
documented Auth prerequisites are complete. The deployment workflow bakes
`NEXT_PUBLIC_*` values into the image and supplies `FIREBASE_PROJECT_ID` plus
the server-only CMS flag at runtime. **Do not** set `FIREBASE_CLIENT_EMAIL` /
`FIREBASE_PRIVATE_KEY` — Cloud Run's runtime service account provides
Application Default Credentials automatically (see the deployment section
below).


When running on Google Cloud Run, grant the Cloud Run service account
`roles/datastore.user` and rely on Application Default Credentials — no
service-account key env vars are required. The private CMS additionally needs
`firebaseauth.users.get` and `firebaseauth.users.createSession`; prefer a custom
least-privilege role for those two read/session permissions.

## Lead Capture (Firestore)

`POST /api/leads` validates the request, writes a sanitized document to the `website_leads` collection as a backup, then submits the full form payload to the CRM public form endpoint from the server-side route. Standard lead forms require `fullName` plus either `email` or `phone`; `zip` and `message` are optional. Stored fields:

- `fullName`, `email`, `phone`, `zip`, `message`
- `emailNorm`, `phoneNorm` — normalized identities used for dedupe
- `source` (`homepage` | `contact` | `rx-drug-review` | `compare-medicare-options` | `turning-65-medicare-spokane` | `working-past-65-medicare` | `helping-parent-with-medicare` | `medicare-appointment-checklist` | `medicare-plan-review-spokane` | `medicare-enrollment-resources` | `medicare-advantage` | `medicare-supplements` | `medicare-part-d` | `supplemental-insurance` | `advantage-vs-supplement` | `medicare-spokane` | `medicare-spokane-valley` | `medicare-liberty-lake` | `medicare-cheney` | `medicare-airway-heights` | `medicare-medical-lake` | `medicare-mead` | `medicare-deer-park` | `unknown`)
- Attribution: `sourcePath`, `referrer`, `utm`, `clientSubmittedAt`
- Server stamps: `submittedAt` (Firestore Timestamp), `submittedAtIso`, `createdAt` (`serverTimestamp`)
- Workflow: `status: "new"`, `siteSource: "medicareinspokane.com"`
- CRM sync tracking: `crmSyncStatus`, `crmSyncAttempts`, `crmContactId`, `crmLastAttemptAt`, `crmLastAttemptAtIso`, `crmLastError`, `crmLastResponseStatus`, `crmEndpointPath`

If the same normalized email **or** phone submits again within 10 minutes, the existing document id is returned with `duplicate: true` instead of creating a new doc. If that recent lead has not synced to the CRM yet, the server retries the CRM sync against the existing Firestore backup before responding.

The Firebase Admin SDK is only ever imported via `lib/firebase-admin.ts`, and the CRM client lives in the server-only `lib/crm.ts`. Both are only called from the Node.js route handler, so the Firestore credentials and CRM API key are never exposed to the browser.

`POST /api/review-feedback` follows the same backup-first pattern for the review funnel: validate the request, save the feedback to the `review_feedback` collection, then attempt the CRM public form sync without blocking a successful response after the Firestore write.

## Knowledge CMS foundation

The admin-only Content & SEO Copilot combines deterministic page/CMS audits,
Search Console comparison periods, guarded web research, and structured AI
proposals. It retains scan/proposal history, supports follow-up refinements,
and can prepare private working revisions for published articles without an
initial CMS mutation. A separate confirmation snapshots the exact private CMS
publication and opens the proposal as an indexing-blocked draft only while the
public renderer remains static. AI cannot submit, approve, publish, enable
indexing, or change public routing. Token and web-search usage are retained on
each run, and output/time limits are enforced before activation. A separate
live check verifies Search Console access and both configured OpenAI models
without sending CMS content or making a generation request. Its sanitized,
environment-bound evidence expires after 35 days and is required before the
scheduled scanner can execute. See
[`docs/knowledge-cms-ai-seo-copilot.md`](docs/knowledge-cms-ai-seo-copilot.md)
for architecture, activation, Search Console access, secrets, scheduling, and
rollback.

The default-off editorial foundation defines governed `knowledge_articles`,
`knowledge_topics`, and `knowledge_faqs` records, plus revision-bound
`knowledge_cms_article_renderings`, unique slug locks, search projections, and
append-only audit events. Published-article revision starts also preserve the
prior full record in `knowledge_cms_article_revision_snapshots`. The private
`/admin/knowledge` workspace adds authenticated list, detail, create-draft, and
edit-draft views, plus submit-for-review and verified request-changes controls.
It remains a server-authorized editing surface and does not render CMS records
on the public website. Verified approval is available to an authenticated
licensed reviewer, including the record owner. An authenticated publisher may
then record a separate blocked-or-eligible indexing decision, publish into the
private CMS search projection, and unpublish back to draft with an audited
reason; the same verified account may perform both revision-bound actions.
Neither action creates a public route or changes the existing Resource Library.
Exact private `shadow` mode adds a publisher/admin workspace that checks
governed published articles and immutable CMS rendering artifacts against all
22 React and metadata parity contracts. The preview performs no writes,
reconstructs candidate React output without importing legacy page modules,
renders it inertly, and leaves every public route on its existing static
source. A separate default-off control may create one revision-bound artifact
and one audit event; it cannot overwrite, bulk-execute, or authorize cutover.
The authenticated operational readiness report independently checks deployment
flags, browser/Admin Firebase project alignment, aggregate role coverage,
verified review and publishing coverage, deterministic article controls,
execution history, and every current five-artifact migration receipt. It exposes no Auth
user identities, performs no repair or write, and cannot enable execution,
publication, indexing, shadow mode, or public cutover.
The publisher/admin beta activation preview then binds a fresh readiness receipt
to exact `staging` plus `https://beta.medicareinspokane.com`, shows the proposed
private-only settings without applying them, and supplies a deterministic
record-preserving rollback checklist. It rejects production, stale or tampered
evidence, malformed deployment identity, and `cutover`; it carries no variable,
deployment, traffic, execution, indexing, or production authority.
The separately gated migration boundary can create one explicitly confirmed,
indexing-blocked article draft at a time. It reconstructs the deterministic
control server-side and atomically checks the expected-absent document, slug,
canonical path, search projection, and revision-one audit event before writing
the draft plus its slug/canonical locks and append-only audit event. It cannot
overwrite, bulk-execute, publish, index, or change the verified static route.
Publisher/admin history is derived from validated migration audit events, and
each event opens a five-artifact, zero-write verification receipt that checks
the current article, locks, search state, and deterministic control evidence.
After all 45 records and all 22 current rendering artifacts pass, the private
public-cutover workspace can create one immutable seven-day approval with two
atomic writes: the approval and its audit event. A matching runtime receipt may
then route only the 22 governed canonical paths through the CMS-native
renderer. Every request revalidates the approval, current article revision,
artifact fingerprint, canonical, and exact parity within a 1.5-second budget;
any absence, drift, error, or timeout serves the verified local static snapshot
instead. All 20 form-bearing routes restore the real `LeadForm` client boundary
through exact-hash entry adapters, so public cutover does not turn conversion
forms into inert HTML. Production cutover builds start as tagged no-traffic
Cloud Run revisions, and traffic movement remains a separate operator action.
See [docs/knowledge-cms-foundation.md](docs/knowledge-cms-foundation.md) for the
workflow, collection, permission, and rollout contract.

Keep `KNOWLEDGE_CMS_ENABLED=false` until Firebase Google sign-in, authorized
domains, the three public Firebase web variables, and explicit
`knowledgeCmsRoles` custom claims are configured. Enabling the flag without
those prerequisites does not grant access; the workspace still requires a
verified Firebase session and current server-side role lookup on every read or
write.

### Suggested Firestore index

For the dedupe lookup, create composite indexes on `website_leads`:

- `emailNorm` (Asc) + `submittedAt` (Desc)
- `phoneNorm` (Asc) + `submittedAt` (Desc)

Firestore will print an "index required" link in the server logs the first time the query runs in production — opening it auto-creates the right index.

## Testing

```bash
npm test
```

Runs lightweight unit tests for the pure validation/dedupe helpers in `lib/leadValidation.ts` (Node's built-in `node:test` via `tsx`).

## Analytics & conversion tracking

Tracking is **opt-in** via `NEXT_PUBLIC_GTM_ID`. When that variable is set, the layout loads Google Tag Manager via `@next/third-parties/google` once for the whole app, and successful lead-form submissions push a privacy-friendly conversion event onto the `dataLayer`:

```js
{
  event: "generate_lead",          // GA4 recommended event name
  lead_source: "homepage",          // which form was used
  had_message: "no",                 // boolean as string
  site_env: "production",
  utm_source, utm_medium, utm_campaign, utm_term, utm_content   // when present
}
```

**Privacy guarantees** (enforced in `lib/analytics.ts`):

- Name, email, phone, ZIP, free-text message body, and IP address are **never** sent to GTM/GA4.
- Only structural metadata (form ID, env, UTM tags) is forwarded.
- Map `generate_lead` to a Conversion / Google Ads conversion inside GTM — no extra code needed.

## Operational endpoints

| Path | Purpose |
|---|---|
| `/healthz` | Internal container smoke, startup, and liveness probe. Returns `{ status: "ok", uptime }` with `Cache-Control: no-store`. Performs no I/O so it cannot fail because of Firestore. |
| `/api/deployment-health` | Public rollout and CMS SEO-monitor endpoint. Exposes the same revision-bound payload without using the conventional probe path that Google edge handling can intercept. |
| `/robots.txt` | Auto-generated. Disallows everything when `NEXT_PUBLIC_SITE_ENV` ≠ `production`. |
| `/sitemap.xml` | Auto-generated from `lib/cities`, `lib/zips`, `lib/topics`. |

## Security headers

Set in `next.config.ts` for every path:

- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`
- `Cross-Origin-Opener-Policy: same-origin`
- `X-Powered-By` is suppressed (`poweredByHeader: false`).

## Launch QA checklist

Run through this before flipping DNS to the Cloud Run URL.

**Build & runtime**
- [ ] `npm run lint` clean
- [ ] `npm test` all green
- [ ] `npm run build` succeeds and reports the expected route count
- [ ] Container starts locally on `:8080` (`docker run -p 8080:8080 …`)
- [ ] `GET /healthz` returns 200 with `{"status":"ok"}`

**SEO / indexing**
- [ ] `NEXT_PUBLIC_SITE_ENV=production` is set in Cloud Run for the live service
- [ ] Beta / preview revisions have `NEXT_PUBLIC_SITE_ENV=staging` (or similar) and serve `Disallow: /` at `/robots.txt`
- [ ] `/robots.txt` on prod allows crawling and lists `/sitemap.xml`
- [ ] `/sitemap.xml` includes every city, ZIP, and topic page
- [ ] Each page has a unique `<title>` and canonical tag pointing at `https://www.medicareinspokane.com/...`

**Forms & lead capture**
- [ ] Submitting the homepage form creates a Firestore doc in `website_leads`
- [ ] Submitting the contact form (with message) creates a doc with `message` populated
- [ ] Re-submitting the same email/phone within the dedupe window updates the existing doc rather than duplicating
- [ ] On success, the GTM dataLayer contains a `generate_lead` event with **no** name/email/phone/ZIP fields
- [ ] GTM Preview mode confirms the event fires and contains only the whitelisted fields

**Security headers**
- [ ] `curl -I https://www.medicareinspokane.com/` shows all headers from `next.config.ts`
- [ ] `X-Powered-By` header is absent
- [ ] HTTPS enforced (HSTS); HTTP redirects to HTTPS at the load balancer / Cloud Run domain

**Error pages**
- [ ] `/this-route-does-not-exist` renders the styled 404 page
- [ ] Forcing a render error shows the in-layout error page with a working "Try again" button

**Analytics**
- [ ] GTM container is published (not just in workspace)
- [ ] GA4 sees `generate_lead` events from production traffic only
- [ ] The Google Ads conversion (if applicable) is mapped to the same event

## Phase 6 — Beta deployment runbook

> **For the owner doing the actual deploy:** the full beginner-friendly, click-by-click checklist (GitHub vars, GCP APIs, Artifact Registry, Cloud Run service, IAM, DNS, dispatching the workflow, post-deploy QA, and promotion to prod) is in [`docs/deploy-beta-checklist.md`](docs/deploy-beta-checklist.md). The summary below is the short version.

Phase 6 deploys the site to a **separate** Cloud Run service at `beta.medicareinspokane.com` so production QA can happen against real Cloud Run + real Firestore without risking the live root domain.

### One-time setup

1. **Create a second Cloud Run service** (empty placeholder is fine — the workflow will replace it):
   ```bash
   gcloud run deploy medicare-spokane-site-beta \
     --image=us-docker.pkg.dev/cloudrun/container/hello \
     --region="$GCP_REGION" \
     --no-allow-unauthenticated   # tighten until you're ready
   ```
2. **Add GitHub repo variables** (Settings → Secrets and variables → Actions → Variables):
   - `CLOUD_RUN_SERVICE_BETA` = `medicare-spokane-site-beta`
   - `NEXT_PUBLIC_GTM_ID` = `GTM-XXXXXXX` (or leave unset to disable GTM)
   - All existing prod vars must remain set: `GCP_PROJECT_ID`, `GCP_REGION`, `ARTIFACT_REGISTRY_REPO`, `RUNTIME_SERVICE_ACCOUNT`, `FIREBASE_PROJECT_ID`, `CLOUD_RUN_SERVICE`.
3. **Map the beta domain** in Cloud Run → Manage Custom Domains:
   - Domain: `beta.medicareinspokane.com`
   - Service: `medicare-spokane-site-beta`
   - Add the CNAME record GCP gives you to your DNS provider.

### Trigger the beta deploy

GitHub → Actions → **Deploy to Cloud Run** → **Run workflow** → choose:
- Branch: `main` (or your release branch)
- Target: `beta`

The workflow will:
- Verify the target hostname points to `ghs.googlehosted.com` before building.
- Build the image with `NEXT_PUBLIC_SITE_URL=https://beta.medicareinspokane.com`, `NEXT_PUBLIC_SITE_ENV=staging`, `NEXT_PUBLIC_GTM_ID=$VAR` baked in.
- Push to `…/site-beta:<sha>` in Artifact Registry.
- Deploy to the `medicare-spokane-site-beta` service with explicit public ingress, default URL, and disabled Invoker IAM check, plus the same vars set as runtime env (and `FIREBASE_PROJECT_ID`, `NODE_ENV=production`).

> ⚠️ `NEXT_PUBLIC_*` values are inlined into the client JS bundle at `next build`. Setting them only on Cloud Run is not enough — they must also be passed as `--build-arg` (the workflow does this for the site, analytics, and Firebase Auth identifiers).

### Post-deploy QA on beta

Run the [Launch QA checklist](#launch-qa-checklist) against `https://beta.medicareinspokane.com`. In particular:
- `curl -sI https://beta.medicareinspokane.com/robots.txt` shows `Disallow: /` (because `NEXT_PUBLIC_SITE_ENV=staging`).
- `curl -sI https://beta.medicareinspokane.com/api/deployment-health` returns `200`.
- View source on any page → `<meta name="robots" content="noindex,nofollow,…">` is present.
- Submit a test lead → check Firestore `website_leads` for the doc, and GTM Preview for a `generate_lead` event tagged `site_env: "staging"` with **no** name/email/phone/zip in the payload.
- Confirm security headers on `curl -sI https://beta.medicareinspokane.com/` (HSTS, `X-Frame-Options: DENY`, etc.).

### Promote to production

After beta passes QA, re-run the same workflow with **Target: production**. It rebuilds with `NEXT_PUBLIC_SITE_ENV=production` and `NEXT_PUBLIC_SITE_URL=https://www.medicareinspokane.com` and deploys to the `medicare-spokane-site` service.
