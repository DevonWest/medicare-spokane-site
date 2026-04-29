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
