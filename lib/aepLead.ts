export const AEP_HELP_OPTIONS = [
  { value: "current-plan", label: "My current plan and upcoming changes" },
  { value: "prescriptions", label: "Prescription drug coverage and pharmacy costs" },
  { value: "doctors", label: "Doctors, hospitals, and provider networks" },
  { value: "compare-options", label: "Compare Medicare coverage options" },
  { value: "other", label: "I am not sure yet" },
] as const;

export const AEP_CONTACT_OPTIONS = [
  { value: "phone", label: "Phone call" },
  { value: "text", label: "Text message" },
  { value: "email", label: "Email" },
] as const;

export const AEP_TIME_OPTIONS = [
  { value: "anytime", label: "Any time during business hours" },
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
] as const;

export type AepHelpType = (typeof AEP_HELP_OPTIONS)[number]["value"];
export type AepContactPreference = (typeof AEP_CONTACT_OPTIONS)[number]["value"];
export type AepBestTime = (typeof AEP_TIME_OPTIONS)[number]["value"];

function getOptionLabel<T extends readonly { value: string; label: string }[]>(
  options: T,
  value: string,
): string {
  return options.find((option) => option.value === value)?.label ?? "Not provided";
}

export function isAepHelpType(value: string): value is AepHelpType {
  return AEP_HELP_OPTIONS.some((option) => option.value === value);
}

export function isAepContactPreference(value: string): value is AepContactPreference {
  return AEP_CONTACT_OPTIONS.some((option) => option.value === value);
}

export function isAepBestTime(value: string): value is AepBestTime {
  return AEP_TIME_OPTIONS.some((option) => option.value === value);
}

export function buildAepLeadMessage({
  helpType,
  contactPreference,
  bestTime,
}: {
  helpType: AepHelpType;
  contactPreference: AepContactPreference;
  bestTime: AepBestTime;
}): string {
  return [
    "Annual Medicare review requested: Yes",
    `Help requested: ${getOptionLabel(AEP_HELP_OPTIONS, helpType)}`,
    `Preferred contact: ${getOptionLabel(AEP_CONTACT_OPTIONS, contactPreference)}`,
    `Best time: ${getOptionLabel(AEP_TIME_OPTIONS, bestTime)}`,
    "Contact consent confirmed: Yes",
  ].join("\n");
}
