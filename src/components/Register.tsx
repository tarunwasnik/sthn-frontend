// frontend/src/components/Register.tsx

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import type { CredentialResponse } from "@react-oauth/google";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import api from "../api/axios";
import { PasswordRequirements } from "./auth/PasswordRequirements";
import { isPasswordReadyForSubmission, validatePasswordForGuidance } from "../features/auth/passwordPolicy";
import { authRateLimitError } from "../features/auth/rateLimit";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryUntil, setRetryUntil] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading || Date.now() < retryUntil) return;
    const validation = validatePasswordForGuidance(password);
    if (!isPasswordReadyForSubmission(password)) {
      setError(validation.error || "Your password does not yet meet all requirements.");
      return;
    }
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post("/auth/register", {
        email,
        password,
      });

      const { token } = res.data;

      if (!token) throw new Error("Token missing");

      await login(token);

      navigate("/entry", { replace: true });

    } catch (err: unknown) {
      const rateLimit = authRateLimitError(err);
      if (rateLimit) {
        setRetryUntil(rateLimit.until);
        setError(rateLimit.message);
        window.setTimeout(() => setRetryUntil(0), Math.max(0, rateLimit.until - Date.now()));
        return;
      }
      const responseData = axios.isAxiosError(err) ? err.response?.data : undefined;
      const message =
        (typeof responseData?.message === "string" && responseData.message) ||
        (typeof responseData?.error === "string" && responseData.error) ||
        "Registration failed";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  /* GOOGLE REGISTER */

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse
  ) => {
    if (!credentialResponse?.credential) {
      setError("Google authentication failed");
      return;
    }

    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.post("/auth/google", {
        idToken: credentialResponse.credential,
      });

      const { token } = res.data;

      if (!token) throw new Error("Token missing");

      await login(token);

      navigate("/entry", { replace: true });

    } catch (err: unknown) {
      const responseData = axios.isAxiosError(err) ? err.response?.data : undefined;
      const message =
        (typeof responseData?.message === "string" && responseData.message) ||
        "Google authentication failed";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-theme-bg px-4 py-8 text-theme-text sm:px-6">

      {/* Background (MATCH HOME) */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-theme-accent/10 blur-[140px] md:h-[600px] md:w-[900px]" />
      </div>

      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="absolute left-4 top-6 rounded-[var(--radius-control)] px-2 py-1 text-sm font-medium text-theme-muted transition-colors hover:text-theme-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent md:left-10"
      >
        ← Back
      </button>

      {/* Card */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-[var(--radius-card-featured)] border border-theme-border bg-theme-surface p-6 shadow-sm sm:p-8"
      >

        <h1 className="text-center text-2xl font-semibold tracking-tight">
          Create Account
        </h1>

        {error && (
          <div id="register-error" role="alert" className="rounded-[var(--radius-control)] border border-theme-danger bg-theme-danger-tint p-3 text-center text-sm text-theme-danger">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="register-email" className="mb-1 block text-sm font-medium text-theme-text">
            Email
          </label>

          <input
            id="register-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-[var(--radius-control)] border border-theme-border bg-theme-surface px-3 text-sm text-theme-text placeholder:text-theme-muted transition-colors hover:border-theme-border-strong focus:border-theme-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
          />
        </div>

        <div>
          <label htmlFor="register-password" className="mb-1 block text-sm font-medium text-theme-text">
            Password
          </label>

          <div className="relative">
          <input
            id="register-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-[var(--radius-control)] border border-theme-border bg-theme-surface px-3 text-sm text-theme-text placeholder:text-theme-muted transition-colors hover:border-theme-border-strong focus:border-theme-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
          />
          <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 text-xs font-medium text-theme-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button>
          </div>
          <PasswordRequirements password={password} />
        </div>

        <div>
          <label htmlFor="register-confirm-password" className="mb-1 block text-sm font-medium text-theme-text">Confirm password</label>
          <div className="relative">
            <input id="register-confirm-password" type={showConfirmation ? "text" : "password"} autoComplete="new-password" required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} aria-invalid={confirmation.length > 0 && confirmation !== password} className="h-11 w-full rounded-[var(--radius-control)] border border-theme-border bg-theme-surface px-3 text-sm text-theme-text placeholder:text-theme-muted transition-colors hover:border-theme-border-strong focus:border-theme-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent" />
            <button type="button" onClick={() => setShowConfirmation((value) => !value)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 text-xs font-medium text-theme-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent" aria-label={showConfirmation ? "Hide confirmation password" : "Show confirmation password"}>{showConfirmation ? "Hide" : "Show"}</button>
          </div>
          {confirmation.length > 0 && confirmation !== password ? <p role="alert" className="mt-1 text-xs text-theme-danger">Passwords do not match.</p> : null}
        </div>

        <button
          disabled={loading || Date.now() < retryUntil}
          className="h-11 w-full rounded-[var(--radius-control)] bg-theme-primary px-4 text-sm font-medium text-theme-primary-text transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating..." : Date.now() < retryUntil ? "Please wait…" : "Register"}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 text-sm text-theme-muted">
          <div className="h-px flex-1 bg-theme-border"></div>
          OR
          <div className="h-px flex-1 bg-theme-border"></div>
        </div>

        {/* Google */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google authentication failed")}
          />
        </div>

        <p className="text-center text-sm text-theme-muted">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-theme-accent hover:underline focus-visible:rounded-[var(--radius-control)]"
          >
            Log in
          </Link>
        </p>

      </form>
    </main>
  );
}
