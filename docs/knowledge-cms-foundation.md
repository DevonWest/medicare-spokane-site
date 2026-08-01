# Knowledge CMS foundation

This foundation adds the server-side data model and workflow boundary for
editable Medicare educational records. It remains disabled by default. The
existing Resource Library stays static unless the complete guarded-cutover
configuration, current immutable approval, and per-request evidence all pass.

## Safety boundary

- `KNOWLEDGE_CMS_ENABLED` is server-only and accepts only the exact value
  `true`.
- `KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE` is server-only and defaults to
  `static`. Exact `shadow` enables only authenticated comparison. Exact
  `cutover` remains inert unless the CMS gate, independent cutover gate,
  current 64-character approval receipt, exact deployment identity, and all
  execution-off invariants pass together.
- `KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_EXECUTION_ENABLED` is a separate,
  beta-only admin gate for two atomic writes: one immutable seven-day approval
  and one audit event. It never deploys or moves traffic.
- `KNOWLEDGE_CMS_PUBLIC_CUTOVER_ENABLED` is the independent final routing gate.
  It is rejected while any record, artifact, or approval executor is enabled.
- `KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED` is a separate,
  default-off server-only gate. Exact `true` is accepted only with the CMS
  enabled and exact private `shadow` mode; it can create one immutable
  rendering artifact and one audit event per transaction.
- The data-access and workflow modules use `server-only`.
- The private `/admin/knowledge` surface returns 404 while the flag is off.
- Enabling the flag exposes only the noindex admin sign-in route; CMS data
  still requires a verified Firebase session and an explicit CMS role.
- Existing public route modules and shared components are regression-tested not
  to import the CMS renderer.
- New records begin as drafts and are blocked from indexing.
- Publishing a record does not make the existing site render it.
- Every routed request revalidates the current approval, article revision, and
  immutable rendering artifact. Missing, stale, contradictory, invalid, timed
  out, or unavailable evidence serves the verified local static snapshot.

Keep the flag false until the authentication and role-assignment prerequisites
below are complete.

## Firestore collections

| Collection | Purpose |
|---|---|
| `knowledge_articles` | Long-form educational records |
| `knowledge_topics` | Reusable topic and category records |
| `knowledge_faqs` | Reusable question-and-answer records |
| `knowledge_cms_article_renderings` | Immutable, revision-bound lossless article rendering artifacts |
| `knowledge_search_documents` | Published-record search projections |
| `knowledge_cms_slugs` | Transactional, per-record-kind slug locks |
| `knowledge_cms_canonical_paths` | Transactional, cross-kind canonical-path locks |
| `knowledge_cms_audit_events` | Append-only lifecycle audit events |
| `knowledge_cms_cutover_approvals` | Immutable, expiring approvals binding all 45 records and 22 route artifacts |

The repository writes the canonical record, slug lock, canonical-path lock,
search projection, and audit event in one Firestore transaction. Updates
require the caller's expected revision, preventing a stale editor from
silently overwriting newer work.

No composite index is required by the current repository implementation.

## Workflow

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> InReview: Submit
    InReview --> Draft: Request changes
    InReview --> Approved: Verified review
    Approved --> Published: Publisher approval
    Published --> Draft: Unpublish
    Draft --> Archived: Archive
    InReview --> Archived: Archive
    Approved --> Archived: Archive
    Published --> Archived: Archive
    Archived --> Draft: Restore
```

Articles and FAQs need at least one current source before review. Source review
windows cannot exceed 180 days. An approval requires an authenticated reviewer
with an active licensed-agent verification, and its review window cannot exceed
365 days. Verification is checked again at publication. One verified account
may author, review, approve, and publish a record, but approval and publication
remain separate revision-bound actions with separate required decision notes.

Submitting uses the latest saved revision and clears any prior active change
request. Requesting changes requires a current, unambiguous licensed-reviewer
verification plus non-empty feedback. The returned draft exposes only the
feedback and request time to the editor; the canonical reviewer verification
and the same feedback remain in the governed record and append-only audit
event.

Published records create a search projection. Draft, review, approved,
archived, and unpublished records remove it. A publisher must explicitly
choose whether a published record is eligible for indexing; eligibility also
requires a canonical path and an exact confirmation of that approved path.
Publish and unpublish both require an audited decision note. Unpublishing
atomically deletes the search projection, blocks indexing, clears the expired
approval, and returns the record to draft.

## Permission model

| Role | Allowed responsibilities |
|---|---|
| Author | Create records; edit and submit their own drafts |
| Editor | Create, edit, and submit any draft |
| Reviewer | Approve or request changes, including on records they own |
| Publisher | Publish, unpublish, archive, and restore |
| Admin | Administrative authority across the private editorial workflow |

The model separates authentication from authorization. Firebase custom claims
assign the roles, but the server reads the current Firebase user on every
request instead of trusting claims supplied by a form or browser state.

## Private editorial workspace

`/admin/knowledge` supports:

- Google sign-in through Firebase Auth;
- an eight-hour HTTP-only, SameSite=Strict session cookie;
- list and read views for authenticated CMS users;
- private draft creation for authors, editors, and admins;
- draft editing under the workflow's owner and role rules;
- current-revision checks that stop stale tabs from overwriting newer edits;
- submit-for-review controls for authorized draft owners and editors;
- request-changes controls for verified reviewers, with required feedback
  visible on the returned draft;
- verified approval controls for reviewers, with a required private decision
  note and a server-calculated review deadline
  bounded by source, reviewer-verification, and policy dates;
- publisher-only publish controls with a required audit note, a deliberate
  blocked-or-eligible indexing decision, exact canonical confirmation for
  eligibility, and a separate revision-bound publication action;
- publisher-only unpublish controls that require a reason and atomically
  remove the search projection before returning the record to draft;
- safe DTOs that omit canonical ownership and audit internals from client
  components;
- articles, topics, FAQs, relationships, source records, search terms, and
  future discoverability metadata; and
- a publisher/admin-only Resource Library migration preview that reads all
  three CMS collections, maps the static registry into deterministic target
  IDs, and reports source, slug, canonical, relationship, and existing-record
  conflicts without creating or changing a record; and
- a deterministic route-parity manifest for all 22 article targets that pins
  the exported page metadata, canonical and Open Graph values, H1, rendered
  byte count, page-specific structured-data types, form/FAQ counts, and the
  SHA-256 of each server-rendered route body; and
- an immutable, deterministic private-draft control record for every article
  target, including fail-if-present semantics, server-owned actor/audit field
  requirements, a canonical SHA-256 fingerprint, and an explicit zero-write
  execution block; and
- a versioned lossless-renderer contract for every article route that maps
  required React capabilities to CMS-native artifact evidence, plus a
  route-specific verified-static rollback; and
- a publisher/admin-only `/admin/knowledge/shadow-preview` workspace that is
  available only in exact `shadow` mode, reads the article and immutable
  rendering-artifact collections, reconstructs successful candidates without
  importing a legacy page module, compares them with the 22 immutable
  contracts, and always reports a preview write count of zero.

Session exchange requires a sign-in from the preceding five minutes. Every
read and mutation verifies the Firebase session with revocation checking and
reloads the current user record, so disabled accounts and role removals take
effect without trusting stale browser claims. Session endpoints require an
exact same-origin request.

The migration preview and its dry-run receipts remain non-mutating and always
report a write count of zero. Displayed article controls are immutable
representations rather than stored Firestore documents. A separate exact-true
gate exposes the one-record execution form described below; a dry-run receipt
is evidence only and is never accepted as write authority. Article route bodies
and metadata retain explicit, test-enforced parity snapshots. The editable CMS
Markdown body remains an editorial record and is never rendered publicly. The
revision-bound CMS-native artifact preserves the current React output, forms,
FAQ disclosures, relationship cards, structured data, and governed registries.
Its private parity receipt cannot authorize public routing; that requires the
separate all-record cutover approval and complete runtime gate.

This release intentionally has no bulk migration, overwrite, automatic
indexing, automatic deployment, or traffic-movement path. The record and
artifact mutations remain separately gated, explicitly confirmed one-record
transactions. Ordinary CMS publication writes the governed record and search
projection but does not add a route, sitemap entry, public card, schema block,
or visible content to the existing site. Only the independent guarded-cutover
configuration can route the 22 already-governed canonical paths.

## Authentication rollout prerequisites

Before changing `KNOWLEDGE_CMS_ENABLED` to `true`:

1. Enable Google as a Firebase Authentication provider.
2. Add the production and intended non-production hosts to Firebase Auth's
   authorized domains.
3. Supply `NEXT_PUBLIC_FIREBASE_API_KEY`,
   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, and
   `NEXT_PUBLIC_FIREBASE_PROJECT_ID` at build time. The deployment workflow
   reads the API key and Auth domain from GitHub repository variables and uses
   `FIREBASE_PROJECT_ID` for the public project ID.
4. Confirm the browser and Admin SDK use the same Firebase project.
5. Assign each approved user a `knowledgeCmsRoles` custom claim containing only
   `author`, `editor`, `reviewer`, `publisher`, or `admin`.
6. Optionally assign `knowledgeCmsAgentSlug` only when it matches a verified
   agent authority record.
7. Verify the Cloud Run service account can access the CMS Firestore
   collections and has `firebaseauth.users.get` plus
   `firebaseauth.users.createSession`. The Auth `users.get` permission covers
   the aggregate, identity-suppressed user listing used by readiness. Prefer a
   custom least-privilege role; `roles/firebaseauth.admin` also contains both
   but grants broader Auth administration.
8. Test sign-in, unauthorized access, author ownership, and a revision conflict
   in a non-production environment.

The deployment workflow treats `KNOWLEDGE_CMS_ENABLED` as `false` when the
repository variable is absent. If that variable is set to `true`, deployment
fails before building unless the Firebase browser API key and Auth domain
variables are present.

The workflow treats `KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE` as `static` when the
repository variable is absent. Exact `shadow` is deployable only as a private
comparison mode and requires the CMS authentication boundary to be useful.
`cutover`, whitespace-padded, differently cased, and other malformed values
fail before image build. The existing static routes remain the only public
source in both accepted modes.

The workflow treats
`KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED` as `false` when absent.
Exact `true` additionally requires `KNOWLEDGE_CMS_ENABLED=true` and
`KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE=shadow`; malformed, cutover, and partially
enabled combinations fail before image build.

Example custom-claim shape:

```json
{
  "knowledgeCmsRoles": ["author", "editor"],
  "knowledgeCmsAgentSlug": "verified-agent-slug"
}
```

Role assignment remains an operator-controlled Firebase Admin task. The
browser never receives a way to assign or elevate roles.

## Not included in this release

- Automatic beta or production activation
- Automatic production traffic movement
- Editable Markdown as a public article body
- Hosted search service or embeddings
- Bulk, overwrite, update, publish, or indexing migration executors
- Firebase role-assignment tooling
- Changes to public titles, headings, canonicals, redirects, or sitemap URLs

## Migration preview contract

`/admin/knowledge/migration-preview` is available only when the CMS flag is
enabled and the current verified Firebase user has a `publisher` or `admin`
role. It:

- maps 22 Resource Library entries to article targets;
- maps six library categories and six Medicare topics to topic targets;
- maps the 11 governed FAQs and their factual-source lineage;
- preserves current canonical paths, curated relationships, entities, source
  check dates, and source review deadlines;
- compares proposed IDs, per-kind slugs, canonical paths, governed content,
  and relationships with existing CMS records;
- recognizes equivalent topic and FAQ records without proposing an overwrite;
- verifies all 22 article route bodies and metadata against deterministic
  snapshots;
- defines and fingerprints all 22 create-private-draft article controls while
  leaving their execution disabled;
- compiles those controls into authenticated, server-clocked, zero-write
  materialization receipts against the current Firestore inventory; and
- defines immutable CMS-native rendering controls for all 22 article routes
  while keeping public routing independently gated and disabled.

The preview does not claim the migration is executable. `readyToExecute` is
always false, `writeCount` is always zero, and the page contains no mutation
control. The parity manifest deliberately excludes the homepage and
`/medicare-spokane`.

## Article migration control-record contract

Each of the 22 article targets has a versioned control record that:

- uses the deterministic `resource-entry--*` document ID and canonical slug;
- carries the exact title, summary, metadata, sources, relationships, and
  indexing-blocked discoverability needed for a future private draft;
- contains a private Markdown control note that names the verified static
  route and rendered SHA-256 and explicitly states that it is not the public
  page body;
- excludes `ownerId`, audit timestamps, review, and publication fields so a
  future server boundary must resolve the authenticated actor and server
  clock;
- requires `expectedRevision=null` and fails if the target record already
  exists rather than overwriting it;
- is canonically serialized with recursively sorted object keys and pinned by
  a SHA-256 fingerprint; and
- reports `status=disabled`, `readyToExecute=false`, `writeCount=0`,
  `indexing=blocked`, `cmsBodyPubliclyRendered=false`, and
  `cutoverEligible=false`.

The control record is a reviewable creation contract only. No browser request
can submit its payload, no repository method accepts a client-supplied control,
and no control record is stored. The separately gated execution boundary
accepts only its ID and fingerprint, then reconstructs and revalidates the
complete control on the server inside the transaction.

## Article materialization dry-run contract

The authenticated migration preview also performs a non-mutating dry run for
the 22 article controls. On each request it:

- resolves the current Firebase actor again on the server and permits only a
  `publisher` or `admin`;
- uses one server-clock timestamp for the owner and revision-one audit fields;
- reads the same complete article, topic, and FAQ inventory used by the
  migration preview and confirms whether every create-only article target is
  currently absent;
- blocks a target when its document already exists or a current record owns
  its slug or canonical path;
- revalidates the deterministic control fingerprint and compiles a
  schema-valid, indexing-blocked private draft in memory only when those
  preconditions pass; and
- fingerprints each receipt and the complete batch so the control, observed
  state, actor, timestamp, and in-memory result are bound together.

The observation is not a lock and every receipt requires a transactional
recheck. `readyToExecute` remains false, execution eligibility and write count
remain zero, and the receipt itself is never submitted to a Server Action or
repository. Reloading the page performs a fresh read and creates new
timestamped receipts; it does not store them. The separate execution form uses
only the immutable control ID/fingerprint and performs an independent
transactional validation.

## Single-article private-draft execution contract

`KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED` is a separate server-only,
exact-`true` gate and cannot be enabled by the deployment workflow unless
`KNOWLEDGE_CMS_ENABLED=true`. When both gates are enabled, a publisher or admin
may create one Resource Library article draft from the private migration page
only after typing the exact control-specific confirmation phrase.

The Server Action accepts only the selected control ID, its SHA-256, and the
typed phrase. The mutation DAL reloads the current authenticated actor, and
the Firestore transaction reconstructs the control from the immutable static
registry, revalidates its fingerprint, supplies one transaction server-clock
timestamp, and fails closed unless all of the following remain absent or
available:

- the expected-absent article document;
- the per-kind slug lock and any legacy same-slug article;
- the cross-kind canonical-path lock and any legacy canonical owner;
- the target's private search projection; and
- the revision-one append-only audit event.

One successful execution creates four Firestore documents atomically: the
private article draft, slug lock, canonical-path lock, and revision-one audit
event. The draft stays indexing-blocked, has no review or publication state,
and contains only the private migration control note. The writer has no update,
overwrite, bulk, public-render, sitemap, indexing, or cutover behavior. The
existing verified React route remains the public source.

The revision-one audit event also stores the execution version, expected write
count, canonical path, and SHA-256 of the exact server-materialized record.
Executions created by the immediately preceding release remain readable as
legacy events; they are verified directly against their current artifacts and
are never silently upgraded or rewritten.

## Topic and FAQ private-draft execution contract

All 12 topic targets and 11 FAQ targets have deterministic SHA-256 controls
derived from the governed static registries. Controls contain complete
schema-valid private-draft payloads but omit owner and audit fields, remain
zero-write and non-executable, and keep indexing and public rendering blocked.

`KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED` is a separate
server-only, exact-`true` gate. A publisher or admin must type the exact
kind-and-slug phrase for one selected control. The server reloads the actor,
reconstructs and verifies the control, and transactionally rechecks the target
document, same-kind slug ownership, optional cross-kind canonical ownership,
absent search projection, and absent revision-one audit event. A target without
a canonical creates three atomic documents; a routed topic creates four. Each
execution redirects to a fresh four- or five-artifact, zero-write receipt.

The supporting-record boundary has no bulk, retry, overwrite, update,
publication, indexing, public-render, cutover, or production behavior. Its
append-only history is separate from article migration evidence, and rollback
disables both migration execution gates plus the rendering-artifact gate before
restoring static renderer mode.

## Execution history and post-create verification contract

The publisher/admin migration workspace reads authenticated execution history
from `migration_create_private_draft` audit events only. It validates the
document ID, actor, record identity, timestamp, control ID/fingerprint, static
public-source marker, and optional current-version evidence before exposing a
row. Malformed audit documents are counted but excluded from actionable
history. History is sorted newest first, limited to 100 valid events, and uses
one audit-collection read with zero writes.

Each valid row opens a private per-record verification route. The route
re-resolves the Firebase actor and again requires `publisher` or `admin`, then
uses a read-only Firestore transaction to obtain one consistent snapshot of
exactly five artifacts:

- the append-only revision-one migration audit event;
- the current article record;
- the current per-kind slug lock;
- the current cross-kind canonical-path lock; and
- the current search projection or its confirmed absence.

For an untouched revision-one draft, the verifier rematerializes the record
from the deterministic control, actor, and execution timestamp and requires an
exact SHA-256 match. For a legitimately edited later revision, it reports
`record_advanced` only when the original creation provenance and all current
locks/search state remain internally consistent. Missing, malformed, stale, or
contradictory evidence reports `failed`; verification never repairs, retries,
publishes, indexes, or changes a record. The receipt itself is timestamped and
fingerprinted but not stored. A successful create redirects to this fresh
verification view instead of treating the transaction response as sufficient
proof.

## Operational readiness report contract

`/admin/knowledge/readiness` is available only when the CMS gate is exact true,
the Firebase session is current, and the server-refreshed actor has `publisher`
or `admin`. Authorization is checked before any report read. The route is
covered by the private admin noindex/noarchive/no-store headers and never enters
the public sitemap.

The report evaluates separate capabilities rather than collapsing unlike
risks into one ambiguous status:

- private workspace configuration and Firebase browser/Admin project alignment;
- aggregate authoring, currently verified reviewer, and publisher coverage;
- one-record article migration readiness or verified completion;
- one-record topic/FAQ migration readiness or verified completion;
- complete 45-record migration readiness and deterministic operator order;
- private shadow availability while the effective public renderer stays
  `static`; and
- a fail-closed public-cutover status that remains prohibited until the
  separate fresh shadow approval and runtime gates are completed.

The Auth scan paginates up to 1,000 accounts per read and returns counts only.
It does not expose UIDs, email addresses, claims, or account records. Malformed
claims, incomplete pagination, duplicate users, missing list permission, no
current licensed reviewer, or no publisher fail closed. Disabled or
unverified accounts with CMS claims are reported but cannot count as active
coverage.

The Firestore portion reuses the three-collection migration inventory and two
separate execution-history queries: articles and supporting topic/FAQ records.
Each valid event receives its current four- or five-artifact read-only
verification transaction. A target is classified as `prepared_absent` only when
its deterministic control, source/route evidence, and absence checks pass with
no execution event; articles also require their verified in-memory materialized
draft receipt. A present target is ready only when exactly one valid event and
one current passing artifact receipt agree. Invalid, missing, duplicate, or
truncated history, stale sources, unexpected targets, contradictory locks or
search projections, and failed receipts block readiness.

The same immutable report emits a 45-step operator plan ordered topics, FAQs,
then articles. Each prepared step names only its existing one-record gate and
expected three- or four-document create boundary. Verified records become
read-only verification steps; contradictions become blocked steps. The plan
sets `executionAuthorized=false`, exposes no bulk action, performs zero writes,
and requires a completely fresh readiness report after every separately typed
and confirmed transaction.

Every report is immutable and SHA-256 fingerprinted in memory. It records its
successful read boundary and always reports zero writes and no repair. The
receipt is operational evidence only: it cannot assign roles, change a flag,
authorize a migration request, publish a record, enable indexing, or approve a
public renderer.

## Beta activation preview and rollback contract

`/admin/knowledge/beta-activation` is a publisher/admin-only, read-only planning
surface. It is covered by the same authentication, noindex/noarchive, and
private no-store boundary as the rest of the admin workspace. The preview
performs no additional repository read beyond obtaining a fresh operational
readiness report and performs no write, repair, role assignment, deployment,
traffic shift, environment-variable change, or CMS action.

The preview is eligible only when all of the following are true:

- `NEXT_PUBLIC_SITE_ENV` is exact `staging`;
- `NEXT_PUBLIC_SITE_URL` resolves to the clean canonical origin
  `https://beta.medicareinspokane.com` with no credentials, path, query, or
  fragment;
- the operational-readiness receipt is valid, no more than five minutes old,
  not future-dated, and ready for guarded private operations;
- all 22 article, 12 topic, and 11 FAQ targets have prepared or verified
  one-record evidence with no blocked target;
- the current renderer request is exact `static` or `shadow`; and
- the proposed exact `shadow` value continues to resolve to an effective public
  mode of `static`, with CMS bodies, indexing, sitemap output, and cutover
  unchanged.

Production, unknown hosts, malformed or whitespace-padded environment values,
invalid or stale receipts, `cutover`, and contradictory migration evidence fail
closed. Raw malformed URLs are classified rather than reflected, so accidental
credentials or query values do not enter the preview receipt or UI.

The immutable preview binds the current readiness SHA-256 and shows—but never
applies—the five beta-only settings:

| Variable | Proposed private-beta value | Effect |
|---|---|---|
| `KNOWLEDGE_CMS_ENABLED` | `true` | Keep the authenticated private workspace available |
| `KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED` | `true` until all article targets are verified; otherwise `false` | Preserve only the explicit one-record migration boundary |
| `KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED` | `true` until all topic/FAQ targets are verified; otherwise `false` | Preserve only the separate one-record supporting migration boundary |
| `KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED` | `true` while current article revisions need immutable rendering artifacts | Preserve only the one-artifact private-shadow boundary |
| `KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE` | `shadow` | Enable private comparison while public output remains static |

The activation checklist requires new readiness/preview receipts immediately
before a separately approved beta configuration change, one isolated beta
revision, private authorization checks, and complete static-route parity. The
preview explicitly carries no execution, deployment, production, or cutover
authority.

Rollback triggers include evidence drift, authorization failure, any private
shadow mismatch, a migration-boundary violation, protected-route drift, or an
SEO/indexing change. The ordered rollback is:

1. set both beta one-record execution gates to `false`;
2. set the beta renderer mode to `static` while preserving CMS records;
3. deploy only the beta rollback configuration and verify static parity;
4. set the beta CMS gate to `false` if the broader private workspace remains
   unsafe; and
5. route only beta traffic to its last known-good beta revision if configuration
   rollback is insufficient.

Rollback never deletes CMS records, locks, audit history, or evidence. It must
reverify all 22 governed routes, `/`, `/medicare-spokane`, `/resources`,
redirects, sitemap output, and the beta robots policy.

## Lossless renderer and rollback contract

Every one of the 22 article routes has a contract that:

- binds the future CMS article to its current path, canonical URL, static
  source module, body SHA-256, and route-parity manifest version;
- requires exact preservation of the existing React component tree, related
  content, structured data, lead forms, FAQ disclosures, and any governed FAQ
  or carrier registry used by that route;
- requires an exact candidate match for title, description, canonical and Open
  Graph values, H1, schema types, form count, FAQ count, rendered byte count,
  and rendered SHA-256;
- allows private shadow comparison and a guarded public candidate only through
  a CMS-owned immutable rendering artifact after the matching governed
  published article, complete migration, approval, and runtime gates pass;
  keeps the editable Markdown field non-public; and
- defines a no-write rollback to the current static route while preserving CMS
  records for diagnosis or correction.

`KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE` has three reserved states:

| Mode | Contract meaning in this release | Public source |
|---|---|---|
| `static` | Default; private shadow workspace is hidden | Existing static route |
| `shadow` | Enables authenticated publisher/admin comparison only | Existing static route |
| `cutover` | Routes the 22 governed paths only with the complete exact gate and a current approval | Verified CMS artifact, otherwise per-request static fallback |

Invalid, whitespace-padded, and differently cased values cannot activate the
renderer. Exact `shadow` sets `privateShadowEnabled=true` while the resolver's
effective public mode remains `static`. Exact `cutover` alone is insufficient:
the independent gate, receipt, environment identity, and all execution-off
values must also be exact.

The shadow workspace:

- requires exact `KNOWLEDGE_CMS_ENABLED=true` and renderer mode `shadow`;
- requires a current verified Firebase session with `publisher` or `admin`;
- reads `knowledge_articles` and `knowledge_cms_article_renderings` and performs
  no save, transition, create, audit, search-projection, or migration write;
- requires the matching record to be published, current, reviewed, sourced,
  canonical-path matched, and metadata matched before comparison;
- decodes the exact-hash CMS artifact and reconstructs its React nodes through
  the server-only lossless renderer in an inert admin-only container; the
  candidate code has no import of the legacy page module;
- exposes only minimal comparison evidence, not CMS ownership or audit
  internals; and
- emits a fingerprinted all-22 beta parity receipt only when every current
  article revision and artifact passes in exact `shadow` mode; the receipt has
  no execution or public-routing authority by itself; and
- leaves CMS content non-public until a separate immutable cutover approval is
  created and its receipt is supplied to the complete runtime gate.

## CMS-native rendering-artifact execution contract

The generated rendering manifest captures each verified static React route as
deterministic gzip/base64 UTF-8 markup. Generation stops if the bytes or
SHA-256 differ from route parity. Each zero-write control binds that body,
metadata, canonical/Open Graph values, preservation requirements, article ID,
and expected-absent artifact ID to its own SHA-256 fingerprint.

With exact `KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED=true`, a
publisher or admin may type the exact article-specific phrase to create one
artifact. The transaction rereads the matching published article, requires the
confirmed current revision and current governance evidence, then requires both
the artifact and its audit event to be absent. Success creates exactly two
documents atomically: the immutable rendering artifact and append-only audit
event. There is no update, overwrite, delete, bulk, indexing, sitemap, public
render, or cutover path.

Stored bodies are accepted only when their compressed envelope, decoded byte
count, SHA-256, H1, schema types, form count, FAQ count, metadata, control
fingerprint, article ID, and article revision all match. Executable scripts,
event-handler attributes, JavaScript URLs, frames, objects, embeds, and base
elements fail closed. Artifact IDs include the ten-digit article revision. A
later publication retains the prior immutable artifact as history and requires
a new expected-absent artifact for the current revision; nothing is silently
repaired or overwritten.

Rollback triggers are candidate unavailability, render error, parity,
metadata, canonical, capability, or protected-route mismatch. The contract
requires the verified static source and snapshot for every route, sets the
global mode back to `static`, performs no CMS data mutation, and keeps `/` and
`/medicare-spokane` outside the renderer inventory.

## Guarded public cutover and rollback contract

`/admin/knowledge/public-cutover` is a publisher/admin-only preview. It rereads
the operational report and private shadow evidence and is eligible only when
all 45 governed records—22 articles, 12 topics and 11 FAQs—are verified, all 22
current revision artifacts pass exact parity, all three record/artifact
executors are disabled, the renderer is still private `shadow`, and both
evidence sets are no more than five minutes old. The preview is zero-write and
cannot change a variable, deploy a revision, or move traffic.

An administrator may create the approval only on the exact beta deployment
while the separate approval-execution gate is exact `true`. The server repeats
all preview checks, requires the receipt-specific typed phrase, then rereads the
22 articles and 22 artifacts in one transaction. Success writes only the
immutable approval and append-only audit event. The approval binds the 45-record
completion receipt, all-22 shadow receipt, route paths, article revisions,
artifact fingerprints, rendered hashes, canonicals, and a seven-day validity
window. It is not itself deployment or traffic authority.

Runtime routing requires all of these values together:

- exact CMS enablement, exact renderer mode `cutover`, and exact cutover gate
  `true`;
- the matching 64-character lowercase approval receipt;
- approval, article, supporting-record, and rendering-artifact execution gates
  all exact `false`; and
- exact beta or production environment identity and canonical origin.

Only the 22 contract paths are rewritten to the internal dynamic renderer.
`/`, `/medicare-spokane`, `/resources`, redirects, sitemap output, and all
other routes remain on their existing implementation. Direct requests to
`/cms-render/*` return a private no-store 404 and are disallowed by the
production robots policy.

For each governed request the renderer has a 1.5-second total evidence budget.
It rereads and validates the approval, current published article, immutable
artifact, review/source currency, canonical, metadata, revision, fingerprint,
and exact lossless parity. A missing, expired, stale, malformed, contradictory,
unavailable, timed-out, or render-failed candidate returns the build-generated
verified static snapshot with unchanged metadata. Each outcome emits a
structured `knowledge_cms_public_renderer` event containing the route, outcome,
reason, elapsed time, and—only for verified candidates—revision and artifact ID.

Static HTML is not treated as sufficient for form-bearing pages. The 20
governed routes with a lead form replace the verified form shell with the real
`LeadForm` client component through an entry-specific adapter. Tests require
every route whose parity snapshot contains a form to have exactly one adapter,
and require the adapter's server render to retain the exact immutable body hash
and byte count. This preserves validation, submission, attribution, success,
and conversion behavior instead of serving an inert visual copy.

Beta is the mandatory canary. A production cutover workflow creates a tagged
Cloud Run revision with `--no-traffic`; moving traffic is a separate reviewed
operator action after tagged-revision verification. Rollback order is:

1. route traffic to the last known-good static revision;
2. set `KNOWLEDGE_CMS_PUBLIC_CUTOVER_ENABLED=false`;
3. restore `KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE=static` and redeploy;
4. verify all 22 governed routes plus `/`, `/medicare-spokane`, `/resources`,
   redirects, sitemap, robots, canonicals, and security headers; and
5. preserve every CMS record, lock, artifact, approval, and audit event for
   diagnosis.

No merge or ordinary deployment activates cutover: the gates default to false,
the approval receipt defaults empty, production starts with no traffic, and the
workflow contains no traffic-shift command.
