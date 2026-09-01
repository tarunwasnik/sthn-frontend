export type VerificationRequestStatus = "PENDING" | "PROCESSING" | "ADMIN_REVIEW_REQUIRED" | "APPROVED" | "REJECTED" | "EXPIRED";
export type VerificationJobStatus = "PENDING" | "RUNNING" | "RETRY_WAIT" | "COMPLETED" | "FAILED";

export const requestStatusLabel = (status: VerificationRequestStatus) => ({
  PENDING: "Pending", PROCESSING: "Processing", ADMIN_REVIEW_REQUIRED: "Admin review required",
  APPROVED: "Approved", REJECTED: "Rejected", EXPIRED: "Expired",
}[status]);

export const automationLabel = (input: { requestStatus: VerificationRequestStatus; job?: { status: VerificationJobStatus; attemptCount: number; maxRetryCount: number } | null }) => {
  if (input.requestStatus === "ADMIN_REVIEW_REQUIRED") return "Escalated to Admin review";
  if (input.requestStatus === "APPROVED" || input.requestStatus === "REJECTED" || input.requestStatus === "EXPIRED") return "Completed";
  if (!input.job || input.job.status === "PENDING") return "Waiting for automated verification";
  if (input.job.status === "RUNNING") return "Processing";
  if (input.job.status === "RETRY_WAIT") return `Retrying — attempt ${input.job.attemptCount} of ${input.job.maxRetryCount}`;
  if (input.job.status === "FAILED") return "Failed";
  return "Completed";
};

export const faceMatchExplanation = (analysis: { conclusion: string | null; threshold: number | null; similarity: number | null; reasonCode: string | null; reason: string | null }) => {
  if (analysis.reasonCode === "THRESHOLD_NOT_CONFIGURED") return "Automatic approval threshold was not configured. Admin review required.";
  if (analysis.reasonCode === "REFERENCE_FACE_NOT_FOUND" || analysis.reasonCode === "MULTIPLE_REFERENCE_FACES") return "No usable reference face could be established from the selected avatar.";
  if (analysis.reasonCode === "MODEL_FAILURE") return "Automated face verification could not complete because the model pipeline failed.";
  if (analysis.reasonCode === "PROCESSING_TIMEOUT") return "Automated verification timed out and requires Admin review.";
  if (analysis.reasonCode === "INSUFFICIENT_USABLE_CAPTURES") return "Too few usable live captures were available to determine a face match. Admin review required.";
  if (analysis.reasonCode === "FACE_MATCH_UNCERTAIN") return "Automated verification could not determine a result. Admin review required.";
  if (analysis.threshold !== null && analysis.similarity !== null) return analysis.similarity >= analysis.threshold ? "Similarity satisfied the automatic-approval threshold." : "Similarity did not satisfy the automatic-approval threshold. Admin review required.";
  return analysis.reason ?? "Automated verification result is not available.";
};

export const decisionLabel = (input: { status: VerificationRequestStatus; decisionAuthority: "AI" | "ADMIN" | null }) => {
  if (input.status === "APPROVED") return input.decisionAuthority === "AI" ? "Automatically verified by AI" : "Approved by Admin";
  if (input.status === "REJECTED") return "Rejected by Admin";
  if (input.status === "EXPIRED") return "Expired — new verification attempt required";
  if (input.status === "ADMIN_REVIEW_REQUIRED") return "Awaiting Admin review";
  return input.status === "PENDING" ? "Awaiting automated verification" : "Automated verification in progress";
};

export const conclusionLabel = (conclusion: "LIKELY_MATCH" | "LIKELY_MISMATCH" | "UNABLE_TO_DETERMINE" | null) => ({
  LIKELY_MATCH: "Likely match",
  LIKELY_MISMATCH: "Likely mismatch",
  UNABLE_TO_DETERMINE: "Unable to determine",
}[conclusion ?? ""] ?? null);
