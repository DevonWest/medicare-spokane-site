# Owner deployment checklist — `beta.medicareinspokane.com`

This is the **step-by-step, click-by-click** checklist to take this repo from "code is ready" to "beta is live at https://beta.medicareinspokane.com on Google Cloud Run." Follow it top to bottom. You only do sections 1–6 once. After that, every deploy is just section 7.

> **Placeholders used in this doc** — replace them with your real values everywhere they appear:
> - `PROJECT_ID` → your GCP project, e.g. `medicareinspokane-prod`
> - `REGION` → a Cloud Run region near Spokane, recommended `us-west1`
> - `medicareinspokane.com` → your real apex domain (already correct here)
>
> Anywhere this doc says "open the Cloud Console," go to https://console.cloud.google.com and make sure the project picker in the top bar shows your `PROJECT_ID` before clicking anything.

---

## 0. Prerequisites (5 min)

- [ ] You're an **Owner** or **Editor** on the GCP project `PROJECT_ID`.
- [ ] You're an **Admin** on the GitHub repo `DevonWest/medicare-spokane-site`.
- [ ] You can edit DNS records for `medicareinspokane.com` (whoever runs your registrar — GoDaddy, Cloudflare, Namecheap, Google Domains, etc.).
- [ ] You have `gcloud` installed locally **OR** you're comfortable running commands in Cloud Shell (the `>_` icon in the top right of the Cloud Console). Cloud Shell is easier — use it.
- [ ] In Cloud Shell, run once:
  ```bash
  gcloud config set project PROJECT_ID
  gcloud config set run/region REGION
  ```

---

## 1. GitHub repository variables and secrets (10 min)

The deploy workflow (`.github/workflows/deploy.yml`) reads these. You set them in **GitHub → your repo → Settings → Secrets and variables → Actions**.

There are two tabs there: **Variables** (non-sensitive, shows in logs) and **Secrets** (sensitive, masked in logs). Put each item in the right tab.

### 1a. Variables (tab: "Variables" → "New repository variable")

| Name | Example value | Notes |
|---|---|---|
| `GCP_PROJECT_ID` | `medicareinspokane-prod` | Your GCP project ID (not the number) |
| `GCP_REGION` | `us-west1` | Same region you'll use for everything else |
| `ARTIFACT_REGISTRY_REPO` | `web` | The Artifact Registry repo name from §3 |
| `CLOUD_RUN_SERVICE` | `medicare-spokane-site` | Production service name (from §4) |
| `CLOUD_RUN_SERVICE_BETA` | `medicare-spokane-site-beta` | Beta service name (from §4) |
| `FIREBASE_PROJECT_ID` | `medicareinspokane-prod` | Usually same as `GCP_PROJECT_ID` |
| `RUNTIME_SERVICE_ACCOUNT` | `cloud-run-runtime@medicareinspokane-prod.iam.gserviceaccount.com` | The runtime SA from §5 |
| `NEXT_PUBLIC_GTM_ID` | `GTM-XXXXXXX` | **Optional.** Leave unset to disable Google Tag Manager. |

### 1b. Authentication — pick ONE of these two options

The workflow can authenticate to GCP either way. **Option A is recommended** (no long-lived keys to leak).

**Option A: Workload Identity Federation (recommended, keyless)**

You'll set this up fully in §5d. For now just know you'll add **two more Variables**:
- `GCP_WORKLOAD_IDENTITY_PROVIDER` — full resource name, looks like `projects/123456789/locations/global/workloadIdentityPools/github-pool/providers/github-provider`
- `GCP_DEPLOY_SERVICE_ACCOUNT` — the deployer SA email, e.g. `github-deployer@medicareinspokane-prod.iam.gserviceaccount.com`

**Option B: Service-account JSON key (legacy, easier first time)**

Add **one Secret** (Secrets tab → "New repository secret"):
- `GCP_SERVICE_ACCOUNT_KEY` — the full JSON of a service-account key file (you'll create this in §5d)

> If you set the WIF variables, the workflow ignores the JSON key. If both are missing, the workflow fails. Pick one.

---

## 2. Enable Google Cloud APIs (3 min)

In Cloud Shell:

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  iamcredentials.googleapis.com \
  iam.googleapis.com \
  firestore.googleapis.com \
  compute.googleapis.com
```

What each one is for:
- `run` — Cloud Run itself.
- `artifactregistry` — stores your Docker images.
- `cloudbuild` — used implicitly by some `gcloud` flows.
- `iamcredentials` + `iam` — needed for Workload Identity Federation and impersonation.
- `firestore` — your `website_leads` collection lives here.
- `compute` — needed if you ever switch from Cloud Run domain mappings to a Load Balancer (optional, §6 alt path).

You should see `Operation "operations/..." finished successfully.` for each.

---

## 3. Artifact Registry setup (2 min)

This is where built Docker images get pushed.

```bash
gcloud artifacts repositories create web \
  --repository-format=docker \
  --location=REGION \
  --description="Container images for the medicare-spokane-site Next.js app"
```

If it says "already exists," that's fine — skip.

Verify:
```bash
gcloud artifacts repositories list --location=REGION
```
You should see a row with `web` and `DOCKER`.

> The repo name `web` is what you put in the `ARTIFACT_REGISTRY_REPO` GitHub variable in §1a. If you used a different name, update the GitHub variable to match.

---

## 4. Cloud Run beta service (and a placeholder prod service) (5 min)

You need **two** Cloud Run services so beta and prod never share a URL or env vars.

### 4a. Create the beta service

The first deploy from GitHub Actions will replace this image — we just need the service to exist so we can attach a domain mapping in §6.

```bash
gcloud run deploy medicare-spokane-site-beta \
  --image=us-docker.pkg.dev/cloudrun/container/hello \
  --region=REGION \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080
```

When it finishes, copy the `Service URL` it prints — it looks like `https://medicare-spokane-site-beta-abcdefg-uw.a.run.app`. Open it in a browser; you should see Google's "It's running!" hello page. That confirms the service is up.

### 4b. (Recommended) Create the production service the same way

```bash
gcloud run deploy medicare-spokane-site \
  --image=us-docker.pkg.dev/cloudrun/container/hello \
  --region=REGION \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080
```

You won't deploy real prod traffic until §9 — this is just so the service name exists.

---

## 5. Service accounts and IAM (10 min)

You need **two** service accounts:

| Purpose | Suggested name | What it can do |
|---|---|---|
| **Runtime** — the identity Cloud Run uses to call Firestore from inside the container | `cloud-run-runtime` | `roles/datastore.user` on Firestore |
| **Deployer** — the identity GitHub Actions uses to build/push images and update Cloud Run | `github-deployer` | Push to Artifact Registry, deploy Cloud Run, act as runtime SA |

### 5a. Create the runtime service account

```bash
gcloud iam service-accounts create cloud-run-runtime \
  --display-name="Cloud Run runtime SA (medicare-spokane-site)"
```

Grant it Firestore access:
```bash
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:cloud-run-runtime@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"
```

> `roles/datastore.user` is the right role for Firestore in Native mode (read + write documents, no admin). It's what `firebase-admin` needs to write to `website_leads`.

Put `cloud-run-runtime@PROJECT_ID.iam.gserviceaccount.com` into the `RUNTIME_SERVICE_ACCOUNT` GitHub variable from §1a.

### 5b. Create the deployer service account

```bash
gcloud iam service-accounts create github-deployer \
  --display-name="GitHub Actions deployer (medicare-spokane-site)"
```

Grant it the four roles it needs:
```bash
DEPLOYER="github-deployer@PROJECT_ID.iam.gserviceaccount.com"

# Push images to Artifact Registry
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:$DEPLOYER" \
  --role="roles/artifactregistry.writer"

# Deploy and update Cloud Run services
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:$DEPLOYER" \
  --role="roles/run.admin"

# Read project metadata (needed by deploy-cloudrun action)
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:$DEPLOYER" \
  --role="roles/iam.serviceAccountUser"
```

### 5c. Let the deployer "act as" the runtime SA

The deployer needs permission to attach the runtime SA to the Cloud Run service:
```bash
gcloud iam service-accounts add-iam-policy-binding \
  cloud-run-runtime@PROJECT_ID.iam.gserviceaccount.com \
  --member="serviceAccount:github-deployer@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

### 5d. Give GitHub Actions a way to authenticate as the deployer

Pick **one**:

#### Option A — Workload Identity Federation (recommended)

```bash
PROJECT_NUMBER=$(gcloud projects describe PROJECT_ID --format='value(projectNumber)')

# 1. Create a pool
gcloud iam workload-identity-pools create "github-pool" \
  --location="global" \
  --display-name="GitHub Actions pool"

# 2. Create a provider for github.com inside that pool
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub OIDC provider" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
  --attribute-condition="assertion.repository == 'DevonWest/medicare-spokane-site'"

# 3. Allow the GitHub repo to impersonate the deployer SA
gcloud iam service-accounts add-iam-policy-binding \
  github-deployer@PROJECT_ID.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository/DevonWest/medicare-spokane-site"
```

Now go back to GitHub → repo settings and add these two **Variables**:
- `GCP_WORKLOAD_IDENTITY_PROVIDER` = `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider`
- `GCP_DEPLOY_SERVICE_ACCOUNT` = `github-deployer@PROJECT_ID.iam.gserviceaccount.com`

(`PROJECT_NUMBER` is the numeric value `gcloud projects describe` printed.)

#### Option B — JSON key (faster but less secure)

```bash
gcloud iam service-accounts keys create /tmp/github-deployer.json \
  --iam-account=github-deployer@PROJECT_ID.iam.gserviceaccount.com
cat /tmp/github-deployer.json
```

Copy the **entire JSON output** (including the `{` and `}`) into a new GitHub **Secret** named `GCP_SERVICE_ACCOUNT_KEY`. Then **delete the file**:
```bash
rm /tmp/github-deployer.json
```

> Don't put this JSON in a Variable, in code, or in chat. Secret only.

---

## 6. Domain mapping for `beta.medicareinspokane.com` (10 min, plus DNS propagation wait)

We're using Cloud Run's built-in **custom domain mappings** — simpler than a full Load Balancer and free.

### 6a. Verify the apex domain (one-time, only if you've never done it for this Google account)

If this account has never added a custom domain to GCP for `medicareinspokane.com`, you'll need to verify domain ownership at https://search.google.com/search-console → Add Property → Domain → `medicareinspokane.com`. It will give you a `TXT` record to add at your DNS provider. Add it, click Verify, done. (Skip this if your account already owns the domain in Search Console.)

### 6b. Create the Cloud Run domain mapping

In the **Cloud Console**:
1. Go to **Cloud Run** → **Manage Custom Domains** (button at top of the services list).
2. Click **Add Mapping**.
3. **Service**: select `medicare-spokane-site-beta`.
4. **Domain**: enter `beta.medicareinspokane.com`.
5. Click **Continue**. It will show you a **CNAME** record to add — usually:
   ```
   beta   CNAME   ghs.googlehosted.com.
   ```

### 6c. Add the DNS record at your registrar

At your DNS provider (GoDaddy / Cloudflare / Namecheap / Google Domains / etc.):
- **Type:** CNAME
- **Name / Host:** `beta` (some providers want `beta.medicareinspokane.com` — both work)
- **Value / Target:** `ghs.googlehosted.com.` (include the trailing dot if the UI accepts it)
- **TTL:** 300 (5 min) for the first 24 hours, then bump to 3600 once you're stable
- **Cloudflare users only:** click the orange cloud to set the record to **DNS only** (grey cloud) for the initial setup. You can re-enable proxying later if you want, but Cloud Run's auto-issued cert needs DNS-only at first.

### 6d. Wait for the cert

Back in Cloud Run → Manage Custom Domains, the row for `beta.medicareinspokane.com` will progress through `Awaiting domain verification` → `Provisioning certificate` → `OK`. This usually takes 5–30 minutes but can take up to 24 hours. Refresh occasionally.

When it shows **OK**, `https://beta.medicareinspokane.com` will serve the placeholder hello page from §4a.

> **Skip the Load Balancer alternative unless you need it.** A global HTTPS Load Balancer + serverless NEG is only worth it if you want Cloud Armor / IAP / a single IP for multiple services. For one beta subdomain, domain mapping is correct.

---

## 7. Trigger the GitHub Actions deploy (2 min)

1. Go to **GitHub → your repo → Actions**.
2. In the left sidebar pick **Deploy to Cloud Run**.
3. Click **Run workflow** (right side).
4. Fill in:
   - **Branch:** `main`
   - **Target:** `beta`
5. Click **Run workflow**.

What happens:
- The `ci` job runs `npm ci`, `npm run lint`, `npm test`, `npm run build`. All must pass.
- The `deploy` job authenticates to GCP, builds a Docker image with build-args
  - `NEXT_PUBLIC_SITE_URL=https://beta.medicareinspokane.com`
  - `NEXT_PUBLIC_SITE_ENV=staging`
  - `NEXT_PUBLIC_GTM_ID=<value of your GitHub variable, or empty>`
- It pushes the image to `REGION-docker.pkg.dev/PROJECT_ID/web/site-beta:<commit-sha>`.
- It deploys that image to the `medicare-spokane-site-beta` Cloud Run service with the runtime SA attached and these env vars set:
  - `NEXT_PUBLIC_SITE_URL=https://beta.medicareinspokane.com`
  - `NEXT_PUBLIC_SITE_ENV=staging`
  - `NEXT_PUBLIC_GTM_ID=<same as above>`
  - `FIREBASE_PROJECT_ID=PROJECT_ID`
  - `NODE_ENV=production`

The workflow's last step prints the service URL. Total runtime: ~4–7 minutes.

> **If it fails, the error is in the job log.** Common causes: missing GitHub variable (read the `Validate target service variable is set` step), Artifact Registry repo doesn't exist (§3), or the deployer SA missing a role (§5b/c).

---

## 8. Verify beta after deploy (15 min)

Open `https://beta.medicareinspokane.com` and walk these checks. Anything that fails → fix before §9.

### 8a. Site is up and serving the new image
- [ ] Homepage loads, looks right, no console errors (DevTools → Console).
- [ ] `curl -sI https://beta.medicareinspokane.com/healthz` returns `HTTP/2 200`.

### 8b. Search engines are blocked (because `SITE_ENV=staging`)
- [ ] `curl -s https://beta.medicareinspokane.com/robots.txt` shows `Disallow: /` for `User-agent: *`.
- [ ] View source on the homepage → there's a `<meta name="robots" content="noindex,nofollow,...">` tag in `<head>`.
- [ ] **Critical** — if either of the above is missing, do not promote to prod. The build args were not threaded.

### 8c. Security headers are set
```bash
curl -sI https://beta.medicareinspokane.com/ | grep -iE 'strict-transport|x-frame|x-content-type|referrer-policy|permissions-policy|content-security-policy'
```
You should see HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, a Referrer-Policy, a Permissions-Policy, and a CSP. (The exact CSP is whatever Phase 5 set.)

### 8d. Lead form end-to-end
- [ ] Fill out the lead form on beta with **test data** (e.g. name "QA Test", a throwaway email, a fake phone like `509-555-0100`, ZIP `99201`).
- [ ] Submit. You see the success state.
- [ ] In Cloud Console → **Firestore** → `website_leads` collection: a new doc exists with your test data and a recent timestamp.
- [ ] In Cloud Console → **Cloud Run** → `medicare-spokane-site-beta` → **Logs**: no `ERROR` or `WARNING` lines for the request that submitted the lead.

### 8e. GTM tagging (only if you set `NEXT_PUBLIC_GTM_ID`)
- [ ] In Google Tag Manager, open **Preview** for `GTM-XXXXXXX`, point it at `https://beta.medicareinspokane.com`.
- [ ] Submit another test lead. In the Tag Assistant timeline you see a `generate_lead` event.
- [ ] Click that event → **Variables**. Confirm:
  - `site_env` is `"staging"`
  - **No** name, email, phone, or ZIP appears in the dataLayer payload (PII must not be in tags).

### 8f. Performance smoke test
- [ ] Run https://pagespeed.web.dev/ against `https://beta.medicareinspokane.com`. Mobile Performance ≥ 80 is the target. Anything red → investigate before prod.

If all of 8a–8f pass, beta is good.

---

## 9. Promote to production (5 min)

You only do this **after** all of §8 passes on beta.

### 9a. Map the production domain (one-time)

Repeat §6b–6d but for the prod service and prod hostname:
- **Service:** `medicare-spokane-site`
- **Domain:** `www.medicareinspokane.com` (and optionally `medicareinspokane.com` apex)
- DNS at registrar: `www CNAME ghs.googlehosted.com.` (apex needs A/AAAA records — Cloud Console will list the four IPs to use; some registrars don't support apex CNAME, in which case use the four A records)

### 9b. Deploy prod from GitHub Actions

1. **Actions** → **Deploy to Cloud Run** → **Run workflow**.
2. **Branch:** `main`
3. **Target:** `production`
4. **Run workflow.**

The image is rebuilt with `NEXT_PUBLIC_SITE_URL=https://www.medicareinspokane.com`, `NEXT_PUBLIC_SITE_ENV=production`, and your real GTM ID, then deployed to `medicare-spokane-site`.

### 9c. Verify prod (mirror of §8, but production-mode expectations)

- [ ] `https://www.medicareinspokane.com/healthz` → `200`.
- [ ] `https://www.medicareinspokane.com/robots.txt` → **does NOT** contain `Disallow: /` (it should be the production robots policy, allowing crawlers on real pages).
- [ ] View source on a page → **no** `noindex` meta tag.
- [ ] Submit a real-looking test lead → appears in Firestore `website_leads`, `generate_lead` event fires in real GTM with `site_env: "production"`.
- [ ] Security headers present (same `curl` as §8c).

### 9d. Tell Google about prod

- [ ] Google Search Console → add `https://www.medicareinspokane.com` as a property → submit `https://www.medicareinspokane.com/sitemap.xml`.
- [ ] (Optional) Google Business Profile → make sure the website link points to `https://www.medicareinspokane.com`.

You're live.

---

## Rollback (if §9c reveals a problem)

Cloud Run keeps every revision. To roll back instantly without rebuilding:

```bash
# List recent revisions
gcloud run revisions list --service=medicare-spokane-site --region=REGION

# Send 100% of traffic to the last known-good revision
gcloud run services update-traffic medicare-spokane-site \
  --region=REGION \
  --to-revisions=<previous-revision-name>=100
```

Then debug on beta (§7 with target `beta`), fix the issue on `main`, and re-run the prod deploy.

---

## Recurring deploys after this

After everything in §1–§6 is in place, every future change is just:
1. Merge to `main` (auto-deploys to **production** via the `push` trigger), **or**
2. **Actions → Deploy to Cloud Run → Run workflow → Target: beta** to test on beta first (recommended for any non-trivial change), then re-run with **Target: production** once beta passes §8.
