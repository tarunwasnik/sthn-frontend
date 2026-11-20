import axios from "axios";

export const authRateLimitError = (error: unknown) => {
  if (!axios.isAxiosError(error) || error.response?.status !== 429) return null;
  const retryAfter = Number(error.response.headers?.["retry-after"]);
  const seconds = Number.isFinite(retryAfter) && retryAfter > 0 ? Math.ceil(retryAfter) : 60;
  return { until: Date.now() + seconds * 1000, message: `Too many attempts. Please try again in about ${seconds} seconds.` };
};
