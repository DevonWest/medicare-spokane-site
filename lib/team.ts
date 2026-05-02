export type TeamMember = {
  name: string;
  title: string;
  shortBio: string;
  longBio?: string;
  specialties?: string[];
  image?: string;
  phone?: string;
  email?: string;
  scheduleUrl?: string;
  /** Optional number of years helping Spokane-area Medicare clients. */
  yearsHelping?: number;
  retired?: boolean;
  reviewable?: boolean;
  active: boolean;
  sortOrder: number;
};

function normalizeTeamMemberSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const teamMembers: TeamMember[] = [
  {
    name: "Lynn Wold",
    title: "Founder & Licensed Insurance Agent",
    shortBio:
      "Lynn began her insurance career in 2010 and formed Health Insurance Options in 2012. A Washington native, Lynn brings a caring, practical approach to helping Spokane-area residents understand their Medicare options.",
    longBio:
      "Lynn’s background in volunteering helped shape her sincere appreciation and concern for seniors. She believes her career in Medicare insurance was “meant to be” and enjoys helping clients make sense of the information they receive from many different sources. Lynn and her husband raised five children and still live on the family farm in Mead.",
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
    reviewable: true,
    sortOrder: 1,
  },
  {
    name: "Craig Lenhart",
    title: "Licensed Insurance Agent",
    shortBio:
      "Craig brings more than 30 years of executive management and organizational leadership experience to his work with Medicare clients. He enjoys using a servant-leadership approach to help people compare options and feel more confident in their coverage decisions.",
    longBio:
      "Craig is an Eastern Washington University alum and attended Gonzaga’s Organizational Leadership master’s program. His background in leadership and organization helps him guide clients through Medicare choices in a clear, structured way. Outside of work, Craig enjoys spending time with his wife Linda, golfing, and high-performance driving.",
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
    reviewable: true,
    sortOrder: 2,
  },
  {
    name: "Meg Shumaker",
    title: "Licensed Insurance Agent",
    shortBio:
      "Meg began her insurance career in 2018 after working with the Associated Press for several years. A Spokane native, she is committed to helping clients understand Medicare and make well-educated decisions about their health care needs.",
    longBio:
      "Meg graduated from Gonzaga Prep and Washington State University. She began working with seniors at a local nursing home while still in high school, which helped shape her passion for serving older adults. Meg and her husband are raising two children and enjoy family time at their lake cabin with friends, relatives, and their dog Gracie.",
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
    reviewable: true,
    sortOrder: 3,
  },
  {
    name: "Rose Records",
    title: "Licensed Insurance Agent",
    shortBio:
      "Rose has been in the insurance industry for more than 15 years and joined Health Insurance Options in 2022. She enjoys helping others and brings a friendly, service-minded approach to Medicare conversations.",
    longBio:
      "Rose and her husband Bob have three grown children and two grandsons. She has spent many years volunteering, including more than 23 years supporting the Mt. Spokane Marching Band with Bob. Outside of insurance, Rose enjoys time with family and working on classic cars.",
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
    reviewable: true,
    sortOrder: 4,
  },
  {
    name: "Sheryl Manchester",
    title: "Licensed Insurance Agent",
    shortBio:
      "Sheryl began her sales career in 1991 and spent 26 years traveling throughout the United States and Canada for work. In 2017, she moved into business for herself in real estate and insurance, where she found a strong fit helping people through important decisions.",
    longBio:
      "Sheryl understands that Medicare can be challenging, whether someone is new to Medicare or already enrolled. She takes pride in making the process as easy as possible and helping clients make decisions that fit their needs. Sheryl enjoys time with family, her eight grandchildren, and friends, and she likes hiking, waterskiing, surfing, snowboarding, and playing pickleball.",
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
    reviewable: true,
    sortOrder: 5,
  },
  {
    name: "Karen Speerstra",
    title: "Retired",
    shortBio:
      "Karen Speerstra is retired, but her clients can still contact the Health Insurance Options office for assistance. She joined the insurance industry in 2009 and found great satisfaction in meeting and helping others.",
    longBio:
      "Karen is a Spokane native and has been married to her husband Bob since 1982. They raised three children and have several grandchildren. Before joining the insurance industry, Karen and Bob owned and operated a dairy for 12 years in the Battle Ground area, and after returning to Spokane in 1994, Karen worked for a small manufacturing company for 15 years.",
    specialties: [
      "Retired",
      "Client Support",
      "Local Service",
    ],
    phone: "509-353-0476",
    email: "info@medicareinspokane.com",
    image: "/team/karen-speerstra.jpg",
    retired: true,
    active: false,
    sortOrder: 6,
  },
  {
    name: "Karen Christensen",
    title: "Office Coordinator",
    shortBio:
      "Karen Christensen joined the Health Insurance Options team in April 2016 as Lynn Wold’s personal assistant and the friendly face at the front desk. She helps keep the office organized and supports clients and agents with a warm, helpful approach.",
    longBio:
      "Karen has worked with children and seniors for more than 25 years and enjoys helping others. She is also a director of a local dance company that helps children and adults of all ages, genders, financial situations, and physical or mental abilities participate in dance and perform for the community. Karen is a proud mom of three adult daughters and four grandsons.",
    specialties: [
      "Client Scheduling",
      "Office Support",
      "Local Client Service",
    ],
    phone: "509-353-0476",
    email: "info@medicareinspokane.com",
    image: "/team/karen-christiansen.jpg",
    active: true,
    sortOrder: 7,
  },
  {
    name: "Devon West",
    title: "Owner & Licensed Insurance Agent",
    shortBio:
      "Devon created Medicare Saving Solutions to help people on Medicare make confident, informed decisions about their health plan options. He focuses on educating people who are turning 65, helping clients compare options from the plans represented, and continuing to serve as a resource year after year.",
    longBio:
      "Devon started Medicare Saving Solutions with the goal of helping seniors avoid overpaying for Medicare Supplement or Medicare Advantage coverage when more suitable options may be available. He believes in straightforward education, clear explanations, and ongoing service so clients feel supported beyond the initial enrollment decision.",
    specialties: [
      "Medicare Advantage",
      "Medicare Supplement (Medigap)",
      "Medicare Part D",
      "Turning 65",
      "Plan Reviews",
    ],
    phone: "509-353-0476",
    email: "info@medicareinspokane.com",
    image: "/team/devon-west.jpg",
    active: true,
    reviewable: true,
    sortOrder: 8,
  },
  {
    name: "Denise Chan",
    title: "Co-Owner & Licensed Insurance Agent",
    shortBio:
      "Denise Chan is a dedicated insurance agent focused on Medicare health insurance. Her background in customer service helps her guide clients with patience, care, and attention to detail.",
    longBio:
      "Before focusing on Medicare insurance, Denise developed strong customer service skills through 12 years of experience at Bank of America. She is known for her commitment to client support and for helping people feel cared for throughout the Medicare decision process. Denise enjoys family life with Devon, their children, and their two huskies.",
    specialties: [
      "Medicare Advantage",
      "Medicare Supplement (Medigap)",
      "Medicare Part D",
      "Client Support",
      "Plan Reviews",
    ],
    phone: "509-353-0476",
    email: "info@medicareinspokane.com",
    image: "/team/denise-chan.jpg",
    active: true,
    reviewable: true,
    sortOrder: 9,
  },
  {
    name: "Kristi Wright",
    title: "Licensed Insurance Agent",
    shortBio:
      "Kristi Wright helps clients understand Medicare options in a way that feels approachable and organized. She is known for being knowledgeable, friendly, and patient while helping people compare coverage choices.",
    longBio:
      "Kristi works with individuals and families who need help reviewing Medicare options, prescription coverage, and plan changes. Clients frequently mention that she explains complex information clearly, answers questions patiently, and helps make the Medicare process feel less overwhelming.",
    specialties: [
      "Medicare Advantage",
      "Medicare Supplement (Medigap)",
      "Medicare Part D",
      "Prescription Reviews",
      "Plan Reviews",
    ],
    phone: "509-353-0476",
    email: "info@medicareinspokane.com",
    image: "/team/kristi-wright.jpg",
    active: true,
    reviewable: true,
    sortOrder: 10,
  },
  {
    name: "Cathy Franklin",
    title: "Licensed Insurance Agent",
    shortBio:
      "Cathy Franklin helps clients review Medicare options with patience, clarity, and care. She is known for answering questions thoroughly and helping people feel more confident about their coverage decisions.",
    longBio:
      "Cathy works with Medicare clients who need help understanding their options, reviewing supplemental coverage, and comparing health and prescription plan choices. Her approach is friendly, supportive, and focused on making sure clients understand what they are choosing.",
    specialties: [
      "Medicare Advantage",
      "Medicare Supplement (Medigap)",
      "Medicare Part D",
      "Supplemental Coverage",
      "Client Support",
    ],
    phone: "509-353-0476",
    email: "info@medicareinspokane.com",
    image: "/team/cathy-franklin.jpg",
    active: true,
    reviewable: true,
    sortOrder: 11,
  },
];

/** Returns only active members sorted by sortOrder. */
export function getActiveTeamMembers(): TeamMember[] {
  return teamMembers
    .filter((m) => m.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Returns all public team members, including retired members, sorted by sortOrder. */
export function getPublicTeamMembers(): TeamMember[] {
  return [...teamMembers].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getTeamMemberSlug(member: Pick<TeamMember, "name"> | string): string {
  return normalizeTeamMemberSlug(typeof member === "string" ? member : member.name);
}

export function isReviewableTeamMember(member: TeamMember): boolean {
  return member.active && !member.retired && member.reviewable === true;
}

export function getActiveReviewableTeamMembers(): TeamMember[] {
  return getActiveTeamMembers().filter(isReviewableTeamMember);
}

export function getTeamMemberBySlug(slug: string): TeamMember | undefined {
  const normalizedSlug = normalizeTeamMemberSlug(slug);
  return teamMembers.find((member) => getTeamMemberSlug(member) === normalizedSlug);
}
