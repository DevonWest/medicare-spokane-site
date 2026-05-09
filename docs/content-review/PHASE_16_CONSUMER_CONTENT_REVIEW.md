# Phase 16 Consumer Content Review

## Page groups reviewed

- Homepage and conversion pages currently present: homepage, contact/request-contact redirect, compare Medicare options, plan review, prescription review, appointment checklist, review flow pages.
- Core Medicare pages currently present: Medicare Advantage, Medicare Supplements, Medicare Part D, Advantage vs. Supplement, enrollment resources, FAQ, local Medicare pages.
- Local content templates currently present: `LocalMedicarePage`, city data, ZIP pages, and topic pages.
- Resource-style pages currently present: turning 65, working past 65, helping a parent, resources, carriers, supplemental insurance.
- Referenced Phase 16 groups not present in this repo: `content/blog`, `content/videos`, state Medicare template files, `/free-help`, `/getbestplan`, `/thank-you`, `/medicare`, `/medicare-supplement`, `/part-d`, and `/turning-65` canonical page paths.

## Major consumer-language issues found

- Some public labels used internal/compliance wording such as “Compliance note.”
- Some copy used stronger-than-needed marketing language around “best,” “cost savings,” “free,” “broad provider access,” or plan fit.
- Some resource CTAs and descriptions used guide/system-style phrasing rather than direct consumer next steps.

## Template language fixed

- Replaced repeated local page/resource phrasing with clearer consumer wording.
- Tightened topic page content so Medicare Advantage, Medicare Supplement, and Part D descriptions are more accurate and less promotional.
- Kept required plan availability and non-affiliation disclosures intact.

## Pages/content files changed

- `app/carriers/page.tsx`
- `app/compare-medicare-options/page.tsx`
- `app/contact/page.tsx`
- `app/medicare-advantage-vs-supplement-spokane/page.tsx`
- `app/medicare-appointment-checklist/page.tsx`
- `app/medicare-part-d/page.tsx`
- `app/medicare-supplements/page.tsx`
- `app/resources/page.tsx`
- `app/supplemental-insurance/page.tsx`
- `app/topics/[topic]/page.tsx`
- `app/turning-65-medicare-spokane/page.tsx`
- `components/LeadForm.tsx`
- `lib/cities.ts`
- `lib/topics.ts`
- `lib/utm.ts`
- `tests/contentQuality.test.ts`
- `tests/leadSubmission.test.ts`
- `package.json`

## Medicare accuracy issues fixed

- Medicare Advantage copy now more clearly says benefits, networks, costs, and drug coverage vary by plan and ZIP code.
- Part D copy now emphasizes formularies, pharmacy networks, tiers, and costs vary by plan.
- Medigap copy now avoids implying uniformly low costs and states that what a policy pays depends on the plan letter.
- Medicare Advantage vs. Supplement language now avoids “better” framing and clarifies that neither coverage path is right for everyone.
- Supplemental insurance copy now avoids implying ancillary policies fill every gap or always reduce budget impact.

## Phrases removed or replaced

- “Compliance note” → “Important Medicare information”
- “best for my prescriptions” → “fits my prescriptions”
- “no single ‘best’ plan” → “no single right plan for everyone”
- “cost savings” → plan-specific costs vary by plan and ZIP code
- “free of charge” / “free Medicare review” → “no-cost”
- “broad provider access” → “access to Medicare-accepting providers nationwide”
- “Use these guides” / “Read Guide” → “Review these pages” / “Read More”

## Remaining pages needing manual human review

- Blog, video, and state-template pages could not be reviewed because those directories/files are not present in this repository.
- The requested alternate routes (`/free-help`, `/getbestplan`, `/thank-you`, `/medicare`, `/medicare-supplement`, `/part-d`, `/turning-65`) are not present and may need product/SEO routing decisions outside this content cleanup.
- A human reviewer should verify carrier counts, represented products, office details, and no-cost consultation language remain current.

## Factual claims that need source verification

- Current representation disclosure: “8 organizations which offer 75 products” should be periodically verified against the agency’s current carrier/product contracts.
- Medicare factual anchors should remain aligned with Medicare.gov/CMS guidance for Medicare Advantage, Medigap, Part D, and enrollment periods.
- Local provider, pharmacy, office, and service-area details should be periodically verified by the business owner.

## Validation/checks added

- Added `npm run content:validate` to flag internal-facing public content phrases such as “broad education,” “content strategy,” “thin content,” “indexable,” “SEO,” “template,” “visitors,” “conversion,” “CRM,” “lead routing,” “local plan details,” “category-level education,” “without overpromising,” “compliance reminder,” and “compliance note.”
- Added `npm run typecheck` and `npm run sitemap:check` scripts so the requested validation commands are available.
