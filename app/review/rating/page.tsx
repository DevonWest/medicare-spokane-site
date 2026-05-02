import type { Metadata } from "next";
import ReviewRatingSelector from "@/components/ReviewRatingSelector";
import { siteConfig } from "@/lib/site";
import { sanitizeReviewSlug } from "@/lib/reviewFlow";
import { getTeamMemberBySlug, isReviewableTeamMember } from "@/lib/team";

export const metadata: Metadata = {
  title: "Rate Your Experience | Medicare in Spokane",
  description: "Choose a star rating for your experience with Medicare in Spokane by Health Insurance Options.",
  alternates: { canonical: `${siteConfig.url}/review/rating` },
  robots: {
    index: false,
    follow: false,
  },
};

interface ReviewRatingPageProps {
  searchParams: Promise<{ agent?: string }>;
}

export default async function ReviewRatingPage({ searchParams }: ReviewRatingPageProps) {
  const { agent } = await searchParams;
  const agentSlug = sanitizeReviewSlug(agent);
  const member = agentSlug ? getTeamMemberBySlug(agentSlug) : undefined;
  const reviewableMember = member && isReviewableTeamMember(member) ? member : undefined;

  return <ReviewRatingSelector agentSlug={agentSlug} agentName={reviewableMember?.name} />;
}
