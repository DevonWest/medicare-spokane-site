export type TeamMember = {
  name: string;
  title: string;
  shortBio: string;
  specialties?: string[];
  image?: string;
  phone?: string;
  email?: string;
  scheduleUrl?: string;
  /** Optional number of years helping Spokane-area Medicare clients. */
  yearsHelping?: number;
  active: boolean;
  sortOrder: number;
};

export const teamMembers: TeamMember[] = [
  {
    name: "Lynn Wold",
    title: "Founder & Licensed Insurance Agent",
    shortBio:
      "Lynn founded Health Insurance Options LLC to give Spokane-area residents clear, local Medicare guidance. She helps clients compare options with a warm, practical approach focused on coverage that fits their needs.",
    specialties: [
      "Medicare Advantage",
      "Medicare Supplement (Medigap)",
      "Medicare Part D",
      "Local Medicare Guidance",
    ],
    phone: "509-353-0476",
    email: "info@medicareinspokane.com",
    image: "/team/lynn-wold.jpg",
    active: true,
    sortOrder: 1,
  },
  {
    name: "Craig Lenhart",
    title: "Licensed Insurance Agent",
    shortBio:
      "Craig works with Spokane-area Medicare clients who want straightforward answers before they choose coverage. He helps people review plan choices, provider needs, and prescription considerations without pressure.",
    specialties: [
      "Medicare Advantage",
      "Medicare Supplement (Medigap)",
      "Medicare Part D",
      "Plan Reviews",
    ],
    phone: "509-353-0476",
    email: "info@medicareinspokane.com",
    image: "/team/craig-lenhart.jpg",
    active: true,
    sortOrder: 2,
  },
  {
    name: "Meg Shumaker",
    title: "Licensed Insurance Agent",
    shortBio:
      "Meg helps local clients understand Medicare coverage in a way that feels approachable and organized. She supports Spokane-area residents as they compare Medicare Advantage, Medicare Supplement, Part D, and supplemental insurance options.",
    specialties: [
      "Medicare Advantage",
      "Medicare Supplement (Medigap)",
      "Medicare Part D",
      "Supplemental Insurance",
    ],
    phone: "509-353-0476",
    email: "info@medicareinspokane.com",
    image: "/team/meg-shumaker.jpg",
    active: true,
    sortOrder: 3,
  },
  {
    name: "Rose Records",
    title: "Licensed Insurance Agent",
    shortBio:
      "Rose brings a helpful, client-first style to Medicare conversations for Spokane-area residents. She helps people review their choices and understand how different coverage options may fit their health and budget needs.",
    specialties: [
      "Medicare Advantage",
      "Medicare Supplement (Medigap)",
      "Medicare Part D",
      "Client Support",
    ],
    phone: "509-353-0476",
    email: "info@medicareinspokane.com",
    image: "/team/rose-records.jpg",
    active: true,
    sortOrder: 4,
  },
  {
    name: "Sheryl Manchester",
    title: "Licensed Insurance Agent",
    shortBio:
      "Sheryl helps Spokane-area clients sort through Medicare questions with clear, friendly guidance. Her focus is helping each person compare options and feel confident about the coverage they choose.",
    specialties: [
      "Medicare Advantage",
      "Medicare Supplement (Medigap)",
      "Medicare Part D",
      "Coverage Reviews",
    ],
    phone: "509-353-0476",
    email: "info@medicareinspokane.com",
    image: "/team/sheryl-manchester.jpg",
    active: true,
    sortOrder: 5,
  },
  {
    name: "Karen Speerstra",
    title: "Office Coordinator",
    shortBio:
      "Anna helps keep the Health Insurance Options office organized and responsive for Spokane-area clients. She supports appointment coordination and helps connect callers with the right local team member.",
    specialties: [
      "Client Scheduling",
      "Office Support",
      "Local Client Service",
    ],
    phone: "509-353-0476",
    email: "info@medicareinspokane.com",
    image: "/team/karen-speerstra.jpg",
    active: true,
    sortOrder: 6,
  },
  {
    name: "Karen Christianson",
    title: "Office Coordinator",
    shortBio:
      "Karen supports clients and agents with friendly, detail-oriented office coordination. She helps Spokane-area residents get connected for Medicare reviews and follow-up support.",
    specialties: [
      "Client Scheduling",
      "Office Support",
      "Supplemental Insurance",
    ],
    phone: "509-353-0476",
    email: "info@medicareinspokane.com",
    image: "/team/karen-christiansen.jpg",
    active: true,
    sortOrder: 7,
  },
];

/** Returns only active members sorted by sortOrder. */
export function getActiveTeamMembers(): TeamMember[] {
  return teamMembers
    .filter((m) => m.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
