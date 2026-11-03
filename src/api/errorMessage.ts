import axios from "axios";

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error) || !error.response) return fallback;

  const data: unknown = error.response.data;
  if (
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof data.message === "string"
  ) {
    return data.message;
  }

  return fallback;
}
