/**
 * Carriers we currently represent. Sourced from the live site at
 * medicareinspokane.com/carriers. Carrier and plan availability may vary by
 * county, product type (Medicare Advantage, Medicare Supplement, Part D,
 * supplemental), and enrollment period — we surface those caveats in the UI.
 */
export interface Carrier {
  name: string;
  productTypes: Array<
    | "Medicare Advantage"
    | "Medicare Supplement"
    | "Medicare Part D"
    | "Dental"
    | "Vision"
    | "Hospital Indemnity"
  >;
}

export const carriers: Carrier[] = [
  { name: "Aetna", productTypes: ["Medicare Advantage", "Medicare Supplement", "Medicare Part D"] },
  { name: "Ameritas", productTypes: ["Dental"] },
  { name: "Asuris", productTypes: ["Medicare Advantage", "Medicare Supplement"] },
  { name: "Delta Dental", productTypes: ["Dental"] },
  { name: "Humana", productTypes: ["Medicare Advantage", "Medicare Part D"] },
  { name: "Kaiser Permanente", productTypes: ["Medicare Advantage"] },
  { name: "PacificSource", productTypes: ["Medicare Advantage"] },
  { name: "Premera", productTypes: ["Medicare Supplement"] },
  { name: "Providence Health Plans", productTypes: ["Medicare Advantage"] },
  { name: "Regence", productTypes: ["Medicare Advantage", "Medicare Supplement"] },
  { name: "SilverScript", productTypes: ["Medicare Part D"] },
  { name: "UnitedHealthcare", productTypes: ["Medicare Advantage", "Medicare Supplement", "Medicare Part D"] },
  { name: "United of Omaha", productTypes: ["Medicare Supplement"] },
  { name: "Wellcare", productTypes: ["Medicare Advantage", "Medicare Part D"] },
  { name: "VSP", productTypes: ["Vision"] },
];
