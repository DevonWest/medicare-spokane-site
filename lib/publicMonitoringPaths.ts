import { getMarketUpdateMonitoringPaths } from "./marketUpdates";

/**
 * Public pages that live outside the governed Knowledge CMS but still need the
 * same recurring technical checks as CMS canonical routes.
 */
export const publicMonitoringPaths = getMarketUpdateMonitoringPaths();
