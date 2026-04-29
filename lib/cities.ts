export type City = {
  name: string;
  slug: string;
  county: string;
  state: string;
  stateCode: string;
  description: string;
  zipCodes: string[];
};

export const spokaneAreaCities: City[] = [
  {
    name: "Spokane",
    slug: "spokane",
    county: "Spokane County",
    state: "Washington",
    stateCode: "WA",
    description:
      "The largest city in Eastern Washington and the hub of the Inland Northwest, Spokane is home to thousands of Medicare-eligible residents seeking quality health coverage.",
    zipCodes: ["99201", "99202", "99203", "99204", "99205", "99206", "99207", "99208"],
  },
  {
    name: "Spokane Valley",
    slug: "spokane-valley",
    county: "Spokane County",
    state: "Washington",
    stateCode: "WA",
    description:
      "Spokane Valley is a vibrant community east of Spokane with many Medicare options available to its senior residents.",
    zipCodes: ["99016", "99037", "99206", "99212", "99216"],
  },
  {
    name: "Cheney",
    slug: "cheney",
    county: "Spokane County",
    state: "Washington",
    stateCode: "WA",
    description:
      "Home to Eastern Washington University, Cheney offers Medicare beneficiaries access to quality healthcare and insurance options.",
    zipCodes: ["99004"],
  },
  {
    name: "Airway Heights",
    slug: "airway-heights",
    county: "Spokane County",
    state: "Washington",
    stateCode: "WA",
    description:
      "Located near Fairchild Air Force Base, Airway Heights residents have access to a growing range of Medicare Advantage and Supplement plans.",
    zipCodes: ["99001"],
  },
  {
    name: "Liberty Lake",
    slug: "liberty-lake",
    county: "Spokane County",
    state: "Washington",
    stateCode: "WA",
    description:
      "One of Washington's newest cities, Liberty Lake offers suburban living with easy access to Spokane-area Medicare insurance options.",
    zipCodes: ["99019"],
  },
  {
    name: "Medical Lake",
    slug: "medical-lake",
    county: "Spokane County",
    state: "Washington",
    stateCode: "WA",
    description:
      "Medical Lake is a small city west of Spokane with Medicare plans tailored to its close-knit senior community.",
    zipCodes: ["99022"],
  },
  {
    name: "Mead",
    slug: "mead",
    county: "Spokane County",
    state: "Washington",
    stateCode: "WA",
    description:
      "Mead is a northern Spokane suburb where Medicare beneficiaries can find comprehensive coverage options.",
    zipCodes: ["99021"],
  },
  {
    name: "Deer Park",
    slug: "deer-park",
    county: "Spokane County",
    state: "Washington",
    stateCode: "WA",
    description:
      "Deer Park is a small community north of Spokane offering Medicare plans for its growing senior population.",
    zipCodes: ["99006"],
  },
];

export function getCityBySlug(slug: string): City | undefined {
  return spokaneAreaCities.find((city) => city.slug === slug);
}

export function getAllCitySlugs(): string[] {
  return spokaneAreaCities.map((city) => city.slug);
}
