import { readFileSync } from "node:fs";

const receiptPattern = /^[a-f0-9]{64}$/;
const entryIdPattern = /^[a-z0-9][a-z0-9-]*$/;

function fail(message) {
  console.error(`Knowledge CMS rollout configuration error: ${message}`);
  process.exit(1);
}

const configPath = process.argv[2];
if (!configPath) fail("a configuration path is required");

let config;
try {
  config = JSON.parse(readFileSync(configPath, "utf8"));
} catch {
  fail("the configuration file must contain valid JSON");
}

if (!config || typeof config !== "object" || Array.isArray(config)) {
  fail("the configuration root must be an object");
}

const phase = config.phase;
const approvalReceipt = config.approvalReceipt ?? "";
const routes = config.routes ?? [];
if (!["static", "artifacts", "approval", "cutover"].includes(phase)) {
  fail('phase must be exactly "static", "artifacts", "approval", or "cutover"');
}
if (typeof approvalReceipt !== "string") {
  fail("approvalReceipt must be a string");
}
if (
  !Array.isArray(routes) ||
  routes.some((entryId) =>
    typeof entryId !== "string" || !entryIdPattern.test(entryId)
  ) ||
  new Set(routes).size !== routes.length
) {
  fail("routes must contain unique governed entry IDs");
}

if (phase !== "cutover" && (approvalReceipt !== "" || routes.length > 0)) {
  fail("only cutover may include an approval receipt or routes");
}
if (
  phase === "cutover" &&
  (!receiptPattern.test(approvalReceipt) || routes.length === 0)
) {
  fail("cutover requires a lowercase 64-character receipt and at least one route");
}

const values = phase === "artifacts"
  ? {
      KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED: "true",
      KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE: "shadow",
      KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_EXECUTION_ENABLED: "false",
      KNOWLEDGE_CMS_PUBLIC_CUTOVER_ENABLED: "false",
      KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_RECEIPT: "",
      KNOWLEDGE_CMS_PUBLIC_CUTOVER_ROUTES: "",
    }
  : phase === "approval"
  ? {
      KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED: "false",
      KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE: "shadow",
      KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_EXECUTION_ENABLED: "true",
      KNOWLEDGE_CMS_PUBLIC_CUTOVER_ENABLED: "false",
      KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_RECEIPT: "",
      KNOWLEDGE_CMS_PUBLIC_CUTOVER_ROUTES: "",
    }
  : phase === "cutover"
    ? {
        KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED: "false",
        KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE: "cutover",
        KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_EXECUTION_ENABLED: "false",
        KNOWLEDGE_CMS_PUBLIC_CUTOVER_ENABLED: "true",
        KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_RECEIPT: approvalReceipt,
        KNOWLEDGE_CMS_PUBLIC_CUTOVER_ROUTES: routes.join(","),
      }
    : {
        KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED: "false",
        KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE: "static",
        KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_EXECUTION_ENABLED: "false",
        KNOWLEDGE_CMS_PUBLIC_CUTOVER_ENABLED: "false",
        KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_RECEIPT: "",
        KNOWLEDGE_CMS_PUBLIC_CUTOVER_ROUTES: "",
      };

for (const [key, value] of Object.entries(values)) {
  process.stdout.write(`${key}=${value}\n`);
}
