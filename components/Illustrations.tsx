import { type ReactNode } from "react";

interface IllustrationProps {
  className?: string;
  title?: string;
}

interface IllustrationSvgProps extends IllustrationProps {
  children: ReactNode;
  viewBox?: string;
}

function IllustrationSvg({
  children,
  className,
  title,
  viewBox = "0 0 320 220",
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

export function MedicareConfusionIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <rect x="20" y="22" width="280" height="176" rx="28" className="fill-sky-50" />
      <circle cx="74" cy="54" r="12" className="fill-emerald-200" />
      <path
        d="M66 54c0-4 3-8 8-8 4 0 7 3 7 7 0 4-3 5-5 7-2 1-2 2-2 4"
        className="stroke-emerald-700"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="78" cy="69" r="1.8" className="fill-emerald-700" />
      <circle cx="251" cy="62" r="14" className="fill-teal-100" />
      <path
        d="M243 62c0-4 3-8 8-8 4 0 7 3 7 7 0 4-3 5-5 7-2 1-2 2-2 4"
        className="stroke-teal-700"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="255" cy="78" r="1.8" className="fill-teal-700" />
      <g className="text-sky-700">
        <circle cx="106" cy="120" r="24" fill="currentColor" className="opacity-15" />
        <circle cx="218" cy="120" r="24" fill="currentColor" className="opacity-15" />
        <circle cx="106" cy="101" r="13" fill="currentColor" className="opacity-80" />
        <circle cx="218" cy="101" r="13" fill="currentColor" className="opacity-80" />
        <path
          d="M86 143c5-14 15-21 30-21s25 7 30 21M198 143c5-14 15-21 30-21s25 7 30 21"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </g>
      <rect x="129" y="88" width="62" height="78" rx="10" className="fill-white stroke-sky-200" strokeWidth="2" />
      <rect x="139" y="78" width="42" height="16" rx="7" className="fill-sky-600" />
      <path d="M142 111h36M142 125h30M142 139h28" className="stroke-slate-400" strokeWidth="3" strokeLinecap="round" />
      <path d="M144 153h18" className="stroke-emerald-500" strokeWidth="4" strokeLinecap="round" />
      <path d="M166 153h10" className="stroke-sky-500" strokeWidth="4" strokeLinecap="round" />
      <path d="M80 168h160" className="stroke-sky-200" strokeWidth="6" strokeLinecap="round" />
    </IllustrationSvg>
  );
}

export function PrescriptionReviewIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <rect x="22" y="22" width="276" height="176" rx="28" className="fill-sky-50" />
      <rect x="62" y="48" width="122" height="132" rx="18" className="fill-white stroke-sky-200" strokeWidth="2" />
      <rect x="98" y="36" width="50" height="24" rx="10" className="fill-sky-600" />
      <path d="M84 84h60M84 112h60M84 140h48" className="stroke-slate-400" strokeWidth="4" strokeLinecap="round" />
      <path d="M80 83l7 7 12-15M80 111l7 7 12-15M80 139l7 7 12-15" className="stroke-emerald-500" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="198" y="68" width="50" height="82" rx="12" className="fill-teal-500" />
      <rect x="205" y="56" width="36" height="18" rx="8" className="fill-teal-700" />
      <rect x="209" y="90" width="28" height="26" rx="8" className="fill-white opacity-90" />
      <path d="M214 103h18" className="stroke-teal-700" strokeWidth="4" strokeLinecap="round" />
      <rect x="214" y="136" width="72" height="44" rx="14" className="fill-white stroke-sky-200" strokeWidth="2" />
      <rect x="224" y="148" width="22" height="14" rx="4" className="fill-amber-200" />
      <path d="M252 149h22M252 159h14" className="stroke-slate-500" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="274" cy="74" r="12" className="fill-emerald-100" />
      <path d="M269 74l4 4 7-9" className="stroke-emerald-700" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </IllustrationSvg>
  );
}

export function Turning65Illustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <rect x="20" y="22" width="280" height="176" rx="28" className="fill-sky-50" />
      <rect x="48" y="48" width="116" height="108" rx="18" className="fill-white stroke-sky-200" strokeWidth="2" />
      <rect x="48" y="48" width="116" height="30" rx="18" className="fill-sky-600" />
      <path d="M71 38v20M141 38v20" className="stroke-sky-700" strokeWidth="6" strokeLinecap="round" />
      <text x="106" y="123" textAnchor="middle" className="fill-sky-700 text-[42px] font-bold">
        65
      </text>
      <rect x="184" y="64" width="90" height="112" rx="18" className="fill-white stroke-emerald-200" strokeWidth="2" />
      <path d="M203 92l6 6 12-14M203 119l6 6 12-14M203 146l6 6 12-14" className="stroke-emerald-500" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M224 90h29M224 118h29M224 145h24" className="stroke-slate-400" strokeWidth="4" strokeLinecap="round" />
      <circle cx="250" cy="49" r="18" className="fill-amber-100" />
      <path d="M244 49h12M250 43v12" className="stroke-amber-600" strokeWidth="4" strokeLinecap="round" />
      <path d="M92 176h134" className="stroke-sky-200" strokeWidth="6" strokeLinecap="round" />
    </IllustrationSvg>
  );
}

export function HelpingParentIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <rect x="20" y="22" width="280" height="176" rx="28" className="fill-sky-50" />
      <rect x="122" y="92" width="76" height="68" rx="12" className="fill-white stroke-sky-200" strokeWidth="2" />
      <path d="M137 114h46M137 128h40M137 142h24" className="stroke-slate-400" strokeWidth="4" strokeLinecap="round" />
      <g className="text-sky-700">
        <circle cx="92" cy="96" r="16" fill="currentColor" className="opacity-85" />
        <circle cx="228" cy="100" r="14" fill="currentColor" className="opacity-65" />
        <path d="M68 156c6-20 18-29 36-29s30 9 36 29" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="opacity-85" />
        <path d="M208 156c5-16 15-24 30-24s24 8 29 24" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="opacity-65" />
      </g>
      <path d="M118 120l18 10M200 122l-18 10" className="stroke-teal-600" strokeWidth="5" strokeLinecap="round" />
      <circle cx="153" cy="62" r="16" className="fill-emerald-100" />
      <path d="M147 62h12M153 56v12" className="stroke-emerald-700" strokeWidth="4" strokeLinecap="round" />
      <path d="M78 175h164" className="stroke-sky-200" strokeWidth="6" strokeLinecap="round" />
    </IllustrationSvg>
  );
}

export function PlanReviewIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <rect x="20" y="22" width="280" height="176" rx="28" className="fill-sky-50" />
      <rect x="44" y="56" width="78" height="102" rx="16" className="fill-white stroke-sky-200" strokeWidth="2" />
      <rect x="198" y="56" width="78" height="102" rx="16" className="fill-white stroke-emerald-200" strokeWidth="2" />
      <rect x="56" y="72" width="54" height="12" rx="6" className="fill-sky-200" />
      <rect x="210" y="72" width="54" height="12" rx="6" className="fill-emerald-200" />
      <path d="M60 102h40M60 124h40M60 146h28M214 102h40M214 124h30M214 146h36" className="stroke-slate-400" strokeWidth="4" strokeLinecap="round" />
      <path d="M92 100l6 6 11-13M92 122l6 6 11-13M246 100l6 6 11-13M246 122l6 6 11-13M246 144l6 6 11-13" className="stroke-emerald-500" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="124" y="42" width="72" height="120" rx="18" className="fill-white stroke-sky-300" strokeWidth="2" />
      <rect x="143" y="56" width="34" height="10" rx="5" className="fill-sky-600" />
      <path d="M143 86h34M143 102h34M143 118h26" className="stroke-slate-400" strokeWidth="4" strokeLinecap="round" />
      <circle cx="207" cy="163" r="17" className="fill-amber-100" />
      <path d="M201 163l4 4 8-10" className="stroke-amber-700" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </IllustrationSvg>
  );
}

export function AppointmentChecklistIllustration({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <rect x="20" y="22" width="280" height="176" rx="28" className="fill-sky-50" />
      <path d="M58 78h76l14 14h114v78a18 18 0 0 1-18 18H76a18 18 0 0 1-18-18z" className="fill-amber-100 stroke-amber-300" strokeWidth="2" strokeLinejoin="round" />
      <rect x="86" y="62" width="126" height="98" rx="18" className="fill-white stroke-sky-200" strokeWidth="2" />
      <path d="M109 88h50M109 108h72M109 128h60" className="stroke-slate-400" strokeWidth="4" strokeLinecap="round" />
      <path d="M103 88l6 6 11-13M103 108l6 6 11-13M103 128l6 6 11-13" className="stroke-emerald-500" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="194" y="100" width="64" height="40" rx="10" className="fill-white stroke-teal-200" strokeWidth="2" />
      <rect x="204" y="112" width="18" height="12" rx="4" className="fill-teal-500" />
      <path d="M228 114h18M228 124h12" className="stroke-slate-500" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="244" cy="72" r="17" className="fill-emerald-100" />
      <path d="M237 72h14M244 65v14" className="stroke-emerald-700" strokeWidth="4" strokeLinecap="round" />
    </IllustrationSvg>
  );
}
