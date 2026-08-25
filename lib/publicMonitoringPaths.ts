import { getMarketUpdateMonitoringPaths } from "./marketUpdates";
import { getProviderNetworkMonitoringPaths } from "./providerNetworks";

/**
 * Public pages that live outside the governed Knowledge CMS but still need the
 * same recurring technical checks as CMS canonical routes.
 */
export const publicMonitoringPaths = [
  ...new Set([
    ...getMarketUpdateMonitoringPaths(),
    ...getProviderNetworkMonitoringPaths(),
  ]),
] as readonly `/${string}`[];
