# Local Medicare search improvements, September 5, 2026

The September 5 request prioritizes Medicare plans, Medicare Advantage, Medicare Supplement, and Part D in Spokane and nearby communities, including Stevens County. Use the existing category URLs; do not introduce alternate keyword URLs for the same content.

| Search intent | Primary destination |
| --- | --- |
| Medicare plans Spokane / Medicare Spokane | `/medicare-spokane` |
| Medicare Advantage plans Spokane | `/medicare-advantage` |
| Medicare Supplement plans Spokane / Medigap Spokane | `/medicare-supplements` |
| Medicare Part D plans Spokane / prescription drug plans | `/medicare-part-d` |
| Medicare plans Stevens County / Colville / Chewelah | `/medicare-stevens-county` |
| Medicare Annual Enrollment Spokane | `/medicare-annual-enrollment-spokane` |

## Baseline

Authenticated Search Console, Web, August 6–September 2, 2026:

- Site: 77 clicks and 8,516 impressions. This is all site traffic, not traffic from the target keywords alone.
- `/medicare-spokane`: 2 clicks, 603 impressions, average position 53.8 across its queries, from the CMS's saved page report.
- Exact query `medicare spokane`: 0 clicks, 35 impressions, position 20.1.
- Exact query `medicare advantage plans spokane`: 0 clicks, 17 impressions, position 40.3.
- Exact query `medicare advantage spokane`: 0 clicks, 2 impressions, position 62.5.
- These query figures come from a regional regex filter in Search Console. That filter also matched agency-business FMO queries; those are not consumer targets and must be excluded from conclusions about Medicare shopper demand.
- Advantage and Part D were confirmed indexed September 4 after indexing requests. Lack of earlier impressions does not measure the potential demand for those pages. Query tables exclude some anonymized searches and do not represent total local search volume.

## Changes

- Give the Spokane hub a plan-focused title, H1, coverage comparison, links to local provider guides, and an AEP preparation section.
- Add a single substantive Stevens County guide. Distinguish home-county eligibility from travel to Spokane for care; identify Colville and Chewelah facilities only as providers to verify. The agency office remains in Spokane.
- Add visible plan-guide navigation on the homepage and on existing plan, AEP, and provider-network guides. CMS article records, approval history, and routing controls are unchanged; navigation is maintained in the shared page template.
- Link Stevens County from resources, relevant northern community pages, the footer, and plan navigation; include its canonical URL in the sitemap and track its lead source.
- Expand exact index/performance monitoring to 25 URLs, including all four priority destinations, Stevens County, Spokane Valley, Deer Park, Mead, and the comparison guide.
- Give the materially changed Spokane hub and new county page an observation window through September 19 before reacting to short-term search results.

## Next evaluation

The existing Monday scan and post-deployment scan are the recurring monitor. Compare clicks, impressions, CTR, and query-to-page matching for the destinations above. Use Search Console's Web results and matched periods, not personalized signed-in search rankings. Check lead submissions and calls alongside clicks; do not submit test leads to production.

September 19 is an initial directional check. A full 28-day window after September 5 provides a stronger comparison, with AEP seasonality noted. Do not repeatedly rename newly indexed pages or request indexing again without a material change or a diagnosed issue.

As the coming year's official plan materials become available around October 1, review the existing 2027 market-update hub and AEP guidance against the actual plans and provider directories. Do not relabel 2026 premiums, benefits, or networks as 2027. AEP runs October 15–December 7; Medigap has separate rules.

Further local visibility work: keep the real Google Business Profile complete, list actual services, maintain accurate office hours and contact details, and invite honest reviews without incentives or filtering. Relevant community links and referrals can support discovery. Website content does not remove Google's distance factor in map results.

## Sources checked for this work

- [Google: Search Essentials](https://developers.google.com/search/docs/essentials)
- [Google: descriptive, crawlable links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
- [Google: local ranking factors](https://support.google.com/business/answer/7091?hl=en)
- [Medicare: Original Medicare and Medicare Advantage](https://www.medicare.gov/basics/get-started-with-medicare/get-more-coverage/your-coverage-options/compare-original-medicare-medicare-advantage)
- [Medicare: Medigap coverage](https://www.medicare.gov/health-drug-plans/medigap/basics/coverage)
- [Medicare: Open Enrollment](https://www.medicare.gov/health-drug-plans/open-enrollment)
- [Providence: Mount Carmel Hospital](https://www.providence.org/locations/wa/mount-carmel-hospital)
- [Providence: St. Joseph's Hospital](https://www.providence.org/locations/wa/st-josephs-hospital)
