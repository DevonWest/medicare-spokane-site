import type { Metadata } from "next";
import ReviewFeedbackForm from "@/components/ReviewFeedbackForm";
import { siteConfig } from "@/lib/site";
import { getReviewRatingValue, sanitizeReviewSlug } from "@/lib/reviewFlow";
import { getTeamMemberBySlug, isReviewableTeamMember } from "@/lib/team";

export const metadata: Metadata = {
  title: "Share Feedback | Medicare in Spokane",
  description: "Share private feedback with the Medicare in Spokane team so we can follow up and improve.",
  alternates: { canonical: `${siteConfig.url}/review/feedback` },
  robots: {
    index: false,
    follow: false,
  },
};

interface ReviewFeedbackPageProps {
  searchParams: Promise<{ agent?: string; rating?: string }>;
}

export default async function ReviewFeedbackPage({ searchParams }: ReviewFeedbackPageProps) {
  const { agent, rating } = await searchParams;
  const agentSlug = sanitizeReviewSlug(agent);
  const member = agentSlug ? getTeamMemberBySlug(agentSlug) : undefined;
  const reviewableMember = member && isReviewableTeamMember(member) ? member : undefined;

  return (
    <ReviewFeedbackForm
      agentSlug={agentSlug}
      agentName={reviewableMember?.name}
      rating={getReviewRatingValue(rating)}
    />
  );
}
