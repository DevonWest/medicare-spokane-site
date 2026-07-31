import assert from "node:assert/strict";
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  KNOWLEDGE_CMS_PUBLIC_RENDERER_ACTIVATION_ALLOWED,
  KNOWLEDGE_CMS_PUBLIC_RENDERER_DEFAULT_MODE,
  KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE_ENV,
  KNOWLEDGE_CMS_RENDERER_CONTRACT_STATE,
  KNOWLEDGE_CMS_RENDERER_CONTRACT_VERSION,
  getKnowledgeCmsRendererContract,
  knowledgeCmsRendererContracts,
  knowledgeCmsRendererRollbackPlan,
  resolveKnowledgeCmsPublicRendererMode,
  validateKnowledgeCmsRendererContracts,
  verifyKnowledgeCmsRendererArtifact,
  type KnowledgeCmsRendererArtifact,
} from "../lib/knowledgeCmsRendererContract";
import {
  getKnowledgeCmsRouteParity,
  knowledgeCmsRouteParityManifest,
} from "../lib/knowledgeCmsRouteParity";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function listTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      return listTypeScriptFiles(path);
    }
    return /\.(ts|tsx)$/.test(path) ? [path] : [];
  });
}

function matchingArtifact(entryId: string): KnowledgeCmsRendererArtifact {
  const parity = getKnowledgeCmsRouteParity(entryId);
  const contract = getKnowledgeCmsRendererContract(entryId);
  assert.ok(parity);
  assert.ok(contract);

  return {
    entryId,
    path: contract.path,
    record: {
      kind: "article",
      id: contract.record.id,
      revision: 1,
      status: "published",
    },
    metadata: {
      pageTitle: parity.metadata.pageTitle,
      description: parity.metadata.description,
      canonicalUrl: parity.metadata.canonicalUrl,
      openGraphTitle: parity.metadata.openGraphTitle,
      openGraphDescription: parity.metadata.openGraphDescription,
      openGraphUrl: parity.metadata.openGraphUrl,
    },
    renderedBody: {
      sha256: parity.renderedBody.sha256,
      bytes: parity.renderedBody.bytes,
      h1: parity.renderedBody.h1,
      h1Count: parity.renderedBody.h1Count,
      schemaTypes: [...parity.renderedBody.schemaTypes],
      formCount: parity.renderedBody.formCount,
      faqDisclosureCount: parity.renderedBody.faqDisclosureCount,
    },
    satisfiedRequirements: [
      ...parity.cmsRepresentation.preservationRequirements,
    ],
  };
}

test("lossless renderer contracts cover every parity route with a static rollback", () => {
  assert.deepEqual(validateKnowledgeCmsRendererContracts(), []);
  assert.equal(knowledgeCmsRendererContracts.length, 22);
  assert.deepEqual(
    knowledgeCmsRendererContracts.map((entry) => entry.entryId),
    knowledgeCmsRouteParityManifest.map((entry) => entry.entryId),
  );
  assert.deepEqual(
    knowledgeCmsRendererContracts.map((entry) => entry.path),
    knowledgeCmsRouteParityManifest.map((entry) => entry.path),
  );
  assert.equal(
    knowledgeCmsRendererContracts.some((entry) =>
      ["/", "/medicare-spokane"].includes(entry.path),
    ),
    false,
  );

  for (const contract of knowledgeCmsRendererContracts) {
    assert.equal(
      contract.version,
      KNOWLEDGE_CMS_RENDERER_CONTRACT_VERSION,
    );
    assert.equal(contract.state, KNOWLEDGE_CMS_RENDERER_CONTRACT_STATE);
    assert.equal(contract.candidate.implementationStatus, "not_implemented");
    assert.equal(contract.rollout.shadowEligible, false);
    assert.equal(contract.rollout.cutoverEligible, false);
    assert.equal(contract.rollback.mode, "static");
    assert.equal(contract.rollback.dataMutation, "none");
    assert.equal(contract.rollback.preservesCmsRecords, true);
    assert.ok(existsSync(join(root, contract.legacy.sourceFile)));
    assert.equal(contract.rollback.sourceFile, contract.legacy.sourceFile);
    assert.equal(
      contract.rollback.renderedSha256,
      contract.legacy.renderedSha256,
    );
  }

  assert.equal(knowledgeCmsRendererRollbackPlan.routeCount, 22);
  assert.equal(
    knowledgeCmsRendererRollbackPlan.environmentVariable,
    KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE_ENV,
  );
  assert.equal(
    knowledgeCmsRendererRollbackPlan.rollbackValue,
    KNOWLEDGE_CMS_PUBLIC_RENDERER_DEFAULT_MODE,
  );
  assert.deepEqual(
    knowledgeCmsRendererRollbackPlan.protectedPaths,
    ["/", "/medicare-spokane"],
  );
  assert.equal(knowledgeCmsRendererRollbackPlan.dataMutation, "none");
});

test("every required React capability has an explicit adapter and evidence gate", () => {
  for (const contract of knowledgeCmsRendererContracts) {
    const parity = getKnowledgeCmsRouteParity(contract.entryId);
    assert.ok(parity);
    assert.deepEqual(
      contract.candidate.capabilities.map(
        (capability) => capability.requirement,
      ),
      parity.cmsRepresentation.preservationRequirements,
    );
    for (const capability of contract.candidate.capabilities) {
      assert.ok(capability.requiredAdapter);
      assert.ok(capability.evidence.length > 0);
      assert.equal(
        capability.implementationStatus,
        "required_not_implemented",
      );
      for (const sourceFile of capability.sourceFiles) {
        assert.ok(
          existsSync(join(root, sourceFile)),
          `${contract.path} capability source ${sourceFile} is missing`,
        );
      }
    }
  }

  const faq = getKnowledgeCmsRendererContract("medicare-faq");
  const carriers = getKnowledgeCmsRendererContract(
    "represented-carriers",
  );
  assert.ok(
    faq?.candidate.capabilities.some(
      (capability) =>
        capability.requirement === "governed_faq_registry",
    ),
  );
  assert.ok(
    carriers?.candidate.capabilities.some(
      (capability) =>
        capability.requirement === "represented_carrier_registry",
    ),
  );
});

test("renderer modes fail closed to static until activation is implemented", () => {
  assert.equal(KNOWLEDGE_CMS_PUBLIC_RENDERER_ACTIVATION_ALLOWED, false);
  assert.deepEqual(resolveKnowledgeCmsPublicRendererMode(undefined), {
    configuredValue: undefined,
    requestedMode: "static",
    effectiveMode: "static",
    configurationValid: true,
    activationAllowed: false,
    reason: "default_static",
  });
  assert.equal(
    resolveKnowledgeCmsPublicRendererMode("static").reason,
    "explicit_static",
  );
  for (const requested of ["shadow", "cutover"] as const) {
    const resolution =
      resolveKnowledgeCmsPublicRendererMode(requested);
    assert.equal(resolution.requestedMode, requested);
    assert.equal(resolution.effectiveMode, "static");
    assert.equal(resolution.activationAllowed, false);
    assert.equal(resolution.reason, "activation_not_implemented");
  }
  for (const invalid of ["", "false", "true", " shadow ", "STATIC"]) {
    const resolution =
      resolveKnowledgeCmsPublicRendererMode(invalid);
    assert.equal(resolution.requestedMode, "invalid");
    assert.equal(resolution.effectiveMode, "static");
    assert.equal(resolution.configurationValid, false);
    assert.equal(resolution.reason, "invalid_value");
  }
});

test("candidate artifacts must exactly match the legacy HTML and SEO evidence", () => {
  const contract = getKnowledgeCmsRendererContract(
    "turning-65-spokane",
  );
  assert.ok(contract);
  const artifact = matchingArtifact(contract.entryId);

  assert.deepEqual(
    verifyKnowledgeCmsRendererArtifact(contract, artifact),
    [],
  );

  const drifted: KnowledgeCmsRendererArtifact = {
    ...artifact,
    metadata: {
      ...artifact.metadata,
      canonicalUrl: "https://www.medicareinspokane.com/wrong",
    },
    renderedBody: {
      ...artifact.renderedBody,
      sha256: "0".repeat(64),
      formCount: artifact.renderedBody.formCount + 1,
    },
    satisfiedRequirements: [],
  };
  const errors = verifyKnowledgeCmsRendererArtifact(
    contract,
    drifted,
  );
  assert.ok(errors.some((message) => /canonical/i.test(message)));
  assert.ok(errors.some((message) => /SHA-256/i.test(message)));
  assert.ok(errors.some((message) => /lead-form count/i.test(message)));
  assert.ok(
    errors.some((message) => /react_component_tree/i.test(message)),
  );
});

test("contract evidence is immutable and absent from every public route", () => {
  const contract = knowledgeCmsRendererContracts[0];
  assert.throws(() => {
    (
      contract.rollback as {
        mode: string;
      }
    ).mode = "cutover";
  }, TypeError);
  assert.throws(() => {
    (
      contract.candidate.capabilities as unknown as unknown[]
    ).push({});
  }, TypeError);

  const publicSources = [
    ...listTypeScriptFiles(join(root, "app")),
    ...listTypeScriptFiles(join(root, "components")),
  ].filter(
    (sourceFile) =>
      !relative(root, sourceFile).startsWith(
        `${join("app", "admin")}/`,
      ),
  );
  for (const sourceFile of publicSources) {
    assert.doesNotMatch(
      readFileSync(sourceFile, "utf8"),
      /knowledgeCmsRendererContract|KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE/,
      `${relative(root, sourceFile)} must not import or activate the CMS renderer contract`,
    );
  }
});
