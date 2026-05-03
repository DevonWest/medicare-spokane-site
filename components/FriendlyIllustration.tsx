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
    src: "/illustrations/annual-plan-review.png",
    width: 960,
    height: 640,
  },
  compareOptions: {
    src: "/illustrations/compare-options.png",
    width: 960,
    height: 640,
  },
  helpingParent: {
    src: "/illustrations/helping-parent.png",
    width: 960,
    height: 640,
  },
  homepageGuidance: {
    src: "/illustrations/homepage-guidance.png",
    width: 960,
    height: 640,
  },
  officeLocation: {
    src: "/illustrations/office-location.png",
    width: 960,
    height: 640,
  },
  prescriptionReview: {
    src: "/illustrations/prescription-review.png",
    width: 960,
    height: 640,
  },
  requestConfirmation: {
    src: "/illustrations/request-confirmation.png",
    width: 960,
    height: 640,
  },
  turning65Checklist: {
    src: "/illustrations/turning-65-checklist.png",
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
      loading={priority ? "eager" : "lazy"}
      className={["h-auto w-full", className].filter(Boolean).join(" ")}
    />
  );
}
