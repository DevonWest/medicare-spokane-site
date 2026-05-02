import { type ReactNode } from "react";

interface IllustrationProps {
  className?: string;
  title?: string;
}

interface IllustrationSvgProps extends IllustrationProps {
  children: ReactNode;
  viewBox?: string;
}

const palette = {
  ink: "#334155",
  muted: "#64748b",
  line: "#d6dee7",
  navy: "#36506b",
  blue: "#7ca7c9",
  blueLight: "#dceaf5",
  beige: "#f5ede3",
  beigeDark: "#d7c1aa",
  cream: "#fcfaf7",
  green: "#7ea386",
  greenLight: "#dfeade",
  warmGray: "#ece7e0",
  white: "#ffffff",
};

function IllustrationSvg({
  children,
  className,
  title,
  viewBox = "0 0 360 240",
}: IllustrationSvgProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      className={["h-auto w-full", className].filter(Boolean).join(" ")}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="none"
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

function SoftScene() {
  return (
    <>
      <rect x="18" y="16" width="324" height="208" rx="30" fill={palette.cream} />
      <rect x="32" y="30" width="296" height="180" rx="24" fill={palette.white} stroke={palette.warmGray} strokeWidth="1.5" />
      <path d="M56 190h248" stroke={palette.line} strokeWidth="3" strokeLinecap="round" />
      <circle cx="70" cy="62" r="12" fill={palette.beige} />
      <circle cx="292" cy="58" r="10" fill={palette.greenLight} />
    </>
  );
}

function PersonFigure({
  x,
  y,
  shirt = palette.blue,
  hair = palette.beigeDark,
  scale = 1,
}: {
  x: number;
  y: number;
  shirt?: string;
  hair?: string;
  scale?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle cx="0" cy="0" r="16" fill={palette.beige} stroke={palette.ink} strokeWidth="2.5" />
      <path d="M-12-5c2-10 20-10 24 0" stroke={hair} strokeWidth="6" strokeLinecap="round" />
      <path d="M-18 42c3-16 15-24 18-24s15 8 18 24" fill={shirt} stroke={palette.ink} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M-6 6c2 2 10 2 12 0" stroke={palette.muted} strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function Desk({ x, y, width = 162 }: { x: number; y: number; width?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={width} height="18" rx="9" fill={palette.beige} stroke={palette.beigeDark} strokeWidth="2" />
      <path d={`M${x + 18} ${y + 18}v28M${x + width - 18} ${y + 18}v28`} stroke={palette.beigeDark} strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

function DocumentCard({
  x,
  y,
  width,
  height,
  accent = palette.blue,
  fill = palette.white,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  accent?: string;
  fill?: string;
}) {
  const bottomWidth = Math.max(width - 30, 12);
  const middleWidth = Math.max(width - 40, 12);
  const topWidth = Math.min(width - 24, 56);

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx="16" fill={fill} stroke={palette.line} strokeWidth="2" />
      <rect x={x + 12} y={y + 12} width={topWidth} height="10" rx="5" fill={accent} />
      <path
        d={`M${x + 12} ${y + 38}h${bottomWidth} M${x + 12} ${y + 54}h${middleWidth} M${x + 12} ${y + 70}h${Math.max(width - 54, 10)}`}
        stroke={palette.muted}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </g>
  );
}

function CheckMark({ x, y, color = palette.green }: { x: number; y: number; color?: string }) {
  return <path d={`M${x} ${y}l6 6 12-14`} stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />;
}

function PillBottle({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x="0" y="10" width="42" height="62" rx="12" fill={palette.greenLight} stroke={palette.green} strokeWidth="2" />
      <rect x="8" y="0" width="26" height="18" rx="9" fill={palette.green} />
      <rect x="9" y="28" width="24" height="18" rx="7" fill={palette.white} />
      <path d="M15 37h12" stroke={palette.green} strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

function CalendarCard({ x, y, label, number }: { x: number; y: number; label?: string; number: string }) {
  return (
    <g>
      <rect x={x} y={y} width="112" height="98" rx="18" fill={palette.white} stroke={palette.line} strokeWidth="2" />
      <rect x={x} y={y} width="112" height="28" rx="18" fill={palette.blueLight} />
      <path d={`M${x + 24} ${y - 8}v20M${x + 88} ${y - 8}v20`} stroke={palette.navy} strokeWidth="4" strokeLinecap="round" />
      {label ? (
        <text x={x + 56} y={y + 18} textAnchor="middle" fontSize="11" fontWeight="700" fill={palette.navy}>
          {label}
        </text>
      ) : null}
      <text x={x + 56} y={y + 68} textAnchor="middle" fontSize="38" fontWeight="700" fill={palette.navy}>
        {number}
      </text>
    </g>
  );
}

function PhoneCard({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width="62" height="84" rx="16" fill={palette.white} stroke={palette.line} strokeWidth="2" />
      <rect x={x + 18} y={y + 10} width="26" height="6" rx="3" fill={palette.line} />
      <path
        d={`M${x + 22} ${y + 34}c4-8 10-10 14-10 5 0 10 2 14 10M${x + 20} ${y + 44}c6 6 10 11 22 17M${x + 40} ${y + 70}c6-2 10-5 14-11`}
        stroke={palette.navy}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </g>
  );
}

function MapPin({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M18 38S36 24.4 36 12A18 18 0 1 0 0 12c0 12.4 18 26 18 26Z" fill={palette.blueLight} stroke={palette.navy} strokeWidth="2.5" />
      <circle cx="18" cy="12" r="6" fill={palette.white} stroke={palette.navy} strokeWidth="2" />
    </g>
  );
}

function BadgeCard({ x, y, width = 82, label = "PLAN" }: { x: number; y: number; width?: number; label?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={width} height="54" rx="14" fill={palette.white} stroke={palette.line} strokeWidth="2" />
      <rect x={x + 10} y={y + 10} width="34" height="8" rx="4" fill={palette.blue} />
      <text x={x + 10} y={y + 36} fontSize="10" fontWeight="700" fill={palette.navy}>
        {label}
      </text>
    </g>
  );
}

function FolderPocket({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path
        d={`M${x} ${y + 18}h74l14 14h104a16 16 0 0 1 16 16v64a16 16 0 0 1-16 16H${x + 12}a16 16 0 0 1-16-16V${y + 34}a16 16 0 0 1 16-16Z`}
        fill={palette.beige}
        stroke={palette.beigeDark}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect x={x + 24} y={y} width="104" height="88" rx="16" fill={palette.white} stroke={palette.line} strokeWidth="2" />
    </g>
  );
}

function CostTag({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <rect x={x} y={y} width="54" height="34" rx="12" fill={palette.white} stroke={palette.line} strokeWidth="2" />
      <text x={x + 27} y={y + 21} textAnchor="middle" fontSize="11" fontWeight="700" fill={palette.navy}>
        {label}
      </text>
    </g>
  );
}

export function HomepageHeroIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SoftScene />
      <PersonFigure x={98} y={108} shirt={palette.blueLight} hair={palette.beigeDark} />
      <PersonFigure x={244} y={108} shirt={palette.greenLight} hair={palette.muted} />
      <Desk x={106} y={150} width={150} />
      <DocumentCard x={144} y={110} width={82} height={54} accent={palette.green} fill={palette.cream} />
      <CheckMark x={190} y={147} />
      <BadgeCard x={68} y={128} width={58} label="NOTES" />
      <CostTag x={246} y={132} label="PLAN" />
      <path d="M116 136l26 6M218 136l24 5" stroke={palette.ink} strokeWidth="3" strokeLinecap="round" />
    </IllustrationSvg>
  );
}

export function MedicareHelpIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SoftScene />
      <DocumentCard x={62} y={68} width={112} height={112} accent={palette.navy} fill={palette.cream} />
      <CheckMark x={82} y={120} />
      <CheckMark x={82} y={138} />
      <CheckMark x={82} y={156} />
      <PhoneCard x={214} y={74} />
      <BadgeCard x={212} y={168} width={88} label="GUIDE" />
    </IllustrationSvg>
  );
}

export function TeamTrustIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SoftScene />
      <PersonFigure x={84} y={112} shirt={palette.blueLight} hair={palette.beigeDark} />
      <PersonFigure x={180} y={100} shirt={palette.cream} hair={palette.muted} scale={1.05} />
      <PersonFigure x={276} y={112} shirt={palette.greenLight} hair={palette.beigeDark} />
      <BadgeCard x={140} y={150} width={80} label="LOCAL" />
    </IllustrationSvg>
  );
}

export function ContactOfficeIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SoftScene />
      <rect x="54" y="88" width="122" height="86" rx="18" fill={palette.cream} stroke={palette.beigeDark} strokeWidth="2" />
      <rect x="72" y="70" width="86" height="24" rx="12" fill={palette.blueLight} />
      <path d="M88 174v-30h54v30M100 144v-18h30v18" stroke={palette.navy} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <MapPin x={210} y={72} />
      <PhoneCard x={264} y={86} />
      <BadgeCard x={194} y={162} width={92} label="VISIT" />
    </IllustrationSvg>
  );
}

export function LocalSpokaneIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SoftScene />
      <MapPin x={84} y={74} scale={1.05} />
      <BadgeCard x={142} y={84} width={92} label="OFFICE" />
      <PhoneCard x={254} y={74} />
      <path d="M70 174h214" stroke={palette.beigeDark} strokeWidth="4" strokeLinecap="round" />
    </IllustrationSvg>
  );
}

export function TestimonialsIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SoftScene />
      <DocumentCard x={58} y={92} width={88} height={64} accent={palette.blue} fill={palette.cream} />
      <DocumentCard x={136} y={74} width={88} height={82} accent={palette.green} fill={palette.white} />
      <DocumentCard x={214} y={92} width={88} height={64} accent={palette.blue} fill={palette.cream} />
      <path d="M114 180h132" stroke={palette.beigeDark} strokeWidth="4" strokeLinecap="round" />
    </IllustrationSvg>
  );
}

export function MedicareAdvantageIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SoftScene />
      <BadgeCard x={52} y={96} label="HMO" />
      <BadgeCard x={140} y={78} label="PPO" />
      <BadgeCard x={228} y={96} label="MAPD" />
      <path d="M134 124h10M222 124h10" stroke={palette.beigeDark} strokeWidth="3" strokeLinecap="round" />
      <CheckMark x={78} y={136} />
      <CheckMark x={166} y={118} />
      <CheckMark x={254} y={136} />
    </IllustrationSvg>
  );
}

export function MedicareSupplementIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SoftScene />
      <DocumentCard x={74} y={74} width={90} height={106} accent={palette.navy} fill={palette.cream} />
      <BadgeCard x={192} y={90} width={96} label="PLAN G" />
      <BadgeCard x={192} y={150} width={96} label="PLAN N" />
      <CheckMark x={226} y={116} />
      <CheckMark x={226} y={176} />
    </IllustrationSvg>
  );
}

export function PartDIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SoftScene />
      <DocumentCard x={56} y={72} width={108} height={110} accent={palette.green} fill={palette.cream} />
      <CheckMark x={76} y={122} />
      <CheckMark x={76} y={140} />
      <PillBottle x={198} y={82} />
      <BadgeCard x={248} y={118} width={76} label="RX" />
      <CostTag x={236} y={170} label="CARD" />
    </IllustrationSvg>
  );
}

export function SupplementalInsuranceIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SoftScene />
      <BadgeCard x={58} y={102} width={86} label="DENTAL" />
      <BadgeCard x={146} y={82} width={86} label="VISION" />
      <BadgeCard x={234} y={102} width={86} label="EXTRA" />
      <CheckMark x={84} y={142} />
      <CheckMark x={172} y={122} />
      <CheckMark x={260} y={142} />
    </IllustrationSvg>
  );
}

export function CarrierOptionsIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SoftScene />
      <BadgeCard x={54} y={96} width={78} label="A" />
      <BadgeCard x={141} y={82} width={78} label="B" />
      <BadgeCard x={228} y={96} width={78} label="C" />
      <path d="M132 122h9M219 122h9" stroke={palette.beigeDark} strokeWidth="3" strokeLinecap="round" />
      <path d="M166 160h30M154 176h54" stroke={palette.muted} strokeWidth="3.5" strokeLinecap="round" />
    </IllustrationSvg>
  );
}

export function Turning65Illustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SoftScene />
      <CalendarCard x={50} y={68} label="BIRTHDAY" number="65" />
      <DocumentCard x={194} y={82} width={94} height={92} accent={palette.green} fill={palette.cream} />
      <CheckMark x={212} y={122} />
      <CheckMark x={212} y={140} />
      <CheckMark x={212} y={158} />
    </IllustrationSvg>
  );
}

export function WorkingPast65Illustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SoftScene />
      <CalendarCard x={54} y={78} label="WORK" number="65" />
      <BadgeCard x={192} y={86} width={104} label="HR NOTE" />
      <DocumentCard x={204} y={142} width={92} height={48} accent={palette.green} fill={palette.white} />
      <CheckMark x={222} y={174} />
    </IllustrationSvg>
  );
}

export function HelpingParentIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SoftScene />
      <PersonFigure x={94} y={108} shirt={palette.blueLight} hair={palette.beigeDark} />
      <PersonFigure x={246} y={112} shirt={palette.greenLight} hair={palette.muted} />
      <Desk x={106} y={152} width={148} />
      <DocumentCard x={144} y={112} width={76} height={50} accent={palette.blue} fill={palette.cream} />
      <CheckMark x={184} y={145} />
      <path d="M116 136l26 7M220 136l-22 7" stroke={palette.ink} strokeWidth="3" strokeLinecap="round" />
    </IllustrationSvg>
  );
}

export function AppointmentChecklistIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SoftScene />
      <FolderPocket x={54} y={72} />
      <CheckMark x={92} y={112} />
      <CheckMark x={92} y={130} />
      <CheckMark x={92} y={148} />
      <PillBottle x={236} y={102} scale={0.86} />
      <BadgeCard x={226} y={164} width={82} label="CARD" />
    </IllustrationSvg>
  );
}

export function AnnualPlanReviewIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SoftScene />
      <DocumentCard x={132} y={70} width={96} height={118} accent={palette.navy} fill={palette.cream} />
      <CheckMark x={150} y={118} />
      <CheckMark x={150} y={136} />
      <CheckMark x={150} y={154} />
      <CostTag x={64} y={110} label="RX" />
      <CostTag x={238} y={110} label="DOC" />
      <CostTag x={64} y={152} label="COST" />
      <CostTag x={238} y={152} label="PHARM" />
    </IllustrationSvg>
  );
}

export function CompareOptionsIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SoftScene />
      <BadgeCard x={52} y={98} width={82} label="OPTION 1" />
      <BadgeCard x={140} y={82} width={82} label="OPTION 2" />
      <BadgeCard x={228} y={98} width={82} label="OPTION 3" />
      <CheckMark x={76} y={140} />
      <CheckMark x={164} y={124} />
      <CheckMark x={252} y={140} />
    </IllustrationSvg>
  );
}

export function MedicareConfusionIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SoftScene />
      <PersonFigure x={92} y={110} shirt={palette.blueLight} hair={palette.beigeDark} />
      <DocumentCard x={138} y={86} width={84} height={78} accent={palette.green} fill={palette.cream} />
      <CheckMark x={176} y={128} />
      <PhoneCard x={236} y={86} />
    </IllustrationSvg>
  );
}

export const PrescriptionReviewIllustration = PartDIllustration;
export const PlanReviewIllustration = AnnualPlanReviewIllustration;
