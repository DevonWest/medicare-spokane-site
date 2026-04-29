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

```bash
# Build Docker image
docker build -t medicare-spokane-site .

# Run locally
docker run -p 3000:3000 medicare-spokane-site

# Push to Google Artifact Registry and deploy to Cloud Run
gcloud run deploy medicare-spokane-site \
  --image=REGION-docker.pkg.dev/PROJECT/REPO/medicare-spokane-site \
  --platform=managed \
  --region=us-west1 \
  --allow-unauthenticated
```

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
| `PORT` | Port the server listens on (Cloud Run) | `3000` |
| `LEADS_COLLECTION` | Firestore collection for lead documents | `website_leads` |
| `FIREBASE_PROJECT_ID` | GCP project that owns the Firestore database | _required for lead capture_ |
| `FIREBASE_CLIENT_EMAIL` | Service-account client email (admin SDK) | _required if not using ADC_ |
| `FIREBASE_PRIVATE_KEY` | Service-account private key. Newlines may be escaped as `\n` — they are unescaped at runtime. **Server-only — never expose to the client.** | _required if not using ADC_ |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to a service-account JSON. Used as a fallback when the three vars above are not set. | _optional_ |

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
