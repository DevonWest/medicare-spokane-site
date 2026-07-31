import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import type { ComponentType } from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { knowledgeCmsRouteParityManifest } from "../lib/knowledgeCmsRouteParity";

interface PublicPageModule {
  default: ComponentType;
}

const repositoryRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
);
const outputPath = join(
  repositoryRoot,
  "lib/generated/knowledgeCmsNativeRepresentations.json",
);

async function main(): Promise<void> {
  const representations = [];

  for (const parity of knowledgeCmsRouteParityManifest) {
    const modulePath = join(repositoryRoot, parity.sourceFile);
    const pageModule = (await import(
      pathToFileURL(modulePath).href
    )) as PublicPageModule;
    const html = renderToStaticMarkup(createElement(pageModule.default));
    const bytes = Buffer.byteLength(html);
    const sha256 = createHash("sha256").update(html).digest("hex");

    if (
      bytes !== parity.renderedBody.bytes ||
      sha256 !== parity.renderedBody.sha256
    ) {
      throw new Error(
        `${parity.path} no longer matches its immutable route-parity snapshot.`,
      );
    }

    representations.push({
      entryId: parity.entryId,
      path: parity.path,
      sourceFile: parity.sourceFile,
      encoding: "gzip_base64",
      compressedBody: gzipSync(html, { level: 9 }).toString("base64"),
      renderedBodySha256: sha256,
      renderedBodyBytes: bytes,
    });
  }

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(
    outputPath,
    `${JSON.stringify({ version: 1, representations }, null, 2)}\n`,
    "utf8",
  );

  console.log(
    `Generated ${representations.length} CMS-native rendering templates at ${outputPath}.`,
  );
}

void main();
