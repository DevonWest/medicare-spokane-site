import Image from "next/image";

type FriendlyIllustrationName =
  | "annualPlanReview"
  | "compareOptions"
  | "helpingParent"
  | "homepageGuidance"
  | "officeLocation"
  | "prescriptionReview"
  | "requestConfirmation"
  | "turning65Checklist";

interface FriendlyIllustrationProps {
  name: FriendlyIllustrationName;
  alt?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

const illustrations: Record<FriendlyIllustrationName, { src: string; width: number; height: number }> = {
  annualPlanReview: {
    src: "/illustrations/annual-plan-review.svg",
    width: 960,
    height: 640,
  },
  compareOptions: {
    src: "/illustrations/compare-options.svg",
    width: 960,
    height: 640,
  },
  helpingParent: {
    src: "/illustrations/helping-parent.svg",
    width: 960,
    height: 640,
  },
  homepageGuidance: {
    src: "/illustrations/homepage-guidance.svg",
    width: 960,
    height: 640,
  },
  officeLocation: {
    src: "/illustrations/office-location.svg",
    width: 960,
    height: 640,
  },
  prescriptionReview: {
    src: "/illustrations/prescription-review.svg",
    width: 960,
    height: 640,
  },
  requestConfirmation: {
    src: "/illustrations/request-confirmation.svg",
    width: 960,
    height: 640,
  },
  turning65Checklist: {
    src: "/illustrations/turning-65-checklist.svg",
    width: 960,
    height: 640,
  },
};

export default function FriendlyIllustration({
  name,
  alt = "",
  className,
  priority = false,
  sizes = "(min-width: 1024px) 24rem, (min-width: 768px) 20rem, 100vw",
}: FriendlyIllustrationProps) {
  const illustration = illustrations[name];

  return (
    <Image
      src={illustration.src}
      alt={alt}
      width={illustration.width}
      height={illustration.height}
      priority={priority}
      sizes={sizes}
      unoptimized
      className={["h-auto w-full", className].filter(Boolean).join(" ")}
    />
  );
}
