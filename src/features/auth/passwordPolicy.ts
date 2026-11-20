export const PASSWORD_MIN_LENGTH = 9;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_MAX_BCRYPT_BYTES = 72;

export type PasswordRequirementKey = "length" | "uppercase" | "lowercase" | "number" | "special";

export const passwordRequirements: ReadonlyArray<Readonly<{ key: PasswordRequirementKey; label: string }>> = [
  { key: "length", label: "At least 9 characters." },
  { key: "uppercase", label: "One uppercase letter (A–Z)." },
  { key: "lowercase", label: "One lowercase letter (a–z)." },
  { key: "number", label: "One number (0–9)." },
  { key: "special", label: "One special character." },
];

export type PasswordValidation = Readonly<{ requirements: Record<PasswordRequirementKey, boolean>; error: string | null }>;

export const validatePasswordForGuidance = (password: string): PasswordValidation => {
  const requirements = {
    length: password.length >= PASSWORD_MIN_LENGTH,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9\s]/.test(password),
  };
  if (password.length > PASSWORD_MAX_LENGTH) return { requirements, error: "Password exceeds the supported maximum length." };
  if (new TextEncoder().encode(password).byteLength > PASSWORD_MAX_BCRYPT_BYTES) return { requirements, error: "Password exceeds the supported byte length." };
  return { requirements, error: null };
};

export const isPasswordReadyForSubmission = (password: string) => {
  const validation = validatePasswordForGuidance(password);
  return !validation.error && Object.values(validation.requirements).every(Boolean);
};
