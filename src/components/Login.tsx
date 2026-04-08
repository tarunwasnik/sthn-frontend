// frontend/src/components/Login.tsx

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import type { CredentialResponse } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
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

    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
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

    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        "Google login failed.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 text-white overflow-hidden">

      {/* Background (MATCH HOME) */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] md:w-[900px] h-[400px] md:h-[600px] bg-teal-500/10 blur-[120px] md:blur-[150px] rounded-full" />
      </div>

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-4 md:left-10 text-sm text-gray-300 hover:text-white transition"
      >
        ← Back
      </button>

      {/* Card */}
      <div className="w-full max-w-md bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-xl">

        <h1 className="text-2xl font-bold mb-2">
          Log in
        </h1>

        <p className="text-sm text-gray-400 mb-6">
          Continue to your account
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm text-gray-300">
              Email
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300">
              Password
            </label>

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-teal-400 text-black py-3 font-semibold hover:bg-teal-300 transition disabled:opacity-50"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>

        </form>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-white/10"></div>
          <span className="px-3 text-sm text-gray-400">OR</span>
          <div className="flex-1 border-t border-white/10"></div>
        </div>

        {/* Google */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google login failed")}
          />
        </div>

        <p className="mt-6 text-sm text-gray-400 text-center">
          Don’t have an account?{" "}
          <Link
            to="/register"
            className="text-teal-400 font-medium hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}