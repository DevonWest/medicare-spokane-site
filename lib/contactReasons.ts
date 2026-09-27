export const CONTACT_REASONS = [
  "My Medicare coverage or provider network is changing",
  "I want to compare Medicare coverage options",
  "I am new to Medicare or helping someone get started",
  "I am an existing client and need insurance help",
  "I need individual or family health insurance help",
  "I am not sure — I would like guidance",
] as const;

export function contactReason(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" && CONTACT_REASONS.some((reason) => reason === value)
    ? value
    : undefined;
}
