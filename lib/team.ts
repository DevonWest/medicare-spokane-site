export type TeamMember = {
  name: string;
  title: string;
  shortBio: string;
  longBio?: string;
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
      "Devon founded Health Insurance Options LLC to bring straightforward, local Medicare guidance to Spokane-area residents. With over a decade of Medicare insurance experience, he focuses on helping clients compare options that fit their doctors, prescriptions, and budgets — all at no cost.",
    longBio:
      "Devon West is the owner of Health Insurance Options LLC and has spent more than a decade helping Spokane-area residents navigate Medicare. He founded the agency after recognizing how confusing the Medicare enrollment process can be for people turning 65 or retiring — and wanted to create a local resource offering honest, no-pressure guidance. Devon specializes in Medicare Advantage, Medicare Supplement, and Part D plans, and takes pride in walking every client through their available options at no cost. He lives and works in Spokane and stays available to clients year-round, not just at enrollment time.",
    specialties: [
      "Medicare Advantage",
      "Medicare Supplement (Medigap)",
      "Medicare Part D",
      "Turning 65 Guidance",
    ],
    image: "/team/devon-west.jpg",
    phone: "509-353-0476",
    email: "info@medicareinspokane.com",
    scheduleUrl: "",
    active: true,
    sortOrder: 1,
  },
  {
    name: "Denise West",
    title: "Licensed Insurance Professional",
    shortBio:
      "Denise brings warmth and deep Medicare knowledge to every client conversation. She specializes in helping clients who are new to Medicare, assisting with enrollment decisions, and working with families navigating coverage changes together.",
    longBio:
      "Denise West is a licensed insurance professional with Health Insurance Options LLC. She has years of experience helping Spokane-area residents understand their Medicare choices and is known for her patient, thorough approach. Denise is especially skilled at helping clients who are new to Medicare — whether they are turning 65, transitioning off an employer plan, or helping a parent review coverage. She takes the time to understand each client's unique situation before reviewing plan options.",
    specialties: [
      "New to Medicare",
      "Medicare Advantage",
      "Medicare Supplement (Medigap)",
      "Retirement Transitions",
    ],
    image: "/team/denise-west.jpg",
    phone: "509-353-0476",
    email: "info@medicareinspokane.com",
    scheduleUrl: "",
    active: true,
    sortOrder: 2,
  },
  {
    name: "Cathy Franklin",
    title: "Licensed Insurance Professional",
    shortBio:
      "Cathy is a Spokane local with extensive experience in Medicare Supplement and prescription drug planning. She is known for her clear explanations and commitment to making sure clients feel confident in their coverage decisions.",
    longBio:
      "Cathy Franklin is a licensed insurance professional and Spokane native who has spent her career helping local residents compare Medicare coverage options. She has a particular strength in Medicare Supplement plans and Part D prescription drug coverage, often sitting down with clients and their medication lists to identify coverage that fits their pharmacy and budget preferences. Cathy's friendly, no-pressure style makes even complex Medicare topics easy to understand.",
    specialties: [
      "Medicare Supplement (Medigap)",
      "Medicare Part D",
      "Prescription Drug Review",
      "Supplemental Insurance",
    ],
    image: "/team/cathy-franklin.jpg",
    phone: "509-353-0476",
    email: "info@medicareinspokane.com",
    scheduleUrl: "",
    active: true,
    sortOrder: 3,
  },
  {
    // TODO: Confirm last name — listed as "Kristy" on the current site; update when known.
    name: "Kristy",
    title: "Licensed Insurance Professional",
    shortBio:
      "Kristy brings a client-first approach to Medicare planning, helping Spokane-area residents review plan options and understand their benefits. She is committed to making Medicare straightforward and accessible for everyone.",
    longBio:
      "Kristy is a licensed insurance professional with Health Insurance Options LLC. She works with clients across Spokane and Eastern Washington to review Medicare Advantage and supplemental coverage options. Known for her approachable manner and attention to detail, Kristy ensures every client understands their choices before making a decision.",
    specialties: [
      "Medicare Advantage",
      "Supplemental Insurance",
      "Annual Plan Reviews",
    ],
    image: "/team/kristy.jpg",
    phone: "509-353-0476",
    email: "info@medicareinspokane.com",
    scheduleUrl: "",
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
