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
    width: 1000,
    height: 1229,
  },
  compareOptions: {
    src: "/illustrations/compare-options.png",
    width: 1000,
    height: 1195,
  },
  helpingParent: {
    src: "/illustrations/helping-parent.png",
    width: 1000,
    height: 1154,
  },
  homepageGuidance: {
    src: "/illustrations/homepage-guidance.png",
    width: 1000,
    height: 1078,
  },
  officeLocation: {
    src: "/illustrations/office-location.png",
    width: 1000,
    height: 1104,
  },
  prescriptionReview: {
    src: "/illustrations/prescription-review.png",
    width: 1000,
    height: 1206,
  },
  requestConfirmation: {
    src: "/illustrations/request-confirmation.png",
    width: 1000,
    height: 1176,
  },
  turning65Checklist: {
    src: "/illustrations/turning-65-checklist.png",
    width: 1000,
    height: 1173,
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
      loading={priority ? undefined : "lazy"}
      sizes={sizes}
      className={["h-auto w-full", className].filter(Boolean).join(" ")}
    />
  );
}
