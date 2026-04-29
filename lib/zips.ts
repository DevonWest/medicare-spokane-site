export type ZipArea = {
  zip: string;
  city: string;
  citySlug: string;
  county: string;
  state: string;
  stateCode: string;
  neighborhood?: string;
};

export const spokaneZipAreas: ZipArea[] = [
  { zip: "99201", city: "Spokane", citySlug: "spokane", county: "Spokane County", state: "Washington", stateCode: "WA", neighborhood: "Downtown / West Central" },
  { zip: "99202", city: "Spokane", citySlug: "spokane", county: "Spokane County", state: "Washington", stateCode: "WA", neighborhood: "East Central / Browne's Addition" },
  { zip: "99203", city: "Spokane", citySlug: "spokane", county: "Spokane County", state: "Washington", stateCode: "WA", neighborhood: "South Hill" },
  { zip: "99204", city: "Spokane", citySlug: "spokane", county: "Spokane County", state: "Washington", stateCode: "WA", neighborhood: "West Side / Rockwood" },
  { zip: "99205", city: "Spokane", citySlug: "spokane", county: "Spokane County", state: "Washington", stateCode: "WA", neighborhood: "Northwest / Logan" },
  { zip: "99206", city: "Spokane", citySlug: "spokane", county: "Spokane County", state: "Washington", stateCode: "WA", neighborhood: "Spokane Valley West" },
  { zip: "99207", city: "Spokane", citySlug: "spokane", county: "Spokane County", state: "Washington", stateCode: "WA", neighborhood: "Northeast / Indian Trail" },
  { zip: "99208", city: "Spokane", citySlug: "spokane", county: "Spokane County", state: "Washington", stateCode: "WA", neighborhood: "North Side" },
  { zip: "99212", city: "Spokane Valley", citySlug: "spokane-valley", county: "Spokane County", state: "Washington", stateCode: "WA", neighborhood: "Spokane Valley Central" },
  { zip: "99216", city: "Spokane Valley", citySlug: "spokane-valley", county: "Spokane County", state: "Washington", stateCode: "WA", neighborhood: "Spokane Valley East" },
  { zip: "99037", city: "Spokane Valley", citySlug: "spokane-valley", county: "Spokane County", state: "Washington", stateCode: "WA", neighborhood: "Greenacres / Otis Orchards" },
  { zip: "99016", city: "Spokane Valley", citySlug: "spokane-valley", county: "Spokane County", state: "Washington", stateCode: "WA", neighborhood: "Opportunity / Dishman" },
  { zip: "99001", city: "Airway Heights", citySlug: "airway-heights", county: "Spokane County", state: "Washington", stateCode: "WA" },
  { zip: "99004", city: "Cheney", citySlug: "cheney", county: "Spokane County", state: "Washington", stateCode: "WA" },
  { zip: "99006", city: "Deer Park", citySlug: "deer-park", county: "Spokane County", state: "Washington", stateCode: "WA" },
  { zip: "99019", city: "Liberty Lake", citySlug: "liberty-lake", county: "Spokane County", state: "Washington", stateCode: "WA" },
  { zip: "99021", city: "Mead", citySlug: "mead", county: "Spokane County", state: "Washington", stateCode: "WA" },
  { zip: "99022", city: "Medical Lake", citySlug: "medical-lake", county: "Spokane County", state: "Washington", stateCode: "WA" },
];

export function getZipArea(zip: string): ZipArea | undefined {
  return spokaneZipAreas.find((z) => z.zip === zip);
}

export function getAllZips(): string[] {
  return spokaneZipAreas.map((z) => z.zip);
}
