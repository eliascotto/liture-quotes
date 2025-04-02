export function errorToString(error: unknown): string {
  if (typeof error === "string") {
    return error;
  } else if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

export function cleanText(input: string): string {
  // Basic ASCII printable characters + some common Unicode
  return input.replace(/[^\x20-\x7E\u00C0-\u017F]/g, "");
}
