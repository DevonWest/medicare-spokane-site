export type ProviderNetworkStatus =
  | "listed"
  | "limited"
  | "not-listed"
  | "not-in-network";

export interface ProviderNetworkSource {
  id: string;
  title: string;
  publisher: string;
  url: string;
  checkedAt: `${number}-${number}-${number}`;
}

export interface ProviderSystem {
  id: string;
  name: string;
  shortName: string;
  area: string;
  summary: string;
  detailPath?: `/${string}`;
  note?: string;
}

export interface ProviderNetworkEntry {
  id: string;
  systemId: ProviderSystem["id"];
  carrier: string;
  status: ProviderNetworkStatus;
  productScope: string;
  detail: string;
  sourceIds: ProviderNetworkSource["id"][];
}

export const PROVIDER_NETWORK_GUIDE_PATH =
  "/spokane-medicare-provider-networks" as const;
export const PROVIDER_NETWORK_CHECKED_AT = "2026-08-24" as const;
export const PROVIDER_NETWORK_CHECKED_LABEL = "August 24, 2026";

export const providerNetworkSources: readonly ProviderNetworkSource[] = [
  {
    id: "multicare-accepted-plans",
    title: "Accepted Health Insurance Plans",
    publisher: "MultiCare Health System",
    url: "https://www.multicare.org/patient-resources/billing/insurance/accepted-health-plans/",
    checkedAt: PROVIDER_NETWORK_CHECKED_AT,
  },
  {
    id: "multicare-molina-update",
    title: "MultiCare and Molina Healthcare Plans: Important Network Update",
    publisher: "MultiCare Health System",
    url: "https://www.multicare.org/molina-healthcare-plans/",
    checkedAt: PROVIDER_NETWORK_CHECKED_AT,
  },
  {
    id: "scan-multicare-network",
    title: "MultiCare Health System Joins SCAN Health Plan Network",
    publisher: "SCAN Health Plan",
    url: "https://www.scanhealthplan.com/about-scan/press-releases/multicare-health-system",
    checkedAt: PROVIDER_NETWORK_CHECKED_AT,
  },
  {
    id: "providence-washington-medicare",
    title: "Medicare Resources: Washington and Montana",
    publisher: "Providence",
    url: "https://www.providence.org/lp/wamt-medicare",
    checkedAt: PROVIDER_NETWORK_CHECKED_AT,
  },
  {
    id: "chas-accepted-plans",
    title: "Insurance and Payment: Medicare Advantage Plans Accepted",
    publisher: "CHAS Health",
    url: "https://chas.org/for-patients/insurance-payment/",
    checkedAt: PROVIDER_NETWORK_CHECKED_AT,
  },
  {
    id: "kootenai-humana-update",
    title: "Humana Medicare Advantage Network Update",
    publisher: "Kootenai Health",
    url: "https://www.kh.org/humana/",
    checkedAt: PROVIDER_NETWORK_CHECKED_AT,
  },
  {
    id: "kootenai-regence-update",
    title: "Regence BlueShield Agreement Frequently Asked Questions",
    publisher: "Kootenai Health",
    url: "https://www.kh.org/regence-faq/",
    checkedAt: PROVIDER_NETWORK_CHECKED_AT,
  },
] as const;

export const providerSystems: readonly ProviderSystem[] = [
  {
    id: "providence-spokane",
    name: "Providence Spokane",
    shortName: "Providence",
    area: "Spokane and Washington",
    summary:
      "Providence hospitals, clinics, and medical groups in the Spokane region. Providence publishes a Washington-wide Medicare Advantage carrier list, so each Spokane provider and exact plan still needs confirmation.",
    detailPath: "/providence-medicare-advantage-plans-spokane",
    note:
      "Providence stated at the source check that it was not accepting new primary-care patients with Medicare PPO plans. Existing-patient, specialist, hospital, and exact-plan participation can differ.",
  },
  {
    id: "multicare-spokane",
    name: "MultiCare and Rockwood Clinic",
    shortName: "MultiCare / Rockwood",
    area: "Spokane County",
    summary:
      "MultiCare hospitals, Rockwood Clinic, and other MultiCare providers in Spokane County. MultiCare publishes product-level Medicare Advantage participation for Spokane County.",
    detailPath: "/multicare-medicare-advantage-plans-spokane",
  },
  {
    id: "chas-health",
    name: "CHAS Health",
    shortName: "CHAS Health",
    area: "Spokane and Inland Northwest clinics",
    summary:
      "CHAS Health publishes separate medical and dental participation information for Medicare Advantage carriers serving its community health centers.",
  },
  {
    id: "kootenai-health",
    name: "Kootenai Health",
    shortName: "Kootenai Health",
    area: "Coeur d'Alene and North Idaho",
    summary:
      "A cross-border reference for Spokane-area residents who receive care in North Idaho. Washington plan networks may treat Idaho providers differently, so the exact plan must be checked.",
  },
] as const;

export const providerNetworkEntries: readonly ProviderNetworkEntry[] = [
  {
    id: "providence-aetna",
    systemId: "providence-spokane",
    carrier: "Aetna",
    status: "listed",
    productScope: "Medicare Advantage",
    detail:
      "Providence lists Aetna among the Medicare Advantage carriers it accepts in Washington. Confirm the exact plan and Spokane provider.",
    sourceIds: ["providence-washington-medicare"],
  },
  {
    id: "providence-asuris",
    systemId: "providence-spokane",
    carrier: "Asuris Northwest Health",
    status: "listed",
    productScope: "Medicare Advantage",
    detail:
      "Providence lists Asuris Northwest Health in Washington. Confirm the exact plan, facility, and physician group.",
    sourceIds: ["providence-washington-medicare"],
  },
  {
    id: "providence-cigna",
    systemId: "providence-spokane",
    carrier: "Cigna Healthcare",
    status: "listed",
    productScope: "Medicare Advantage",
    detail:
      "Providence lists Cigna Healthcare in Washington. Carrier branding and exact plan networks can differ, so verify the member's plan.",
    sourceIds: ["providence-washington-medicare"],
  },
  {
    id: "providence-chpw",
    systemId: "providence-spokane",
    carrier: "Community Health Plan of Washington",
    status: "listed",
    productScope: "Medicare Advantage",
    detail:
      "Providence lists Community Health Plan of Washington. Confirm Spokane County availability and the exact provider.",
    sourceIds: ["providence-washington-medicare"],
  },
  {
    id: "providence-humana",
    systemId: "providence-spokane",
    carrier: "Humana",
    status: "listed",
    productScope: "Medicare Advantage",
    detail:
      "Providence lists Humana in Washington. This does not mean every Humana product or Providence clinician participates.",
    sourceIds: ["providence-washington-medicare"],
  },
  {
    id: "providence-kaiser",
    systemId: "providence-spokane",
    carrier: "Kaiser Foundation Health Plan of Washington",
    status: "listed",
    productScope: "Medicare Advantage",
    detail:
      "Providence lists Kaiser Foundation Health Plan of Washington. Confirm the exact Spokane service area and provider.",
    sourceIds: ["providence-washington-medicare"],
  },
  {
    id: "providence-molina",
    systemId: "providence-spokane",
    carrier: "Molina Healthcare of Washington",
    status: "listed",
    productScope: "Medicare Advantage",
    detail:
      "Providence lists Molina Healthcare of Washington. Verify the exact Molina plan and participating Providence provider.",
    sourceIds: ["providence-washington-medicare"],
  },
  {
    id: "providence-pacificsource",
    systemId: "providence-spokane",
    carrier: "PacificSource",
    status: "listed",
    productScope: "Medicare Advantage",
    detail:
      "Providence lists PacificSource in Washington. Plan availability and network participation can vary by county.",
    sourceIds: ["providence-washington-medicare"],
  },
  {
    id: "providence-providence-plan",
    systemId: "providence-spokane",
    carrier: "Providence Medicare Advantage",
    status: "listed",
    productScope: "Medicare Advantage",
    detail:
      "Providence lists Providence Medicare Advantage. The health system and insurance company are separate entities, and exact provider participation still matters.",
    sourceIds: ["providence-washington-medicare"],
  },
  {
    id: "providence-regence",
    systemId: "providence-spokane",
    carrier: "Regence BlueShield",
    status: "listed",
    productScope: "Medicare Advantage",
    detail:
      "Providence lists Regence BlueShield in Washington. Confirm the exact product and Spokane provider.",
    sourceIds: ["providence-washington-medicare"],
  },
  {
    id: "providence-uhc",
    systemId: "providence-spokane",
    carrier: "UnitedHealthcare",
    status: "listed",
    productScope: "Medicare Advantage",
    detail:
      "Providence lists UnitedHealthcare. Confirm whether the member's exact HMO, PPO, or special-needs plan includes the provider.",
    sourceIds: ["providence-washington-medicare"],
  },
  {
    id: "providence-wellcare",
    systemId: "providence-spokane",
    carrier: "Wellcare",
    status: "listed",
    productScope: "Medicare Advantage",
    detail:
      "Providence lists Wellcare in Washington. Confirm the plan, location, and clinician before relying on the listing.",
    sourceIds: ["providence-washington-medicare"],
  },
  {
    id: "providence-wellpoint",
    systemId: "providence-spokane",
    carrier: "Wellpoint",
    status: "listed",
    productScope: "Medicare Advantage",
    detail:
      "Providence lists Wellpoint in Washington. Exact Spokane participation requires plan-level confirmation.",
    sourceIds: ["providence-washington-medicare"],
  },
  {
    id: "providence-scan",
    systemId: "providence-spokane",
    carrier: "SCAN Health Plan",
    status: "not-listed",
    productScope: "Medicare Advantage",
    detail:
      "SCAN was not included on Providence's Washington Medicare Advantage carrier list at the source check. Treat this as 'not listed,' not a guarantee that every Providence-related provider is out of network.",
    sourceIds: ["providence-washington-medicare"],
  },
  {
    id: "multicare-aetna",
    systemId: "multicare-spokane",
    carrier: "Aetna",
    status: "limited",
    productScope: "Medicare Advantage HMO and group-retiree Medicare Advantage PPO",
    detail:
      "MultiCare's Spokane County list names Aetna Medicare Advantage HMO and group-retiree Medicare Advantage PPO products. It does not state that every Aetna PPO is included.",
    sourceIds: ["multicare-accepted-plans"],
  },
  {
    id: "multicare-scan",
    systemId: "multicare-spokane",
    carrier: "SCAN Health Plan",
    status: "listed",
    productScope: "Medicare Advantage",
    detail:
      "MultiCare lists SCAN Health Plan for Spokane County, and SCAN announced MultiCare network access in Spokane beginning January 1, 2026.",
    sourceIds: ["multicare-accepted-plans", "scan-multicare-network"],
  },
  {
    id: "multicare-uhc",
    systemId: "multicare-spokane",
    carrier: "UnitedHealthcare",
    status: "limited",
    productScope:
      "Dual Complete HMO, AARP/UnitedHealthcare Medicare Advantage HMO, and group-retiree Medicare Advantage PPO",
    detail:
      "MultiCare names these UnitedHealthcare product categories for Spokane County. Other UnitedHealthcare products need separate verification.",
    sourceIds: ["multicare-accepted-plans"],
  },
  {
    id: "multicare-humana",
    systemId: "multicare-spokane",
    carrier: "Humana",
    status: "limited",
    productScope: "Group-retiree Medicare Advantage PPO only",
    detail:
      "MultiCare lists Humana group-retiree Medicare Advantage PPO plans. Individual Humana Medicare Advantage products are not included in that Spokane County listing.",
    sourceIds: ["multicare-accepted-plans"],
  },
  {
    id: "multicare-regence",
    systemId: "multicare-spokane",
    carrier: "Regence",
    status: "limited",
    productScope: "Group PPO plans",
    detail:
      "MultiCare's Spokane County Medicare Advantage list names Regence group PPO plans. Confirm individual Regence and Asuris products separately.",
    sourceIds: ["multicare-accepted-plans"],
  },
  {
    id: "multicare-molina-dsnp",
    systemId: "multicare-spokane",
    carrier: "Molina Healthcare",
    status: "not-in-network",
    productScope: "Medicare Advantage D-SNP",
    detail:
      "MultiCare says it is no longer in network for Molina Medicare Advantage D-SNP plans effective January 1, 2026. This statement is product-specific and should not be broadened to every Molina product.",
    sourceIds: ["multicare-molina-update"],
  },
  {
    id: "chas-aetna",
    systemId: "chas-health",
    carrier: "Aetna",
    status: "limited",
    productScope: "Medicare Advantage medical: yes; dental: no",
    detail:
      "CHAS lists Aetna for Medicare Advantage medical services but not Medicare Advantage dental services.",
    sourceIds: ["chas-accepted-plans"],
  },
  {
    id: "chas-asuris",
    systemId: "chas-health",
    carrier: "Asuris Northwest Health",
    status: "listed",
    productScope: "Medicare Advantage medical and dental",
    detail: "CHAS lists Asuris Northwest Health for both medical and dental services.",
    sourceIds: ["chas-accepted-plans"],
  },
  {
    id: "chas-bcidaho",
    systemId: "chas-health",
    carrier: "Blue Cross of Idaho",
    status: "listed",
    productScope: "Medicare Advantage medical and dental",
    detail: "CHAS lists Blue Cross of Idaho for both medical and dental services.",
    sourceIds: ["chas-accepted-plans"],
  },
  {
    id: "chas-chpw",
    systemId: "chas-health",
    carrier: "Community Health Plan of Washington",
    status: "listed",
    productScope: "Medicare Advantage medical and dental",
    detail:
      "CHAS lists Community Health Plan of Washington for both medical and dental services.",
    sourceIds: ["chas-accepted-plans"],
  },
  {
    id: "chas-humana",
    systemId: "chas-health",
    carrier: "Humana",
    status: "listed",
    productScope: "Medicare Advantage medical and dental",
    detail: "CHAS lists Humana for both medical and dental services.",
    sourceIds: ["chas-accepted-plans"],
  },
  {
    id: "chas-molina",
    systemId: "chas-health",
    carrier: "Molina Healthcare of Washington",
    status: "listed",
    productScope: "Medicare Advantage medical and dental",
    detail:
      "CHAS lists Molina Healthcare of Washington for both medical and dental services.",
    sourceIds: ["chas-accepted-plans"],
  },
  {
    id: "chas-regence-idaho",
    systemId: "chas-health",
    carrier: "Regence BlueShield of Idaho",
    status: "listed",
    productScope: "Medicare Advantage medical and dental",
    detail:
      "CHAS lists Regence BlueShield of Idaho for both medical and dental services. Washington Regence products still need exact-plan confirmation.",
    sourceIds: ["chas-accepted-plans"],
  },
  {
    id: "chas-uhc",
    systemId: "chas-health",
    carrier: "UnitedHealthcare",
    status: "listed",
    productScope: "Medicare Advantage medical and dental",
    detail: "CHAS lists UnitedHealthcare for both medical and dental services.",
    sourceIds: ["chas-accepted-plans"],
  },
  {
    id: "chas-wellcare",
    systemId: "chas-health",
    carrier: "Wellcare",
    status: "listed",
    productScope: "Medicare Advantage medical and dental",
    detail: "CHAS lists Wellcare for both medical and dental services.",
    sourceIds: ["chas-accepted-plans"],
  },
  {
    id: "chas-wellpoint",
    systemId: "chas-health",
    carrier: "Wellpoint",
    status: "limited",
    productScope: "Medicare Advantage medical: yes; dental: no",
    detail:
      "CHAS lists Wellpoint for Medicare Advantage medical services but not Medicare Advantage dental services.",
    sourceIds: ["chas-accepted-plans"],
  },
  {
    id: "chas-healthspring",
    systemId: "chas-health",
    carrier: "HealthSpring (formerly Cigna)",
    status: "not-in-network",
    productScope: "Medicare Advantage",
    detail:
      "CHAS expressly says it is not in network with HealthSpring, formerly Cigna, Medicare Advantage plans.",
    sourceIds: ["chas-accepted-plans"],
  },
  {
    id: "chas-kaiser",
    systemId: "chas-health",
    carrier: "Kaiser",
    status: "not-in-network",
    productScope: "Medicare Advantage",
    detail: "CHAS expressly says it is not in network with Kaiser Medicare Advantage plans.",
    sourceIds: ["chas-accepted-plans"],
  },
  {
    id: "chas-pacificsource",
    systemId: "chas-health",
    carrier: "PacificSource",
    status: "not-in-network",
    productScope: "Medicare Advantage",
    detail:
      "CHAS expressly says it is not in network with PacificSource Medicare Advantage plans.",
    sourceIds: ["chas-accepted-plans"],
  },
  {
    id: "chas-providence",
    systemId: "chas-health",
    carrier: "Providence Medicare Advantage",
    status: "not-in-network",
    productScope: "Medicare Advantage",
    detail:
      "CHAS expressly says it is not in network with Providence Medicare Advantage plans.",
    sourceIds: ["chas-accepted-plans"],
  },
  {
    id: "chas-scan",
    systemId: "chas-health",
    carrier: "SCAN Health Plan",
    status: "not-in-network",
    productScope: "Medicare Advantage",
    detail:
      "CHAS expressly says it is not in network with SCAN Health Medicare Advantage plans.",
    sourceIds: ["chas-accepted-plans"],
  },
  {
    id: "kootenai-humana",
    systemId: "kootenai-health",
    carrier: "Humana",
    status: "not-in-network",
    productScope: "Medicare Advantage",
    detail:
      "Kootenai Health says it canceled its Humana Medicare Advantage contract effective April 1, 2023. Confirm current status before relying on this cross-border reference.",
    sourceIds: ["kootenai-humana-update"],
  },
  {
    id: "kootenai-regence",
    systemId: "kootenai-health",
    carrier: "Regence",
    status: "limited",
    productScope: "Regence members; exact Washington Medicare Advantage plan must be checked",
    detail:
      "Kootenai Health says its providers and Kootenai Clinic physicians remain in network for Regence members. Confirm that a Washington Medicare Advantage product includes North Idaho care.",
    sourceIds: ["kootenai-regence-update"],
  },
] as const;

const providerSystemById = new Map(
  providerSystems.map((system) => [system.id, system]),
);
const providerNetworkSourceById = new Map(
  providerNetworkSources.map((source) => [source.id, source]),
);

export function getProviderSystem(id: string): ProviderSystem | undefined {
  return providerSystemById.get(id);
}

export function getProviderNetworkSource(
  id: string,
): ProviderNetworkSource | undefined {
  return providerNetworkSourceById.get(id);
}

export function getProviderNetworkEntriesForSystem(
  systemId: string,
): readonly ProviderNetworkEntry[] {
  return providerNetworkEntries.filter((entry) => entry.systemId === systemId);
}

export function getProviderNetworkStatusLabel(
  status: ProviderNetworkStatus,
): string {
  switch (status) {
    case "listed":
      return "Listed by provider";
    case "limited":
      return "Limited products";
    case "not-listed":
      return "Not listed";
    case "not-in-network":
      return "Not in network for listed product";
  }
}
