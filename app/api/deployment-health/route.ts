// Public deployment-verification alias.
//
// Cloud Run's container probes continue to use /healthz. External rollout
// verification uses this distinct path so a platform-edge response for the
// conventional probe path cannot be mistaken for an unhealthy application.
export { GET } from "../../healthz/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
