export function getSafeErrorDetails(error: unknown): Record<string, string | undefined> {
  if (!(error instanceof Error)) return { errorType: typeof error };

  const errorWithCode = error as Error & { code?: unknown };
  const code = typeof errorWithCode.code === "string" ? errorWithCode.code : undefined;

  return {
    errorType: error.name,
    ...(code ? { errorCode: code } : {}),
  };
}
