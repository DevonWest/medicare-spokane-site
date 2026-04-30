export type TeamMember = {
  name: string;
  title: string;
  shortBio: string;
  specialties?: string[];
  image: string;
  phone?: string;
  email?: string;
  scheduleUrl?: string;
  active: boolean;
  sortOrder: number;
};

export const teamMembers: TeamMember[] = [
  {
    name: "Devon West",
    title: "Owner & Licensed Insurance Professional",
    shortBio:
      "Devon is the owner of Health Insurance Options LLC and has more than a decade of experience helping Spokane-area residents compare Medicare options. A Spokane local, he offers no-cost consultations and is available year-round — not just during enrollment season.",
    specialties: [
      "Medicare Advantage",
      "Medicare Supplement (Medigap)",
      "Medicare Part D",
      "Turning 65 Guidance",
    ],
    image: "/team/devon-west.jpg",
    phone: "509-353-0476",
    email: "info@medicareinspokane.com",
    active: true,
    sortOrder: 1,
  },
  {
    name: "Denise West",
    title: "Licensed Insurance Professional",
    shortBio:
      "Denise is a licensed insurance professional with years of experience helping Spokane-area residents navigate Medicare at every stage — from turning 65 to reviewing existing coverage. She is known for her patient, no-pressure approach to even the most complex plan decisions.",
    specialties: [
      "New to Medicare",
      "Medicare Advantage",
      "Medicare Supplement (Medigap)",
      "Retirement Transitions",
    ],
    image: "/team/denise-west.jpg",
    phone: "509-353-0476",
    email: "info@medicareinspokane.com",
    active: true,
    sortOrder: 2,
  },
  {
    name: "Cathy Franklin",
    title: "Licensed Insurance Professional",
    shortBio:
      "Cathy is a Spokane native and licensed insurance professional with deep expertise in Medicare Supplement and Part D prescription drug coverage. She regularly sits down with clients and their medication lists to find coverage that fits their pharmacy preferences and budget.",
    specialties: [
      "Medicare Supplement (Medigap)",
      "Medicare Part D",
      "Prescription Drug Review",
      "Supplemental Insurance",
    ],
    image: "/team/cathy-franklin.jpg",
    phone: "509-353-0476",
    email: "info@medicareinspokane.com",
    active: true,
    sortOrder: 3,
  },
  {
    name: "Kristy",
    title: "Licensed Insurance Professional",
    shortBio:
      "Kristy is a licensed insurance professional with Health Insurance Options LLC who helps Spokane-area residents compare Medicare Advantage and supplemental coverage options. She takes a client-first approach, making sure every person understands their choices before enrolling.",
    specialties: [
      "Medicare Advantage",
      "Supplemental Insurance",
      "Annual Plan Reviews",
    ],
    image: "/team/kristy.jpg",
    phone: "509-353-0476",
    email: "info@medicareinspokane.com",
    active: true,
    sortOrder: 4,
  },
];

/** Returns only active members sorted by sortOrder. */
export function getActiveTeamMembers(): TeamMember[] {
  return teamMembers
    .filter((m) => m.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
