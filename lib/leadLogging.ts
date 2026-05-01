function clip(value: string | undefined, max: number): string | undefined {
  if (!value) return undefined;
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

export function getSafeErrorDetails(error: unknown): Record<string, string | undefined> {
  if (!(error instanceof Error)) return { errorType: typeof error };

  const errorWithCode = error as Error & { code?: unknown };
  const code = typeof errorWithCode.code === "string" ? errorWithCode.code : undefined;

  return {
    errorType: error.name,
    errorName: error.name,
    ...(code ? { errorCode: code } : {}),
    errorMessage: clip(error.message, 1_000),
    errorStack: clip(error.stack, 4_000),
  };
}
