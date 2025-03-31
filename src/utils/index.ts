export function errorToString(error: unknown): string {
  if (typeof error === "string") {
    return error;
  } else if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}
