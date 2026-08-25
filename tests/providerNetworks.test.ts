import assert from "node:assert/strict";
import test from "node:test";
import sitemap from "../app/sitemap";
import {
  PROVIDER_NETWORK_CHECKED_AT,
  PROVIDER_NETWORK_GUIDE_PATH,
  getProviderNetworkMonitoringPaths,
  getProviderNetworkSource,
  getProviderSystem,
  providerNetworkEntries,
  providerNetworkSources,
  providerSystems,
} from "../lib/providerNetworks";
import { siteConfig } from "../lib/site";
import { publicMonitoringPaths } from "../lib/publicMonitoringPaths";

test("provider network registry preserves unique source-backed entries", () => {
  assert.equal(
    new Set(providerNetworkEntries.map((entry) => entry.id)).size,
    providerNetworkEntries.length,
  );
  assert.equal(
    new Set(providerNetworkSources.map((source) => source.id)).size,
    providerNetworkSources.length,
  );

  for (const entry of providerNetworkEntries) {
    assert.ok(getProviderSystem(entry.systemId), `${entry.id} has a known health system`);
    assert.ok(entry.sourceIds.length > 0, `${entry.id} has at least one source`);
    for (const sourceId of entry.sourceIds) {
      assert.ok(getProviderNetworkSource(sourceId), `${entry.id} source ${sourceId} exists`);
    }
  }
});

test("provider network sources use current HTTPS evidence", () => {
  for (const source of providerNetworkSources) {
    assert.match(source.url, /^https:\/\//);
    assert.equal(source.checkedAt, PROVIDER_NETWORK_CHECKED_AT);
  }
});

test("high-intent Spokane network answers retain product-level wording", () => {
  const multicareHumana = providerNetworkEntries.find(
    (entry) => entry.id === "multicare-humana",
  );
  const multicareMolina = providerNetworkEntries.find(
    (entry) => entry.id === "multicare-molina-dsnp",
  );
  const providenceScan = providerNetworkEntries.find(
    (entry) => entry.id === "providence-scan",
  );
  const chasScan = providerNetworkEntries.find((entry) => entry.id === "chas-scan");

  assert.equal(multicareHumana?.status, "limited");
  assert.match(multicareHumana?.productScope ?? "", /group-retiree/i);
  assert.equal(multicareMolina?.status, "not-in-network");
  assert.match(multicareMolina?.productScope ?? "", /D-SNP/);
  assert.equal(providenceScan?.status, "not-listed");
  assert.equal(chasScan?.status, "not-in-network");
});

test("network hub and system guides are discoverable in the sitemap", () => {
  const sitemapUrls = new Set(sitemap().map((entry) => entry.url));
  const paths = [
    PROVIDER_NETWORK_GUIDE_PATH,
    ...providerSystems.flatMap((system) =>
      system.detailPath ? [system.detailPath] : [],
    ),
  ];

  for (const path of paths) {
    assert.ok(sitemapUrls.has(`${siteConfig.url}${path}`), `${path} should be in the sitemap`);
  }
});

test("CMS technical and Search Console scans monitor every network guide", () => {
  const monitoringPaths = getProviderNetworkMonitoringPaths();

  assert.deepEqual(monitoringPaths, [
    PROVIDER_NETWORK_GUIDE_PATH,
    "/providence-medicare-advantage-plans-spokane",
    "/multicare-medicare-advantage-plans-spokane",
  ]);
  for (const path of monitoringPaths) {
    assert.ok(publicMonitoringPaths.includes(path), `${path} should be monitored`);
  }
});
