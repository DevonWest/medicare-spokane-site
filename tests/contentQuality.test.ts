import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";

const root = process.cwd();

const publicContentRoots = ["app", "components", "lib"].map((dir) => join(root, dir));

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
  "content strategy",
  "thin content",
  "indexable",
  "seo",
  "template",
  "visitors",
  "conversion",
  "crm",
  "lead routing",
  "local plan details",
  "category-level education",
  "without overpromising",
  "compliance reminder",
  "compliance note",
  "use these sections",
  "move from broad education",
  "content governance",
];

function listPublicContentFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const relPath = relative(root, path);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      return listPublicContentFiles(path);
    }

    if (!/\.(ts|tsx)$/.test(path)) {
      return [];
    }

    if (excludedPathParts.some((excluded) => relPath === excluded || relPath.startsWith(excluded))) {
      return [];
    }

    return [path];
  });
}

function withoutCodeComments(content: string) {
  return content.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

function includesPhrase(content: string, phrase: string) {
  const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z])${escapedPhrase}([^a-z]|$)`).test(content);
}

test("public content avoids internal-facing review phrases", () => {
  const matches = publicContentRoots
    .flatMap(listPublicContentFiles)
    .flatMap((path) => {
      const relPath = relative(root, path);
      const content = withoutCodeComments(readFileSync(path, "utf8")).toLowerCase();

      return internalPublicContentPhrases
        .filter((phrase) => includesPhrase(content, phrase))
        .map((phrase) => `${relPath}: "${phrase}"`);
    });

  assert.deepEqual(matches, []);
});
