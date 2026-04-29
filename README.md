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
  - **City pages**: `/cities/[city]` (e.g., `/cities/spokane`)
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
| `RUNTIME_SERVICE_ACCOUNT` | `cloud-run-runtime@<project>.iam.gserviceaccount.com` | SA the container runs as. **Must have `roles/datastore.user`** on the Firestore project. |
| `FIREBASE_PROJECT_ID` | same as `GCP_PROJECT_ID` (usually) | Tells `firebase-admin` which project's Firestore to talk to |

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
- [ ] Create the **deployer** service account and grant it `roles/run.admin`, `roles/artifactregistry.writer`, `roles/iam.serviceAccountUser` (on the runtime SA).
- [ ] (WIF only) Create a Workload Identity Pool + Provider for GitHub OIDC and bind the deployer SA to the GitHub repo.
- [ ] Configure all GitHub variables/secrets listed above.
- [ ] (Optional, after first dedupe query in prod) Click the auto-generated link in Cloud Run logs to create the composite indexes for `website_leads`.

### Deployment checklist (per release)

- [ ] PR is green (lint, test, build all pass via the `ci` job).
- [ ] No new `FIREBASE_*` secrets are needed — the runtime SA's ADC is used in Cloud Run.
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
├── cities/[city]/      # City-level local SEO pages
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
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to a service-account JSON. Used as a fallback when the three vars above are not set. | _optional_ |
| `NEXT_PUBLIC_GTM_ID` | Google Tag Manager container ID (e.g. `GTM-XXXXXXX`). When set, GTM is loaded site-wide and lead submissions fire a `generate_lead` dataLayer event. Empty disables GTM entirely. | _optional_ |
| `NEXT_PUBLIC_SITE_ENV` | `production`, `staging`, `beta`, `preview`, or `development`. Anything other than `production` forces `noindex,nofollow` on every page and a blanket `Disallow: /` in `robots.txt`. The conversion event is tagged with this so you can filter staging traffic out of GA4 / Ads. | `production` |

**Production (Cloud Run):** set only `NEXT_PUBLIC_SITE_URL`, `FIREBASE_PROJECT_ID`, and `NODE_ENV=production`. **Do not** set `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` — Cloud Run's runtime service account provides Application Default Credentials automatically (see the deployment section below).


When running on Google Cloud Run, the simplest setup is to grant the Cloud Run service account the `roles/datastore.user` (Firestore) role and rely on Application Default Credentials — no `FIREBASE_*` env vars are required in that case.

## Lead Capture (Firestore)

`POST /api/leads` writes a sanitized document to the `website_leads` collection. Stored fields:

- `fullName`, `email`, `phone`, `zip`, `message`
- `emailNorm`, `phoneNorm` — normalized identities used for dedupe
- `source` (`homepage` | `medicare-spokane` | `turning-65` | `advantage-vs-supplement` | `contact` | `unknown`)
- Attribution: `sourcePath`, `referrer`, `utm`, `clientSubmittedAt`
- Server stamps: `submittedAt` (Firestore Timestamp), `submittedAtIso`, `createdAt` (`serverTimestamp`)
- Workflow: `status: "new"`, `siteSource: "medicareinspokane.com"`

If the same normalized email **or** phone submits again within 10 minutes, the existing document id is returned with `duplicate: true` instead of creating a new doc.

The Firebase Admin SDK is only ever imported via `lib/firebase-admin.ts`, which is marked `server-only` so a client component pulling it in fails the build. Credentials are never exposed to the browser.

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
| `/healthz` | Liveness probe for Cloud Run / uptime monitors. Returns `{ status: "ok", uptime }` with `Cache-Control: no-store`. Performs no I/O so it cannot fail because of Firestore. |
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
- Build the image with `NEXT_PUBLIC_SITE_URL=https://beta.medicareinspokane.com`, `NEXT_PUBLIC_SITE_ENV=staging`, `NEXT_PUBLIC_GTM_ID=$VAR` baked in.
- Push to `…/site-beta:<sha>` in Artifact Registry.
- Deploy to the `medicare-spokane-site-beta` service with the same vars set as runtime env (and `FIREBASE_PROJECT_ID`, `NODE_ENV=production`).

> ⚠️ `NEXT_PUBLIC_*` values are inlined into the client JS bundle at `next build`. Setting them only on Cloud Run is not enough — they must also be passed as `--build-arg` (the workflow does this).

### Post-deploy QA on beta

Run the [Launch QA checklist](#launch-qa-checklist) against `https://beta.medicareinspokane.com`. In particular:
- `curl -sI https://beta.medicareinspokane.com/robots.txt` shows `Disallow: /` (because `NEXT_PUBLIC_SITE_ENV=staging`).
- `curl -sI https://beta.medicareinspokane.com/healthz` returns `200`.
- View source on any page → `<meta name="robots" content="noindex,nofollow,…">` is present.
- Submit a test lead → check Firestore `website_leads` for the doc, and GTM Preview for a `generate_lead` event tagged `site_env: "staging"` with **no** name/email/phone/zip in the payload.
- Confirm security headers on `curl -sI https://beta.medicareinspokane.com/` (HSTS, `X-Frame-Options: DENY`, etc.).

### Promote to production

After beta passes QA, re-run the same workflow with **Target: production**. It rebuilds with `NEXT_PUBLIC_SITE_ENV=production` and `NEXT_PUBLIC_SITE_URL=https://www.medicareinspokane.com` and deploys to the `medicare-spokane-site` service.
