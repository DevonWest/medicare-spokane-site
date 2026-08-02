import { pathToFileURL } from "node:url";

const CONDITION_STATUSES = new Set(["True", "False", "Unknown"]);

export function parseCloudRunRevisionReadiness(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Cloud Run revision response must be a JSON object.");
  }

  const conditions = payload.status?.conditions;
  if (conditions === undefined) {
    return "";
  }
  if (!Array.isArray(conditions)) {
    throw new Error("Cloud Run revision conditions must be an array.");
  }

  const readyConditions = conditions.filter(
    (condition) => condition?.type === "Ready",
  );
  if (readyConditions.length === 0) {
    return "";
  }
  if (readyConditions.length !== 1) {
    throw new Error("Cloud Run revision response has duplicate Ready conditions.");
  }

  const readyStatus = readyConditions[0].status;
  if (!CONDITION_STATUSES.has(readyStatus)) {
    throw new Error("Cloud Run revision Ready condition has an invalid status.");
  }
  return readyStatus;
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  const source = await readStdin();
  if (!source.trim()) {
    throw new Error("Cloud Run revision response was empty.");
  }
  const payload = JSON.parse(source);
  process.stdout.write(`${parseCloudRunRevisionReadiness(payload)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    const message =
      error instanceof Error ? error.message : "Cloud Run readiness parsing failed.";
    process.stderr.write(`${message.replace(/[\r\n]+/g, " ").slice(0, 240)}\n`);
    process.exitCode = 1;
  });
}
