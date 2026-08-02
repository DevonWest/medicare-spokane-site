# Knowledge CMS AI Content & SEO Copilot

## Purpose

The copilot preserves the speed of managing content with an AI collaborator
while the CMS preserves ownership, sources, revisions, review evidence, and
publishing authority. It is an admin-only private workspace at
`/admin/knowledge/copilot`.

This first release provides one end-to-end system:

- deterministic checks of public HTML, canonicals, robots, sitemap, health,
  CMS completeness, source freshness, and editorial-review currency;
- two stable 28-day Search Console page/query periods, ending three days ago,
  for CTR, position, decline, and striking-distance opportunities;
- OpenAI web research and strict JSON-schema responses for site strategy,
  complete new article drafts, and improvements to an existing article;
- a stored proposal with sources and a before-apply preview;
- private history for recent scans and actor-owned AI proposals;
- complete working-revision proposals for published articles without
  unpublishing or mutating the published CMS record;
- one separately confirmed promotion that preserves the exact published CMS
  revision as an immutable snapshot and opens the proposal as a private draft;
- follow-up refinement that carries the prior proposal into a new, separately
  stored AI run;
- per-run token and web-search usage evidence plus enforced output and request
  timeout ceilings;
- one explicit confirmation that can only create or update a private draft;
  and
- a secret-protected endpoint for recurring scans.

No AI action can submit for review, approve, publish, enable indexing, alter a
public route, access leads, or process CRM data. Do not enter client names,
health details, prescriptions, contact details, or other sensitive personal
information in the copilot prompt.

## Provider decision

OpenAI is the primary provider because this workflow depends on structured
Responses API output, web search, and the same conversational drafting model
used during site development. `KnowledgeCmsAiProvider` is an internal adapter,
so a Vertex implementation can be added later without changing CMS records,
the review UI, or the draft-application boundary.

The API call uses `store: false` and a one-way hashed safety identifier. OpenAI
states that API data is not used to train models by default; review the current
[OpenAI API data controls](https://developers.openai.com/api/docs/guides/your-data)
before activation. The implementation uses the
[Responses API](https://developers.openai.com/api/docs/guides/migrate-to-responses),
[structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs),
and [web search](https://developers.openai.com/api/docs/guides/tools-web-search).

Routine work defaults to `gpt-5.6-terra`; an administrator can select deeper
research, which defaults to `gpt-5.6-sol`. Both model IDs are runtime variables
so a model change does not require a code change.

## Evidence and safety boundaries

Strategy research may inspect competitor search results to identify intent and
content gaps. It cannot produce an applyable draft. Medicare article drafts
restrict web search and stored factual sources to:

- Medicare.gov and CMS.gov;
- SSA.gov, Healthcare.gov, and HHS.gov;
- Washington HCA and Office of the Insurance Commissioner; and
- MedicareInSpokane.com first-party pages.

Every AI result is untrusted editorial input. The server reparses it, enforces
field limits, HTTPS sources, source review dates, slugs, canonical paths, and
the task-specific draft rule. Applying a proposal uses the normal CMS workflow
and expected revision. A changed or non-draft target fails closed.

Published articles are intentionally different. Generating and refining a
proposal performs no CMS mutation. A separate confirmation may then start one
private working revision only while the effective public renderer is static.
That transaction verifies the exact published revision, preserves its full CMS
record in `knowledge_cms_article_revision_snapshots`, removes the private search
projection, blocks indexing, keeps the slug and canonical path unchanged, and
opens the proposal as a normal draft. The verified static website page remains
unchanged. The draft must still be submitted, reviewed, approved, and published
through the existing governed workflow. Stale proposals, route changes, an
existing working revision, or active CMS public routing fail closed.

OpenAI responses have explicit output ceilings (16,000 routine and 24,000 deep
tokens by default), one SDK retry, and a three-minute request timeout. Each saved
run records input, cached-input, output, reasoning, and total tokens plus the
number of web-search calls. It stores no API key, provider response ID, actor
identity in the transmitted editorial context, or raw provider envelope.
Follow-up refinements preserve the earlier proposal as evidence and create a new
run rather than rewriting history.

Continuous execution runs only the deterministic/Search Console scan. It does
not spend AI tokens or silently generate content. An administrator chooses when
to ask the AI to turn current evidence into a strategy or draft.

## Activation order

Search Console, AI, and continuous scanning default to `false`. The manual
deterministic scanner follows the private CMS gate when its own repository
variable is unset; explicit `false` keeps it disabled. Merge and deployment
alone do not activate a paid or scheduled integration.

1. Deploy with all four new gates false and confirm `/healthz` plus the
   existing CMS still work.
2. The manual deterministic scanner follows the private CMS gate when
   `KNOWLEDGE_CMS_SEO_ENABLED` is unset. Deploy beta, run one manual scan, and
   inspect the technical/CMS findings. Set the variable explicitly to `false`
   at any time to retain the kill switch.
3. Enable the Search Console API, grant the runtime service account property
   access, and set `KNOWLEDGE_CMS_SEARCH_CONSOLE_ENABLED=true`. In the copilot,
   run **Verify live connections**; it performs one read-only, one-row
   analytics query and must report Search Console as verified.
4. Put the OpenAI key in Secret Manager, configure the repository secret-name
   variable, and set `KNOWLEDGE_CMS_AI_ENABLED=true`. Run **Verify live
   connections** again; it retrieves metadata for both configured models
   without sending a prompt or making a generation request. Then test site
   strategy on beta and one new private draft before applying anything.
5. Create the scheduler token secret and job, then set both Search Console and
   `KNOWLEDGE_CMS_CONTINUOUS_SEO_ENABLED=true`. Deploy and immediately rerun
   **Verify live connections** so current evidence binds the scheduler token
   state and exact deployment configuration before the first scheduled call.
6. Repeat the checks on production. The public renderer and cutover gates are
   independent and remain unchanged.

The copilot page separates configuration readiness from live verification. The
live result records only sanitized states, environment, origin, and timestamps;
it omits secret values, service-account IDs, actor IDs, tokens, and the internal
configuration fingerprint. Search Console is checked with read-only analytics,
and OpenAI access is checked with model metadata only. Evidence is bound to the
exact environment/configuration and expires after 35 days.

Every Cloud Run revision uses `/healthz` for startup and liveness probes. The
deploy workflow installs the latest SDK available through the maintained Google
action and verifies both supported probe flags before building an image, so an
incompatible runner cannot fail only after the image has been pushed.
For a traffic-serving deployment, the workflow first smoke-tests the exact
container image, creates a uniquely named no-traffic revision, and waits for
that exact revision to report ready. It then assigns 100% of traffic to the
revision by name, verifies the exact commit through Cloud Run's service URL,
resolved directly from the service rather than a deployment-action traffic
alias, and only then retries the public beta or production route. Both responses
must report the deployment environment and a valid renderer configuration. The
service URL is printed even if public DNS or certificate verification fails.
This keeps a green build, image push, stale `LATEST` alias, healthy but
unpromoted revision, or missing custom domain from being mistaken for a
successful public rollout.

## GitHub and Cloud Run configuration

Repository variables:

| Name | Example |
|---|---|
| `KNOWLEDGE_CMS_SEO_ENABLED` | `true` |
| `KNOWLEDGE_CMS_SEARCH_CONSOLE_ENABLED` | `true` |
| `SEARCH_CONSOLE_SITE_URL` | `sc-domain:medicareinspokane.com` |
| `KNOWLEDGE_CMS_AI_ENABLED` | `true` |
| `KNOWLEDGE_CMS_AI_MODEL` | `gpt-5.6-terra` |
| `KNOWLEDGE_CMS_AI_DEEP_MODEL` | `gpt-5.6-sol` |
| `KNOWLEDGE_CMS_AI_MAX_OUTPUT_TOKENS` | `16000` |
| `KNOWLEDGE_CMS_AI_DEEP_MAX_OUTPUT_TOKENS` | `24000` |
| `KNOWLEDGE_CMS_AI_TIMEOUT_MS` | `180000` |
| `OPENAI_API_KEY_SECRET` | `knowledge-cms-openai-api-key` |
| `KNOWLEDGE_CMS_CONTINUOUS_SEO_ENABLED` | `true` |
| `KNOWLEDGE_CMS_SEO_CRON_TOKEN_SECRET` | `knowledge-cms-seo-cron-token` |

`OPENAI_API_KEY_SECRET` and `KNOWLEDGE_CMS_SEO_CRON_TOKEN_SECRET` are Secret
Manager secret names, not secret values. The deploy workflow attaches their
latest versions to Cloud Run as `OPENAI_API_KEY` and
`KNOWLEDGE_CMS_SEO_CRON_TOKEN`. The deployer needs permission to bind the
secrets, and the runtime service account needs `Secret Manager Secret
Accessor` on these two secrets.

Example secret creation (enter the values without committing them):

```bash
gcloud services enable secretmanager.googleapis.com

printf '%s' "$OPENAI_KEY_VALUE" | \
  gcloud secrets create knowledge-cms-openai-api-key --data-file=-

printf '%s' "$SEO_CRON_TOKEN_VALUE" | \
  gcloud secrets create knowledge-cms-seo-cron-token --data-file=-
```

Use a randomly generated scheduler token of at least 32 characters. Do not
reuse the OpenAI key, Firebase credentials, or a user password.

## Search Console access

Enable the API in the same GCP project used by the Cloud Run service:

```bash
gcloud services enable searchconsole.googleapis.com
```

In Search Console, open the `medicareinspokane.com` domain property, then add
the Cloud Run runtime service-account email as a user with read access. The
client uses Application Default Credentials and the read-only
`webmasters.readonly` scope; no downloaded JSON key is needed. Google documents
the [Search Analytics query](https://developers.google.com/webmaster-tools/v1/searchanalytics/query)
and [service-account authorization](https://developers.google.com/webmaster-tools/v1/how-tos/authorizing).

The first verified scan should show:

- Search Console status `available`;
- a current and previous 28-day period;
- nonnegative clicks/impressions; and
- prioritized query/page findings when thresholds are met.

Zero rows are valid for a new/low-volume property. `access_denied`,
`site_not_found`, and `quota_exceeded` remain visible as sanitized status codes
without leaking credentials.

## Recurring scan

Create a Cloud Scheduler HTTP job that sends `POST` to:

`https://www.medicareinspokane.com/api/knowledge-cms/seo-scan`

Send the same Secret Manager token as either:

- `Authorization: Bearer <token>`; or
- `x-knowledge-cms-seo-token: <token>`.

A weekly schedule is a good initial cadence because Search Console data is not
real time and Medicare content should not be churned daily. Deployment refuses
continuous SEO unless Search Console is enabled. The endpoint returns 404
unless the CMS, SEO, and continuous-scan gates are all exact `true`; an invalid
token returns 401; missing, expired, or configuration-mismatched live evidence
returns 503 `activation_unverified`. If the configured Search Console request
fails, the evidence scan is retained but the endpoint returns 503
`search_console_unavailable` so Scheduler can alert instead of silently
degrading. Success returns only the scan ID, time, and issue counts.

## Operational verification

After each environment is activated:

1. Confirm `/healthz`, `/robots.txt`, and `/sitemap.xml` return 200.
2. Sign in with the admin CMS account and open **AI & SEO Copilot**.
3. Run **Verify live connections** and confirm the result is current for the
   exact environment/origin. Verify Search Console and both OpenAI models when
   their gates are enabled.
4. Run a fresh scan and verify the configured origin matches that environment.
5. Confirm beta `noindex` does not appear as a production defect.
6. Generate site strategy and confirm it has no **Apply** control.
7. Generate one article proposal; inspect its Markdown, metadata, and every
   source URL.
8. Apply it and confirm the destination record is `draft`, indexing is
   blocked, and no public route changed.
9. Select one published article and confirm generation leaves the published
   record unchanged. Review the result, explicitly start its private working
   revision, and confirm the prior published CMS record exists as an immutable
   snapshot while the current record is an indexing-blocked draft on the same
   route. Confirm the static public page is unchanged.
10. Refine another proposal once and confirm both runs remain separately available
   in AI proposal history.
11. Confirm recent manual and scheduled evidence scans appear in scan history.
12. Submit/review/publish only through the existing governed CMS workflow.

## Disable and rollback

The controls are independent and fail closed:

1. Set `KNOWLEDGE_CMS_CONTINUOUS_SEO_ENABLED=false` to stop scheduled writes.
2. Set `KNOWLEDGE_CMS_AI_ENABLED=false` to remove generation/application
   authority while preserving prior proposals and drafts.
3. Set `KNOWLEDGE_CMS_SEARCH_CONSOLE_ENABLED=false` to keep deterministic
   scans without search data.
4. Set `KNOWLEDGE_CMS_SEO_ENABLED=false` to disable the workbench scanners.
5. Revoke or rotate either secret if it may have been exposed.

Disabling these features does not delete scans, proposals, CMS records, audit
events, public pages, or Search Console data. It does not alter the public
renderer mode or cutover decision.
