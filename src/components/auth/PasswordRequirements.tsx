import { passwordRequirements, validatePasswordForGuidance } from "../../features/auth/passwordPolicy";

export function PasswordRequirements({ password }: { password: string }) {
  const validation = validatePasswordForGuidance(password);
  if (!password) return null;
  return <div aria-live="polite" className="mt-2 text-xs text-theme-muted">
    <p className="font-medium text-theme-text">Your password must include:</p>
    <ul className="mt-1 space-y-1">
      {passwordRequirements.map(({ key, label }) => <li key={key} className={validation.requirements[key] ? "text-theme-success" : undefined}>{validation.requirements[key] ? "✓ " : "○ "}{label}</li>)}
    </ul>
    {validation.error ? <p role="alert" className="mt-2 text-theme-danger">{validation.error}</p> : null}
  </div>;
}
