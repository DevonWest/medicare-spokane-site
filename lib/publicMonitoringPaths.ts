import { getMarketUpdateMonitoringPaths } from "./marketUpdates";
import { getProviderNetworkMonitoringPaths } from "./providerNetworks";

/**
 * Public pages that need recurring technical checks and exact Google index
 * evidence, including service pages awaiting indexing after the September audit.
 */
export const publicMonitoringPaths = [
  ...new Set([
    ...getMarketUpdateMonitoringPaths(),
    ...getProviderNetworkMonitoringPaths(),
    "/medicare-advantage",
    "/medicare-spokane",
    "/medicare-supplements",
    "/compare-medicare-options",
    "/medicare-stevens-county",
    "/medicare-spokane-valley",
    "/medicare-deer-park",
    "/medicare-mead",
    "/medicare-part-d",
    "/medicare-annual-enrollment-spokane",
    "/medicare-savings-program-extra-help-washington",
    "/moving-to-spokane-medicare",
    "/individual-family-health-insurance-spokane",
    "/self-employed-health-insurance-spokane",
    "/supplemental-insurance",
    "/topics/medicare-for-seniors",
  ]),
] as readonly `/${string}`[];
