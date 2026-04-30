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
    title: "Licensed Insurance Agent",
    shortBio:
      "Lynn Wold is the founder of Health Insurance Options LLC and has helped Spokane-area residents navigate Medicare for many years. She brings a warm, practical approach to guiding clients through their options and focuses on helping people feel confident in their coverage decisions. Lynn is passionate about providing clear, local Medicare guidance tailored to each client’s needs.",
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
      "Craig Lenhart helps Spokane-area residents find straightforward answers when comparing Medicare plans. He works closely with clients to review coverage options, provider networks, and prescription needs so they can make informed decisions without feeling overwhelmed. Craig’s approach is focused on clarity, organization, and personalized support.",
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
      "Meg Shumaker works with local clients to make Medicare feel more approachable and manageable. She helps Spokane-area residents understand their coverage options, including Medicare Advantage, Supplements, Part D, and supplemental insurance. Meg focuses on keeping the process organized, clear, and comfortable for every client.",
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
      "Rose Records brings a helpful, client-first approach to Medicare conversations. She works with Spokane-area residents to review their options and understand how different plans may fit their healthcare and budget needs. Rose is committed to making the process clear, supportive, and easy to navigate.",
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
      "Sheryl Manchester helps Spokane-area clients sort through Medicare questions with clear, friendly guidance. She focuses on helping each person compare options and feel confident in the coverage they choose. Sheryl is known for her patience and ability to simplify complex Medicare decisions.",
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
      "Karen Speerstra is an experienced office coordinator who helps keep the Health Insurance Options team organized and responsive to client needs. She supports scheduling, communication, and day-to-day operations to help ensure each client has a smooth and positive experience. Karen plays an important role in helping Spokane-area residents stay connected with the right support.",
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
    name: "Karen Christensen",
    title: "Office Coordinator",
    shortBio:
      "Karen Christensen supports both clients and agents through friendly, detail-oriented coordination. She helps Spokane-area residents stay connected throughout the Medicare process, assisting with scheduling, follow-up, and general support. Karen helps ensure each client experience is smooth and well-organized.",
    specialties: [
      "Client Scheduling",
      "Office Support",
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
