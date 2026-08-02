import { resolveCname } from "node:dns/promises";
import { pathToFileURL } from "node:url";

const HOSTNAME_PATTERN =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

function normalizeHostname(value) {
  return value.trim().toLowerCase().replace(/\.$/, "");
}

function integerOption(name, value, minimum, maximum) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(
      `${name} must be an integer from ${minimum} through ${maximum}.`,
    );
  }
  return parsed;
}

export function parseDeploymentDnsArguments(args) {
  const values = new Map();
  for (let index = 0; index < args.length; index += 2) {
    const name = args[index];
    const value = args[index + 1];
    if (!name?.startsWith("--") || value === undefined || value.startsWith("--")) {
      throw new Error("Deployment DNS arguments must be --name value pairs.");
    }
    if (values.has(name)) {
      throw new Error(
        `Deployment DNS argument ${name} was provided more than once.`,
      );
    }
    values.set(name, value);
  }

  const allowed = new Set([
    "--hostname",
    "--expected-cname",
    "--attempts",
    "--delay-ms",
  ]);
  for (const name of values.keys()) {
    if (!allowed.has(name)) {
      throw new Error(`Unknown deployment DNS argument ${name}.`);
    }
  }

  const hostname = normalizeHostname(values.get("--hostname") ?? "");
  const expectedCname = normalizeHostname(
    values.get("--expected-cname") ?? "",
  );
  if (!HOSTNAME_PATTERN.test(hostname)) {
    throw new Error("Deployment hostname is invalid.");
  }
  if (!HOSTNAME_PATTERN.test(expectedCname)) {
    throw new Error("Expected deployment CNAME is invalid.");
  }

  return {
    hostname,
    expectedCname,
    attempts: integerOption(
      "--attempts",
      values.get("--attempts") ?? "6",
      1,
      20,
    ),
    delayMs: integerOption(
      "--delay-ms",
      values.get("--delay-ms") ?? "5000",
      0,
      30000,
    ),
  };
}

function cleanDnsError(error) {
  if (error && typeof error === "object" && "code" in error) {
    if (error.code === "ENOTFOUND" || error.code === "ENODATA") {
      return "DNS name does not have a CNAME record";
    }
    if (error.code === "ETIMEOUT" || error.code === "ESERVFAIL") {
      return "DNS resolver was temporarily unavailable";
    }
  }
  if (error instanceof Error) {
    return error.message.replace(/[\r\n]+/g, " ").slice(0, 240);
  }
  return "DNS lookup failed";
}

export async function verifyDeploymentDns(options, dependencies = {}) {
  const resolveCnameImpl = dependencies.resolveCnameImpl ?? resolveCname;
  const sleepImpl =
    dependencies.sleepImpl ??
    ((delayMs) =>
      new Promise((resolve) => {
        setTimeout(resolve, delayMs);
      }));
  let lastReason = "DNS lookup failed";

  for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
    try {
      const records = await resolveCnameImpl(options.hostname);
      const normalized = records.map(normalizeHostname);
      if (normalized.includes(options.expectedCname)) {
        process.stdout.write(
          `Verified DNS ${options.hostname} -> ${options.expectedCname}.\n`,
        );
        return;
      }
      lastReason = `CNAME does not point to ${options.expectedCname}`;
    } catch (error) {
      lastReason = cleanDnsError(error);
    }

    process.stderr.write(
      `Deployment DNS attempt ${attempt}/${options.attempts} failed: ${lastReason}.\n`,
    );
    if (attempt < options.attempts) {
      await sleepImpl(options.delayMs);
    }
  }

  throw new Error(
    `Deployment DNS verification failed for ${options.hostname}: ${lastReason}. Add CNAME ${options.hostname} -> ${options.expectedCname}.`,
  );
}

async function main() {
  const options = parseDeploymentDnsArguments(process.argv.slice(2));
  await verifyDeploymentDns(options);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    const message =
      error instanceof Error
        ? error.message
        : "Deployment DNS verification failed.";
    process.stderr.write(`${message.replace(/[\r\n]+/g, " ").slice(0, 320)}\n`);
    process.exitCode = 1;
  });
}
