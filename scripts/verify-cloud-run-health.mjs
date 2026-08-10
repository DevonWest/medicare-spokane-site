import { pathToFileURL } from "node:url";

const COMMIT_SHA_PATTERN = /^[0-9a-f]{40}$/;
const TARGETS = new Set(["beta", "production"]);
const HEALTH_PATHS = new Set(["/healthz", "/api/deployment-health"]);

function integerOption(name, value, minimum, maximum) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${name} must be an integer from ${minimum} through ${maximum}.`);
  }
  return parsed;
}

export function parseDeploymentHealthArguments(args) {
  const values = new Map();
  for (let index = 0; index < args.length; index += 2) {
    const name = args[index];
    const value = args[index + 1];
    if (!name?.startsWith("--") || value === undefined || value.startsWith("--")) {
      throw new Error("Deployment health arguments must be --name value pairs.");
    }
    if (values.has(name)) {
      throw new Error(`Deployment health argument ${name} was provided more than once.`);
    }
    values.set(name, value);
  }

  const allowed = new Set([
    "--url",
    "--commit",
    "--target",
    "--attempts",
    "--delay-ms",
    "--timeout-ms",
  ]);
  for (const name of values.keys()) {
    if (!allowed.has(name)) {
      throw new Error(`Unknown deployment health argument ${name}.`);
    }
  }

  const url = new URL(values.get("--url") ?? "");
  const loopbackHttp =
    url.protocol === "http:" &&
    (url.hostname === "127.0.0.1" || url.hostname === "localhost");
  if (
    (url.protocol !== "https:" && !loopbackHttp) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "Deployment health URL must be credential-free HTTPS or loopback HTTP.",
    );
  }
  if (!HEALTH_PATHS.has(url.pathname)) {
    throw new Error(
      "Deployment health URL must target /healthz or /api/deployment-health.",
    );
  }

  const expectedCommitSha = (values.get("--commit") ?? "").toLowerCase();
  if (!COMMIT_SHA_PATTERN.test(expectedCommitSha)) {
    throw new Error("Deployment commit must be a 40-character hexadecimal SHA.");
  }

  const expectedTarget = values.get("--target") ?? "";
  if (!TARGETS.has(expectedTarget)) {
    throw new Error("Deployment target must be beta or production.");
  }

  return {
    url,
    expectedCommitSha,
    expectedTarget,
    attempts: integerOption("--attempts", values.get("--attempts") ?? "24", 1, 60),
    delayMs: integerOption("--delay-ms", values.get("--delay-ms") ?? "5000", 0, 30000),
    timeoutMs: integerOption("--timeout-ms", values.get("--timeout-ms") ?? "10000", 1000, 30000),
  };
}

export function validateDeploymentHealthPayload(
  payload,
  { expectedCommitSha, expectedTarget },
) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Health response was not a JSON object.");
  }
  if (payload.status !== "ok") {
    throw new Error("Health response did not report status ok.");
  }
  if (payload.deployment?.commitSha !== expectedCommitSha) {
    throw new Error("Health response did not match the deployed commit.");
  }
  const renderer = payload.knowledgeCmsPublicRenderer;
  if (!renderer || typeof renderer !== "object") {
    throw new Error("Health response omitted the renderer state.");
  }
  if (renderer.environment !== expectedTarget) {
    throw new Error("Health response did not match the deployment target.");
  }
  if (renderer.configurationValid !== true) {
    throw new Error("Health response reported an invalid renderer configuration.");
  }
}

export function cleanFailureReason(error) {
  if (error instanceof Error) {
    if (error.name === "AbortError" || error.name === "TimeoutError") {
      return "request timed out";
    }
    const cause =
      error.cause && typeof error.cause === "object" ? error.cause : undefined;
    const causeCode =
      cause && "code" in cause && typeof cause.code === "string"
        ? cause.code
        : undefined;
    if (causeCode === "ENOTFOUND" || causeCode === "EAI_AGAIN") {
      return "DNS name could not be resolved";
    }
    if (causeCode === "ECONNREFUSED") {
      return "connection was refused";
    }
    if (causeCode === "ECONNRESET") {
      return "connection was reset";
    }
    if (
      causeCode === "CERT_HAS_EXPIRED" ||
      causeCode === "DEPTH_ZERO_SELF_SIGNED_CERT" ||
      causeCode === "ERR_TLS_CERT_ALTNAME_INVALID" ||
      causeCode === "UNABLE_TO_VERIFY_LEAF_SIGNATURE"
    ) {
      return "TLS certificate validation failed";
    }
    return error.message.replace(/[\r\n]+/g, " ").slice(0, 240);
  }
  return "request failed";
}

export async function verifyDeploymentHealth(options, dependencies = {}) {
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const sleepImpl = dependencies.sleepImpl ?? ((delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs)));
  let lastError;

  for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
    try {
      const response = await fetchImpl(options.url, {
        cache: "no-store",
        headers: { accept: "application/json" },
        redirect: "follow",
        signal: AbortSignal.timeout(options.timeoutMs),
      });
      if (!response.ok) {
        throw new Error(`health endpoint returned HTTP ${response.status}`);
      }
      const payload = await response.json();
      validateDeploymentHealthPayload(payload, options);
      process.stdout.write(
        `Verified ${options.expectedTarget} deployment ${options.expectedCommitSha}.\n`,
      );
      return;
    } catch (error) {
      lastError = error;
      const reason = cleanFailureReason(error);
      process.stderr.write(
        `Deployment health attempt ${attempt}/${options.attempts} failed: ${reason}.\n`,
      );
      if (attempt < options.attempts) {
        await sleepImpl(options.delayMs);
      }
    }
  }

  throw new Error(
    `Deployment health verification failed after ${options.attempts} attempts: ${cleanFailureReason(lastError)}.`,
  );
}

async function main() {
  const options = parseDeploymentHealthArguments(process.argv.slice(2));
  await verifyDeploymentHealth(options);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${cleanFailureReason(error)}\n`);
    process.exitCode = 1;
  });
}
