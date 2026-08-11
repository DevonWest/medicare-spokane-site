# Knowledge CMS production-only cutover

The Knowledge CMS does not require or use a beta hostname. The only public
target is `https://www.medicareinspokane.com`.

## Deployment sequence

1. Deploy the production image with `KNOWLEDGE_CMS_PUBLIC_CUTOVER_ENABLED=false`
   and `KNOWLEDGE_CMS_PUBLIC_CUTOVER_ROUTES` empty. Every governed route keeps
   using its checked-in static page.
2. Generate a fresh production cutover approval from the authenticated admin
   workspace after operational readiness and private shadow verification pass.
3. Set the matching approval receipt, enable cutover, and select one or more
   governed entry IDs in `KNOWLEDGE_CMS_PUBLIC_CUTOVER_ROUTES`.
4. The workflow deploys a no-traffic revision of the production service. It
   verifies health and every selected CMS route on the tagged revision before
   moving production traffic.
5. After promotion, the workflow repeats health and selected-route checks on
   the canonical production hostname.
6. Add further entry IDs in small batches until all approved routes are live.

## Route-level rollback

Remove a failing entry ID from `KNOWLEDGE_CMS_PUBLIC_CUTOVER_ROUTES` and deploy.
That route immediately returns to its checked-in static page while other
selected routes remain CMS-rendered. To roll back the entire CMS renderer, set
`KNOWLEDGE_CMS_PUBLIC_CUTOVER_ENABLED=false`, clear the route list, and set
`KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE=static`. CMS records and audit evidence are
preserved.

The renderer fails closed per request. Missing, stale, invalid, or mismatched
approval, article, revision, or artifact evidence serves the static fallback.
