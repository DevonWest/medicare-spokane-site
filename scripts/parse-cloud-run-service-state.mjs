import { pathToFileURL } from "node:url";

const REVISION_PATTERN = /^[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const INGRESS_VALUES = new Map([
  ["all", "all"],
  ["INGRESS_TRAFFIC_ALL", "all"],
  ["internal", "internal"],
  ["INGRESS_TRAFFIC_INTERNAL_ONLY", "internal"],
  [
    "internal-and-cloud-load-balancing",
    "internal-and-cloud-load-balancing",
  ],
  [
    "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER",
    "internal-and-cloud-load-balancing",
  ],
]);

function parseExpectedRevision(args) {
  if (
    args.length !== 2 ||
    args[0] !== "--revision" ||
    !REVISION_PATTERN.test(args[1])
  ) {
    throw new Error(
      "Expected --revision followed by one valid Cloud Run revision name.",
    );
  }
  return args[1];
}

function parseIngress(payload) {
  const annotations = payload.metadata?.annotations;
  if (
    annotations !== undefined &&
    (!annotations || typeof annotations !== "object" || Array.isArray(annotations))
  ) {
    throw new Error("Cloud Run service annotations must be an object.");
  }

  const rawIngress =
    annotations?.["run.googleapis.com/ingress"] ??
    payload.ingress ??
    payload.spec?.ingress ??
    "all";
  const ingress = INGRESS_VALUES.get(rawIngress);
  if (!ingress) {
    throw new Error("Cloud Run service has an unsupported ingress setting.");
  }
  return { annotations: annotations ?? {}, ingress };
}

function parseDefaultUrlDisabled(payload, annotations) {
  const rawValue =
    annotations["run.googleapis.com/default-url-disabled"] ??
    payload.defaultUriDisabled ??
    payload.default_uri_disabled ??
    false;
  if (rawValue === true || rawValue === "true") {
    return true;
  }
  if (rawValue === false || rawValue === "false") {
    return false;
  }
  throw new Error("Cloud Run default URL state must be boolean.");
}

function parseServiceUrl(payload) {
  const rawUrl = payload.status?.url;
  if (rawUrl === undefined || rawUrl === null || rawUrl === "") {
    return null;
  }
  if (typeof rawUrl !== "string") {
    throw new Error("Cloud Run service URL must be a string.");
  }

  const url = new URL(rawUrl);
  if (
    url.protocol !== "https:" ||
    !url.hostname.endsWith(".run.app") ||
    url.pathname !== "/" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error("Cloud Run service URL is not a safe run.app origin.");
  }
  return url.origin;
}

function validateTraffic(payload, expectedRevision) {
  const traffic = payload.status?.traffic;
  if (!Array.isArray(traffic)) {
    throw new Error("Cloud Run service traffic must be an array.");
  }

  const positiveTargets = [];
  for (const target of traffic) {
    if (!target || typeof target !== "object" || Array.isArray(target)) {
      throw new Error("Cloud Run service traffic targets must be objects.");
    }
    const percent = target.percent ?? 0;
    if (
      !Number.isInteger(percent) ||
      percent < 0 ||
      percent > 100
    ) {
      throw new Error("Cloud Run service traffic percent is invalid.");
    }
    if (percent > 0) {
      positiveTargets.push({
        percent,
        revisionName: target.revisionName,
      });
    }
  }

  if (
    positiveTargets.length !== 1 ||
    positiveTargets[0].percent !== 100 ||
    positiveTargets[0].revisionName !== expectedRevision
  ) {
    throw new Error(
      "Cloud Run service does not route exactly 100% of traffic to the expected revision.",
    );
  }
}

export function parseCloudRunServiceState(payload, expectedRevision) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Cloud Run service response must be a JSON object.");
  }
  if (!REVISION_PATTERN.test(expectedRevision)) {
    throw new Error("Expected Cloud Run revision name is invalid.");
  }

  validateTraffic(payload, expectedRevision);
  const { annotations, ingress } = parseIngress(payload);
  const defaultUrlDisabled = parseDefaultUrlDisabled(payload, annotations);
  const directUrl = parseServiceUrl(payload);

  if (defaultUrlDisabled) {
    return {
      directPublic: false,
      directReason: "default-url-disabled",
      directUrl,
    };
  }
  if (ingress === "internal") {
    return {
      directPublic: false,
      directReason: "ingress-internal",
      directUrl,
    };
  }
  if (ingress === "internal-and-cloud-load-balancing") {
    return {
      directPublic: false,
      directReason: "ingress-internal-and-cloud-load-balancing",
      directUrl,
    };
  }
  if (!directUrl) {
    return {
      directPublic: false,
      directReason: "default-url-unavailable",
      directUrl: null,
    };
  }
  return {
    directPublic: true,
    directReason: "public",
    directUrl,
  };
}

export function formatCloudRunServiceState(state) {
  return [
    `direct_public=${state.directPublic ? "true" : "false"}`,
    `direct_url=${state.directUrl ?? ""}`,
    `direct_reason=${state.directReason}`,
  ].join("\n");
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  const expectedRevision = parseExpectedRevision(process.argv.slice(2));
  const source = await readStdin();
  if (!source.trim()) {
    throw new Error("Cloud Run service response was empty.");
  }
  const state = parseCloudRunServiceState(JSON.parse(source), expectedRevision);
  process.stdout.write(`${formatCloudRunServiceState(state)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    const message =
      error instanceof Error
        ? error.message
        : "Cloud Run service-state parsing failed.";
    process.stderr.write(`${message.replace(/[\r\n]+/g, " ").slice(0, 240)}\n`);
    process.exitCode = 1;
  });
}
