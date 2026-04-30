export type MedicareFAQ = {
  question: string;
  answer: string;
};

export type City = {
  name: string;
  slug: string;
  county: string;
  state: string;
  stateCode: string;
  description: string;
  heroSummary: string;
  localIntro: string;
  serviceAreaContext: string;
  faqLocalContext: string;
  nearbyCommunities: string[];
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
    heroSummary:
      "Straightforward Medicare guidance for Spokane residents who want local help reviewing plan types, prescription coverage, provider access, and out-of-pocket costs.",
    localIntro:
      "Health Insurance Options LLC helps residents in Spokane compare Medicare Advantage, Medicare Supplement, Part D, and supplemental insurance options with guidance from a Spokane-based licensed independent insurance agency.",
    serviceAreaContext:
      "Because many Spokane residents receive care across the South Hill, Downtown, North Spokane, and Spokane Valley — and may also visit providers in Cheney, Airway Heights, Liberty Lake, Medical Lake, Mead, or Deer Park — it helps to compare plans with your full Spokane-area routine in mind.",
    faqLocalContext:
      "We regularly help Spokane residents who want to review options before turning 65, after leaving employer coverage, or during Annual Enrollment.",
    nearbyCommunities: ["Spokane Valley", "Cheney", "Airway Heights", "Liberty Lake"],
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
    heroSummary:
      "Local Medicare help for Spokane Valley residents who want to compare coverage with east-county provider access, pharmacy convenience, and predictable costs in mind.",
    localIntro:
      "Health Insurance Options LLC helps residents in Spokane Valley compare Medicare Advantage, Medicare Supplement, Part D, and supplemental insurance options with clear guidance from a Spokane-based licensed independent insurance agency.",
    serviceAreaContext:
      "Many Spokane Valley residents move between Spokane Valley, Spokane, Liberty Lake, and other nearby east-county communities for appointments, errands, and family support, so provider networks and pharmacy access should be reviewed in that broader Spokane-area context.",
    faqLocalContext:
      "We regularly help Spokane Valley residents compare plans when they want convenient access to care across the Valley, Spokane, and Liberty Lake while reviewing the plans we represent.",
    nearbyCommunities: ["Spokane", "Liberty Lake", "Veradale", "Millwood"],
    zipCodes: ["99016", "99037", "99206", "99212", "99216"],
  },
  {
    name: "Liberty Lake",
    slug: "liberty-lake",
    county: "Spokane County",
    state: "Washington",
    stateCode: "WA",
    description:
      "One of Washington's newest cities, Liberty Lake offers suburban living with easy access to Spokane-area Medicare insurance options.",
    heroSummary:
      "Medicare guidance for Liberty Lake residents who want to compare plans without losing sight of pharmacy access, ZIP-based availability, and east-county provider networks.",
    localIntro:
      "Health Insurance Options LLC helps residents in Liberty Lake compare Medicare Advantage, Medicare Supplement, Part D, and supplemental insurance options with no-pressure guidance from a Spokane-based licensed independent insurance agency.",
    serviceAreaContext:
      "People in Liberty Lake often use providers, pharmacies, and specialists across Liberty Lake, Spokane Valley, Spokane, and nearby Idaho-border communities, so it is smart to compare plans around the places you actually go for care.",
    faqLocalContext:
      "We regularly help Liberty Lake residents compare plans when they want provider and pharmacy access that works across the eastern Spokane County corridor.",
    nearbyCommunities: ["Spokane Valley", "Spokane", "Post Falls", "Otis Orchards"],
    zipCodes: ["99019"],
  },
  {
    name: "Cheney",
    slug: "cheney",
    county: "Spokane County",
    state: "Washington",
    stateCode: "WA",
    description:
      "Home to Eastern Washington University, Cheney offers Medicare beneficiaries access to quality healthcare and insurance options.",
    heroSummary:
      "Helpful Medicare comparisons for Cheney residents who want coverage that fits west-county travel patterns, prescription needs, and access to Spokane-area care.",
    localIntro:
      "Health Insurance Options LLC helps residents in Cheney compare Medicare Advantage, Medicare Supplement, Part D, and supplemental insurance options with support from a Spokane-based licensed independent insurance agency.",
    serviceAreaContext:
      "Cheney residents often travel between Cheney, Spokane, Airway Heights, and Medical Lake for doctor visits, prescriptions, and family routines, so comparing plans should account for both local care and Spokane-area specialists.",
    faqLocalContext:
      "We regularly help Cheney residents compare plans when they split their time between Cheney and Spokane for medical appointments, prescriptions, and family support.",
    nearbyCommunities: ["Spokane", "Airway Heights", "Medical Lake", "Fairfield"],
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
    heroSummary:
      "Local Medicare guidance for Airway Heights residents who want to compare plans around west-side travel, provider access, and prescription costs.",
    localIntro:
      "Health Insurance Options LLC helps residents in Airway Heights compare Medicare Advantage, Medicare Supplement, Part D, and supplemental insurance options with guidance from a Spokane-based licensed independent insurance agency.",
    serviceAreaContext:
      "Many Airway Heights residents travel between Airway Heights, Spokane, Cheney, and Medical Lake for care and daily errands, so it helps to review plan networks, drug coverage, and consultation options with those Spokane-area connections in mind.",
    faqLocalContext:
      "We regularly help Airway Heights residents compare plans that fit care needs in Airway Heights, Spokane, and nearby west-county communities.",
    nearbyCommunities: ["Spokane", "Cheney", "Medical Lake", "Fairchild area"],
    zipCodes: ["99001"],
  },
  {
    name: "Medical Lake",
    slug: "medical-lake",
    county: "Spokane County",
    state: "Washington",
    stateCode: "WA",
    description:
      "Medical Lake is a small city west of Spokane with Medicare plans tailored to its close-knit senior community.",
    heroSummary:
      "Practical Medicare help for Medical Lake residents who want to compare plans around small-town convenience, prescription coverage, and travel into Spokane for care.",
    localIntro:
      "Health Insurance Options LLC helps residents in Medical Lake compare Medicare Advantage, Medicare Supplement, Part D, and supplemental insurance options with clear, local guidance from a Spokane-based licensed independent insurance agency.",
    serviceAreaContext:
      "Medical Lake residents often balance local convenience with trips to Airway Heights, Cheney, and Spokane for doctors, specialists, and pharmacies, so comparing plans should reflect how and where you actually receive care.",
    faqLocalContext:
      "We regularly help Medical Lake residents review coverage when they want simple guidance on local access, prescription costs, and travel into Spokane for care.",
    nearbyCommunities: ["Airway Heights", "Cheney", "Spokane", "Four Lakes"],
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
    heroSummary:
      "Local Medicare comparisons for Mead residents who want north-corridor provider access, dependable prescription coverage, and help from a Spokane-based agency.",
    localIntro:
      "Health Insurance Options LLC helps residents in Mead compare Medicare Advantage, Medicare Supplement, Part D, and supplemental insurance options with support from a Spokane-based licensed independent insurance agency.",
    serviceAreaContext:
      "Because many Mead residents use care, pharmacies, and family support networks across Mead, North Spokane, Deer Park, and the rest of Spokane County, it is useful to compare plans around the routes and providers you rely on most.",
    faqLocalContext:
      "We regularly help Mead residents compare plans with North Spokane provider access, prescription costs, and ongoing support in mind.",
    nearbyCommunities: ["Spokane", "Deer Park", "Colbert", "North Spokane"],
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
    heroSummary:
      "Straightforward Medicare guidance for Deer Park residents who want to compare plans around distance, pharmacy access, and trips into greater Spokane for care.",
    localIntro:
      "Health Insurance Options LLC helps residents in Deer Park compare Medicare Advantage, Medicare Supplement, Part D, and supplemental insurance options with guidance from a Spokane-based licensed independent insurance agency.",
    serviceAreaContext:
      "Deer Park residents often think about travel time when they compare coverage, especially if they use pharmacies or specialists in Mead, North Spokane, or Spokane, so plan networks and out-of-pocket costs deserve a close look.",
    faqLocalContext:
      "We regularly help Deer Park residents compare plans when distance, preferred pharmacies, and trips into Mead or Spokane matter.",
    nearbyCommunities: ["Mead", "Spokane", "Colbert", "Chattaroy"],
    zipCodes: ["99006"],
  },
];

export function getCityBySlug(slug: string): City | undefined {
  return spokaneAreaCities.find((city) => city.slug === slug);
}

export function getAllCitySlugs(): string[] {
  return spokaneAreaCities.map((city) => city.slug);
}

export function getLocalMedicarePath(slug: string): string {
  return slug === "spokane" ? "/medicare-spokane" : `/medicare-${slug}`;
}

export function getAllLocalMedicarePaths(): string[] {
  return spokaneAreaCities.map((city) => getLocalMedicarePath(city.slug));
}
