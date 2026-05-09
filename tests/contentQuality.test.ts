import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const TS_FILE_PATTERN = /\.(ts|tsx)$/;

const publicContentRootNames = ["app", "components", "lib"] as const;
const publicContentRoots = publicContentRootNames.map((dir) => join(root, dir));

const excludedPathParts = [
  `${join("app", "api")}${"/"}`,
  `${join("app", "healthz")}${"/"}`,
  join("app", "layout.tsx"),
  join("app", "sitemap.ts"),
  join("app", "robots.ts"),
  join("lib", "analytics.ts"),
  join("lib", "crm.ts"),
  join("lib", "crmPaths.ts"),
  join("lib", "crmPayload.ts"),
  join("lib", "leadConstants.ts"),
  join("lib", "leadFirestore.ts"),
  join("lib", "leadLogging.ts"),
  join("lib", "leadPayload.ts"),
  join("lib", "leadSources.ts"),
  join("lib", "leadSubmissionClient.ts"),
  join("lib", "leadValidation.ts"),
  join("lib", "leads.ts"),
  join("lib", "reviewFeedback.ts"),
  join("lib", "runtimeValues.ts"),
  join("lib", "env.ts"),
];

const internalPublicContentPhrases = [
  "broad education",
  "category-level education",
  "compliance note",
  "compliance reminder",
  "content governance",
  "content strategy",
  "conversion",
  "crm",
  "indexable",
  "local plan details",
  "lead routing",
  "move from broad education",
  "seo",
  "template",
  "thin content",
  "use these sections",
  "visitors",
  "without overpromising",
];

const internalPublicContentPatterns = internalPublicContentPhrases.map((phrase) => ({
  phrase,
  // Word boundaries avoid flagging technical identifiers that merely contain a blocked word.
  pattern: new RegExp(`\\b${escapeRegex(phrase)}\\b`, "i"),
}));

function listPublicContentFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const relPath = relative(root, path);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      return listPublicContentFiles(path);
    }

    if (!TS_FILE_PATTERN.test(path)) {
      return [];
    }

    if (excludedPathParts.some((excluded) => relPath === excluded || relPath.startsWith(excluded))) {
      return [];
    }

    return [path];
  });
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("public content avoids internal-facing review phrases", () => {
  const matches = publicContentRoots
    .flatMap(listPublicContentFiles)
    .flatMap((path) => {
      const relPath = relative(root, path);
      const content = readFileSync(path, "utf8").toLowerCase();

      return internalPublicContentPatterns
        .filter(({ pattern }) => pattern.test(content))
        .map(({ phrase }) => phrase)
        .map((phrase) => `${relPath}: "${phrase}"`);
    });

  assert.deepEqual(matches, []);
});
