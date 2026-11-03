// frontend/src/components/Login.tsx

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import type { CredentialResponse } from "@react-oauth/google";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import api from "../api/axios";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      const { token } = res.data;

      if (!token) throw new Error("Token missing");

      await login(token);

      navigate("/entry", { replace: true });

    } catch (err: unknown) {
      const responseData = axios.isAxiosError(err) ? err.response?.data : undefined;
      const message =
        (typeof responseData?.message === "string" && responseData.message) ||
        (typeof responseData?.error === "string" && responseData.error) ||
        "Invalid credentials. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  /* GOOGLE LOGIN */

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse
  ) => {
    if (!credentialResponse?.credential) {
      setError("Google login failed.");
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
        "Google login failed.";

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
      <div className="w-full max-w-md rounded-[var(--radius-card-featured)] border border-theme-border bg-theme-surface p-6 shadow-sm sm:p-8">

        <h1 className="mb-2 text-2xl font-semibold tracking-tight">
          Log in
        </h1>

        <p className="mb-6 text-sm text-theme-muted">
          Continue to your account
        </p>

        {error && (
          <div id="login-error" role="alert" className="mb-4 rounded-[var(--radius-control)] border border-theme-danger bg-theme-danger-tint p-3 text-sm text-theme-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-theme-text">
              Email
            </label>

            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 h-11 w-full rounded-[var(--radius-control)] border border-theme-border bg-theme-surface px-3 text-sm text-theme-text placeholder:text-theme-muted transition-colors hover:border-theme-border-strong focus:border-theme-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-theme-text">
              Password
            </label>

            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 h-11 w-full rounded-[var(--radius-control)] border border-theme-border bg-theme-surface px-3 text-sm text-theme-text placeholder:text-theme-muted transition-colors hover:border-theme-border-strong focus:border-theme-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-[var(--radius-control)] bg-theme-primary px-4 text-sm font-medium text-theme-primary-text transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>

        </form>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-theme-border"></div>
          <span className="px-3 text-sm text-theme-muted">OR</span>
          <div className="flex-1 border-t border-theme-border"></div>
        </div>

        {/* Google */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google login failed")}
          />
        </div>

        <p className="mt-6 text-center text-sm text-theme-muted">
          Don’t have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-theme-accent hover:underline focus-visible:rounded-[var(--radius-control)]"
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
