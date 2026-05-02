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
  ink: "#1f2937",
  muted: "#64748b",
  line: "#cbd5e1",
  blue: "#2563eb",
  blueDark: "#1d4ed8",
  sky: "#0ea5e9",
  skyLight: "#e0f2fe",
  teal: "#0f766e",
  tealLight: "#ccfbf1",
  green: "#10b981",
  greenLight: "#d1fae5",
  amber: "#fbbf24",
  amberLight: "#fef3c7",
  warm: "#f5efe6",
  warmDark: "#d6bfa8",
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

function SceneFrame() {
  return (
    <>
      <rect x="18" y="16" width="324" height="208" rx="28" fill={palette.skyLight} />
      <circle cx="58" cy="56" r="18" fill={palette.greenLight} />
      <circle cx="304" cy="48" r="14" fill={palette.amberLight} />
      <path d="M52 198h256" stroke={palette.line} strokeWidth="6" strokeLinecap="round" />
    </>
  );
}

function Card({
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
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx="18" fill={fill} stroke={palette.line} strokeWidth="2" />
      <rect x={x + 14} y={y + 14} width={Math.min(width - 28, 58)} height="10" rx="5" fill={accent} opacity="0.95" />
      <path
        d={`M${x + 14} ${y + 42}h${Math.max(width - 28, 12)} M${x + 14} ${y + 58}h${Math.max(width - 42, 10)} M${x + 14} ${y + 74}h${Math.max(width - 54, 8)}`}
        stroke={palette.muted}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </g>
  );
}

function CheckMark({ x, y, color = palette.green }: { x: number; y: number; color?: string }) {
  return <path d={`M${x} ${y}l6 6 12-14`} stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />;
}

function ShieldCheck({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M0 6 16 0l16 6v11c0 10-8 17-16 21C8 34 0 27 0 17Z" fill={palette.greenLight} stroke={palette.green} strokeWidth="2.5" />
      <path d="M9 17l5 5 9-11" stroke={palette.teal} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

function MapPin({ x, y, scale = 1, fill = palette.amberLight }: { x: number; y: number; scale?: number; fill?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M14 30S28 19.4 28 9.6A14 14 0 0 0 0 9.6C0 19.4 14 30 14 30Z" fill={fill} stroke={palette.blue} strokeWidth="2.5" />
      <circle cx="14" cy="10" r="5" fill={palette.white} stroke={palette.blue} strokeWidth="2" />
    </g>
  );
}

function StarRow({ x, y }: { x: number; y: number }) {
  return (
    <g fill={palette.amber}>
      {[0, 1, 2, 3, 4].map((index) => (
        <path
          key={index}
          transform={`translate(${x + index * 18} ${y})`}
          d="M8 0l2.2 4.7L15 5.4l-3.5 3.3.9 4.9L8 11.1 3.6 13.6l.9-4.9L1 5.4l4.8-.7Z"
        />
      ))}
    </g>
  );
}

function SpeechBubble({ x, y, width = 66, height = 42, fill = palette.white }: { x: number; y: number; width?: number; height?: number; fill?: string }) {
  return (
    <g>
      <path
        d={`M${x + 14} ${y}h${width - 28}a14 14 0 0 1 14 14v${height - 18}a14 14 0 0 1-14 14H${x + 30}l-12 10 2-10h-6a14 14 0 0 1-14-14V${y + 14 - y}a14 14 0 0 1 14-14Z`}
        fill={fill}
        stroke={palette.line}
        strokeWidth="2"
      />
      <path d={`M${x + 16} ${y + 18}h${width - 32} M${x + 16} ${y + 30}h${width - 42}`} stroke={palette.muted} strokeWidth="3.5" strokeLinecap="round" />
    </g>
  );
}

function Avatar({ x, y, tone = palette.blue, accent = palette.tealLight, scale = 1 }: { x: number; y: number; tone?: string; accent?: string; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle cx="20" cy="18" r="14" fill={tone} opacity="0.18" />
      <circle cx="20" cy="14" r="10" fill={tone} opacity="0.9" />
      <path d="M0 46c4-14 14-22 20-22s16 8 20 22" stroke={tone} strokeWidth="8" strokeLinecap="round" />
      <rect x="7" y="30" width="26" height="14" rx="7" fill={accent} opacity="0.85" />
    </g>
  );
}

export function HomepageHeroIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SceneFrame />
      <Avatar x={42} y={74} tone={palette.blue} accent={palette.amberLight} />
      <Avatar x={240} y={86} tone={palette.teal} accent={palette.greenLight} />
      <Avatar x={288} y={92} tone={palette.blueDark} accent={palette.skyLight} scale={0.86} />
      <rect x="118" y="88" width="122" height="84" rx="20" fill={palette.white} stroke={palette.line} strokeWidth="2" />
      <rect x="132" y="76" width="80" height="22" rx="11" fill={palette.blue} />
      <path d="M138 118h72M138 136h58M138 154h42" stroke={palette.muted} strokeWidth="4" strokeLinecap="round" />
      <CheckMark x={204} y={121} />
      <CheckMark x={204} y={139} />
      <rect x="228" y="108" width="52" height="48" rx="14" fill={palette.amberLight} stroke={palette.warmDark} strokeWidth="2" />
      <path d="M242 122h24M242 136h16" stroke={palette.ink} strokeWidth="4" strokeLinecap="round" />
      <path d="M98 186h164" stroke={palette.blue} strokeWidth="4" strokeDasharray="8 8" strokeLinecap="round" opacity="0.35" />
    </IllustrationSvg>
  );
}

export function MedicareHelpIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SceneFrame />
      <Card x={42} y={54} width={114} height={128} accent={palette.blue} />
      <CheckMark x={60} y={119} />
      <CheckMark x={60} y={136} />
      <CheckMark x={60} y={153} />
      <rect x="188" y="72" width="66" height="90" rx="16" fill={palette.white} stroke={palette.line} strokeWidth="2" />
      <rect x="206" y="88" width="30" height="12" rx="6" fill={palette.teal} />
      <circle cx="278" cy="102" r="24" fill={palette.amberLight} stroke={palette.amber} strokeWidth="2" />
      <circle cx="278" cy="102" r="10" fill={palette.white} stroke={palette.blue} strokeWidth="2.5" />
      <path d="M286 111l12 12" stroke={palette.blue} strokeWidth="5" strokeLinecap="round" />
      <rect x="200" y="126" width="106" height="42" rx="14" fill={palette.tealLight} stroke={palette.teal} strokeWidth="2" />
      <path d="M214 146h38M214 160h26" stroke={palette.ink} strokeWidth="3.5" strokeLinecap="round" />
      <CheckMark x={268} y={150} color={palette.teal} />
    </IllustrationSvg>
  );
}

export function TeamTrustIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SceneFrame />
      <Avatar x={52} y={88} tone={palette.blue} accent={palette.skyLight} />
      <Avatar x={134} y={74} tone={palette.teal} accent={palette.greenLight} scale={1.05} />
      <Avatar x={220} y={88} tone={palette.blueDark} accent={palette.amberLight} />
      <ShieldCheck x={248} y={42} scale={1.15} />
      <MapPin x={36} y={40} scale={1.05} />
      <path d="M82 170c32-26 86-26 122 0" stroke={palette.blue} strokeWidth="4" strokeLinecap="round" opacity="0.35" />
    </IllustrationSvg>
  );
}

export function ContactOfficeIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SceneFrame />
      <rect x="44" y="70" width="132" height="102" rx="20" fill={palette.white} stroke={palette.line} strokeWidth="2" />
      <rect x="62" y="52" width="96" height="28" rx="14" fill={palette.blue} />
      <MapPin x={74} y={92} scale={0.92} fill={palette.greenLight} />
      <path d="M118 108h36M118 124h28" stroke={palette.muted} strokeWidth="4" strokeLinecap="round" />
      <rect x="204" y="92" width="106" height="72" rx="18" fill={palette.white} stroke={palette.line} strokeWidth="2" />
      <path d="M224 116c10-16 22-15 30 0" stroke={palette.teal} strokeWidth="5" strokeLinecap="round" />
      <path d="M258 116h28M258 132h18" stroke={palette.muted} strokeWidth="4" strokeLinecap="round" />
      <circle cx="292" cy="76" r="16" fill={palette.greenLight} />
      <CheckMark x={286} y={76} color={palette.teal} />
    </IllustrationSvg>
  );
}

export function LocalSpokaneIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SceneFrame />
      <path d="M44 160h38l16-26 20 18 22-34 22 30 16-20 20 32h40" stroke={palette.blue} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0.75" />
      <path d="M48 178c36-8 72-8 108 0s72 8 108 0" stroke={palette.teal} strokeWidth="6" strokeLinecap="round" opacity="0.5" />
      <MapPin x={140} y={52} scale={1.05} fill={palette.amberLight} />
      <rect x="214" y="86" width="88" height="68" rx="18" fill={palette.white} stroke={palette.line} strokeWidth="2" />
      <rect x="230" y="100" width="42" height="10" rx="5" fill={palette.blue} />
      <path d="M230 122h56M230 138h34" stroke={palette.muted} strokeWidth="4" strokeLinecap="round" />
      <CheckMark x={266} y={140} color={palette.teal} />
    </IllustrationSvg>
  );
}

export function TestimonialsIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SceneFrame />
      <SpeechBubble x={48} y={78} width={92} height={52} fill={palette.white} />
      <SpeechBubble x={134} y={56} width={102} height={58} fill={palette.tealLight} />
      <SpeechBubble x={228} y={88} width={84} height={50} fill={palette.white} />
      <StarRow x={102} y={152} />
      <ShieldCheck x={260} y={138} scale={0.95} />
    </IllustrationSvg>
  );
}

export function MedicareAdvantageIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SceneFrame />
      <Card x={54} y={54} width={116} height={128} accent={palette.blue} />
      <circle cx="240" cy="88" r="20" fill={palette.tealLight} />
      <path d="M230 92c6-10 16-16 28-16" stroke={palette.teal} strokeWidth="4" strokeLinecap="round" />
      <path d="M228 102c10 4 24 4 34-2" stroke={palette.teal} strokeWidth="4" strokeLinecap="round" />
      <rect x="204" y="118" width="40" height="46" rx="12" fill={palette.white} stroke={palette.line} strokeWidth="2" />
      <rect x="212" y="108" width="24" height="12" rx="6" fill={palette.green} />
      <path d="M216 136h16" stroke={palette.teal} strokeWidth="4" strokeLinecap="round" />
      <rect x="252" y="120" width="58" height="44" rx="14" fill={palette.amberLight} stroke={palette.amber} strokeWidth="2" />
      <CheckMark x={266} y={144} />
      <CheckMark x={266} y={158} />
    </IllustrationSvg>
  );
}

export function MedicareSupplementIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SceneFrame />
      <rect x="66" y="56" width="108" height="122" rx="18" fill={palette.white} stroke={palette.line} strokeWidth="2" />
      <rect x="84" y="44" width="72" height="22" rx="11" fill={palette.blue} />
      <path d="M88 94h62M88 112h56M88 130h38" stroke={palette.muted} strokeWidth="4" strokeLinecap="round" />
      <circle cx="232" cy="116" r="52" fill={palette.greenLight} />
      <ShieldCheck x={216} y={82} scale={1.4} />
      <path d="M194 172h76" stroke={palette.teal} strokeWidth="5" strokeLinecap="round" opacity="0.5" />
    </IllustrationSvg>
  );
}

export function PartDIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SceneFrame />
      <Card x={44} y={54} width={112} height={126} accent={palette.blue} />
      <CheckMark x={62} y={119} />
      <CheckMark x={62} y={136} />
      <rect x="194" y="70" width="52" height="88" rx="14" fill={palette.teal} />
      <rect x="202" y="58" width="36" height="18" rx="9" fill={palette.teal} opacity="0.92" stroke={palette.white} strokeWidth="2" />
      <rect x="206" y="96" width="28" height="24" rx="8" fill={palette.white} opacity="0.95" />
      <path d="M212 108h16" stroke={palette.teal} strokeWidth="4" strokeLinecap="round" />
      <rect x="252" y="118" width="58" height="46" rx="14" fill={palette.white} stroke={palette.line} strokeWidth="2" />
      <path d="M264 136h24M264 150h18" stroke={palette.muted} strokeWidth="4" strokeLinecap="round" />
      <path d="M286 84h20" stroke={palette.blue} strokeWidth="4" strokeLinecap="round" />
      <path d="M296 74v20" stroke={palette.blue} strokeWidth="4" strokeLinecap="round" />
    </IllustrationSvg>
  );
}

export function SupplementalInsuranceIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SceneFrame />
      <Card x={122} y={78} width={116} height={100} accent={palette.blue} />
      <circle cx="92" cy="92" r="24" fill={palette.amberLight} />
      <path d="M80 92h24" stroke={palette.amber} strokeWidth="4" strokeLinecap="round" />
      <path d="M84 80c5-4 11-4 16 0" stroke={palette.amber} strokeWidth="4" strokeLinecap="round" />
      <circle cx="270" cy="92" r="24" fill={palette.skyLight} />
      <circle cx="270" cy="92" r="10" fill={palette.white} stroke={palette.blue} strokeWidth="3" />
      <path d="M256 150a16 16 0 0 1 28 0" stroke={palette.teal} strokeWidth="6" strokeLinecap="round" />
      <rect x="64" y="138" width="44" height="38" rx="12" fill={palette.greenLight} stroke={palette.green} strokeWidth="2" />
      <path d="M76 156h20" stroke={palette.teal} strokeWidth="4" strokeLinecap="round" />
      <path d="M286 148h22" stroke={palette.blue} strokeWidth="4" strokeLinecap="round" />
      <path d="M297 137v22" stroke={palette.blue} strokeWidth="4" strokeLinecap="round" />
    </IllustrationSvg>
  );
}

export function CarrierOptionsIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SceneFrame />
      <Card x={44} y={72} width={74} height={96} accent={palette.blue} />
      <Card x={142} y={58} width={76} height={110} accent={palette.teal} />
      <Card x={244} y={72} width={74} height={96} accent={palette.green} />
      <path d="M122 114h18" stroke={palette.blue} strokeWidth="4" strokeLinecap="round" />
      <path d="M132 106l10 8-10 8" stroke={palette.blue} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M222 114h18" stroke={palette.blue} strokeWidth="4" strokeLinecap="round" />
      <path d="M230 106l10 8-10 8" stroke={palette.blue} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </IllustrationSvg>
  );
}

export function Turning65Illustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SceneFrame />
      <rect x="46" y="52" width="120" height="104" rx="18" fill={palette.white} stroke={palette.line} strokeWidth="2" />
      <rect x="46" y="52" width="120" height="30" rx="18" fill={palette.blue} />
      <path d="M70 42v22M142 42v22" stroke={palette.blueDark} strokeWidth="6" strokeLinecap="round" />
      <text x="106" y="128" textAnchor="middle" fontSize="44" fontWeight="700" fill={palette.blueDark}>
        65
      </text>
      <Card x={190} y={72} width={96} height={104} accent={palette.green} />
      <CheckMark x={206} y={120} />
      <CheckMark x={206} y={138} />
    </IllustrationSvg>
  );
}

export function WorkingPast65Illustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SceneFrame />
      <rect x="48" y="80" width="58" height="74" rx="14" fill={palette.amberLight} stroke={palette.warmDark} strokeWidth="2" />
      <path d="M62 80v-12c0-8 6-14 15-14h0c9 0 15 6 15 14v12" stroke={palette.ink} strokeWidth="4" strokeLinecap="round" />
      <rect x="132" y="52" width="96" height="86" rx="18" fill={palette.white} stroke={palette.line} strokeWidth="2" />
      <rect x="132" y="52" width="96" height="24" rx="12" fill={palette.blue} />
      <path d="M150 96h52M150 112h36" stroke={palette.muted} strokeWidth="4" strokeLinecap="round" />
      <text x="182" y="140" textAnchor="middle" fontSize="28" fontWeight="700" fill={palette.blueDark}>
        65
      </text>
      <Card x={246} y={96} width={66} height={68} accent={palette.teal} />
      <CheckMark x={258} y={142} color={palette.teal} />
    </IllustrationSvg>
  );
}

export function HelpingParentIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SceneFrame />
      <Avatar x={46} y={88} tone={palette.blue} accent={palette.skyLight} />
      <Avatar x={246} y={96} tone={palette.teal} accent={palette.greenLight} scale={0.92} />
      <rect x="118" y="98" width="124" height="68" rx="16" fill={palette.white} stroke={palette.line} strokeWidth="2" />
      <path d="M136 120h70M136 138h48" stroke={palette.muted} strokeWidth="4" strokeLinecap="round" />
      <path d="M102 132l26 12M232 132l-24 12" stroke={palette.teal} strokeWidth="5" strokeLinecap="round" />
      <circle cx="180" cy="64" r="17" fill={palette.greenLight} />
      <CheckMark x={174} y={65} color={palette.teal} />
    </IllustrationSvg>
  );
}

export function AppointmentChecklistIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SceneFrame />
      <path d="M56 84h82l16 16h108v70a18 18 0 0 1-18 18H76a18 18 0 0 1-18-18Z" fill={palette.amberLight} stroke={palette.warmDark} strokeWidth="2" strokeLinejoin="round" />
      <Card x={88} y={62} width={126} height={102} accent={palette.blue} />
      <CheckMark x={106} y={111} />
      <CheckMark x={106} y={128} />
      <CheckMark x={106} y={145} />
      <rect x="220" y="108" width="62" height="38" rx="10" fill={palette.white} stroke={palette.line} strokeWidth="2" />
      <rect x="230" y="118" width="18" height="12" rx="4" fill={palette.teal} />
      <path d="M254 120h18M254 130h12" stroke={palette.muted} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="258" cy="72" r="16" fill={palette.greenLight} />
      <path d="M251 72h14M258 65v14" stroke={palette.teal} strokeWidth="4" strokeLinecap="round" />
    </IllustrationSvg>
  );
}

export function AnnualPlanReviewIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SceneFrame />
      <Card x={42} y={70} width={74} height={96} accent={palette.blue} />
      <Card x={142} y={56} width={76} height={110} accent={palette.teal} />
      <Card x={244} y={70} width={74} height={96} accent={palette.green} />
      <circle cx="182" cy="44" r="20" fill={palette.amberLight} />
      <CheckMark x={175} y={45} color={palette.amber} />
    </IllustrationSvg>
  );
}

export function CompareOptionsIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SceneFrame />
      <Card x={42} y={68} width={78} height={100} accent={palette.blue} />
      <Card x={142} y={54} width={78} height={114} accent={palette.teal} />
      <Card x={242} y={68} width={78} height={100} accent={palette.green} />
      <CheckMark x={66} y={148} />
      <path d="M170 138h18" stroke={palette.amber} strokeWidth="4" strokeLinecap="round" />
      <circle cx="198" cy="148" r="9" fill={palette.amberLight} stroke={palette.amber} strokeWidth="2" />
      <text x="198" y="152" textAnchor="middle" fontSize="14" fontWeight="700" fill={palette.amber}>
        ?
      </text>
      <CheckMark x={268} y={148} />
    </IllustrationSvg>
  );
}

export function MedicareConfusionIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <SceneFrame />
      <Avatar x={56} y={90} tone={palette.blue} accent={palette.skyLight} />
      <Avatar x={246} y={90} tone={palette.teal} accent={palette.greenLight} />
      <Card x={128} y={84} width={104} height={84} accent={palette.blue} />
      <circle cx="90" cy="66" r="14" fill={palette.greenLight} />
      <text x="90" y="71" textAnchor="middle" fontSize="22" fontWeight="700" fill={palette.teal}>
        ?
      </text>
      <circle cx="270" cy="62" r="14" fill={palette.amberLight} />
      <CheckMark x={264} y={63} color={palette.amber} />
      <path d="M120 178h120" stroke={palette.blue} strokeWidth="4" strokeDasharray="8 8" strokeLinecap="round" opacity="0.35" />
    </IllustrationSvg>
  );
}

export const PrescriptionReviewIllustration = PartDIllustration;
export const PlanReviewIllustration = AnnualPlanReviewIllustration;
