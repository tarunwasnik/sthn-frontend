import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import axios from "axios";

import api from "../api/axios";
import { useAuth } from "../hooks/useAuth";
import DashboardLayout from "../layouts/DashboardLayout";
import UserDashboardLayout from "../layouts/UserDashboardLayout";
import { DisputeTrackingContent } from "./DisputesPage";
import { useTheme } from "../theme/useTheme";
import type { ThemePreference } from "../theme/theme";

type SettingsActor = "user" | "creator";
type SettingsSection = "account" | "creator" | "disputes";

type ProfileResponse = { profileStatus?: string };
type CreatorApplication = {
  status?: "draft" | "submitted" | "approved" | "rejected";
  rejectionReason?: string;
};
type CreatorProfile = {
  status: string;
  displayName: string;
  slug: string;
  primaryCategory: string;
  categories?: string[];
  country: string;
  city: string;
  currency: string;
  languages?: string[];
};

type Props = { actor: SettingsActor; section: SettingsSection };

function CustomerAccountSection() {
  const [profile, setProfile] = useState<{ username?: string; profileStatus?: string; verification?: { stage?: string; submittedAt?: string | null } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { let cancelled = false; void (async () => { try { const response = await api.get<{ username?: string; profileStatus?: string; verification?: { stage?: string; submittedAt?: string | null } }>("/v1/profile/me"); if (!cancelled) setProfile(response.data); } catch { if (!cancelled) setError("Account information is unavailable right now."); } finally { if (!cancelled) setLoading(false); } })(); return () => { cancelled = true; }; }, []);
  if (loading) return <p className="text-sm text-theme-muted">Loading account information...</p>;
  if (error) return <p className="rounded-[var(--radius-card)] border border-theme-danger bg-theme-danger-tint p-4 text-sm text-theme-danger">{error}</p>;
  return <section className="space-y-5"><div><h2 className="text-xl font-semibold text-theme-text">Account</h2><p className="mt-1 text-sm text-theme-muted">Profile and verification information from your authenticated account.</p></div><dl className="grid gap-4 rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-5 text-sm sm:grid-cols-2"><div><dt className="text-theme-muted">Username</dt><dd className="mt-1 text-theme-text">{profile?.username || "Not set"}</dd></div><div><dt className="text-theme-muted">Profile status</dt><dd className="mt-1 text-theme-text">{profile?.profileStatus || "incomplete"}</dd></div><div><dt className="text-theme-muted">Verification</dt><dd className="mt-1 text-theme-text">{profile?.verification?.stage || "NOT_SUBMITTED"}</dd></div></dl><a href="/profile" className="inline-block rounded-[var(--radius-control)] border border-theme-border bg-theme-surface px-4 py-2 text-sm font-medium text-theme-text transition-colors hover:border-theme-border-strong hover:bg-theme-inset">Open Profile Editor</a><p className="text-xs text-theme-muted">Password changes, session management, and account deletion are not currently supported by an authenticated backend contract.</p></section>;
}

function CreatorSettingsSection() {
  const { creatorStatus } = useAuth();
  const navigate = useNavigate();
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [application, setApplication] = useState<CreatorApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileResponse, applicationResponse] = await Promise.all([
          api.get<ProfileResponse>("/v1/profile/me"),
          api.get<{ application: CreatorApplication | null }>("/v1/creator-applications/me"),
        ]);
        if (!cancelled) {
          setProfileStatus(profileResponse.data.profileStatus?.toLowerCase() ?? null);
          setApplication(applicationResponse.data.application ?? null);
        }
      } catch {
        if (!cancelled) setError("Creator application status is unavailable right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <p className="text-sm text-theme-muted">Loading creator application status...</p>;
  if (error) return <p className="rounded-[var(--radius-card)] border border-theme-danger bg-theme-danger-tint p-4 text-sm text-theme-danger">{error}</p>;

  const applicationStatus = application?.status ?? creatorStatus ?? "none";
  if (applicationStatus === "approved" || creatorStatus === "approved") {
    return <section className="rounded-[var(--radius-card)] border border-theme-success bg-theme-success-tint p-5"><h2 className="font-semibold text-theme-success">Creator account active</h2><p className="mt-2 text-sm text-theme-text">Your Creator account is approved. Manage your services, availability, and bookings from the Creator workspace.</p><Link to="/dashboard/creator" className="mt-4 inline-block text-sm font-medium text-theme-success underline">Open Creator Dashboard</Link></section>;
  }
  if (profileStatus !== "verified") {
    return <section className="rounded-[var(--radius-card)] border border-theme-warning bg-theme-warning-tint p-5"><h2 className="font-semibold text-theme-warning">Profile verification required</h2><p className="mt-2 text-sm text-theme-text">Your profile must be verified before you can apply as a Creator.</p><Link to="/profile" className="mt-4 inline-block text-sm font-medium text-theme-accent underline">View profile</Link></section>;
  }
  if (applicationStatus === "submitted") {
    return <section className="rounded-[var(--radius-card)] border border-theme-warning bg-theme-warning-tint p-5"><h2 className="font-semibold text-theme-warning">Creator application pending</h2><p className="mt-2 text-sm text-theme-text">Your application is under review. No further submission is available while it is pending.</p></section>;
  }
  if (applicationStatus === "rejected") {
    return <section className="rounded-[var(--radius-card)] border border-theme-danger bg-theme-danger-tint p-5"><h2 className="font-semibold text-theme-danger">Creator application needs updates</h2>{application?.rejectionReason && <p className="mt-2 text-sm text-theme-text">{application.rejectionReason}</p>}<p className="mt-2 text-sm text-theme-text">Review the feedback, update your application, and resubmit it through the existing application flow.</p><Link to="/creator-application" className="mt-4 inline-block text-sm font-medium text-theme-accent underline">Update application</Link></section>;
  }
  const beginApplication = async () => {
    setCheckingEligibility(true);
    setEligibilityError(null);
    try {
      const response = await api.get<{ eligible: boolean; message?: string }>("/v1/bookings/creator-journey-eligibility");
      if (!response.data.eligible) {
        setEligibilityError(response.data.message ?? "You must resolve your active bookings before applying as a Creator.");
        return;
      }
      navigate("/creator-application");
    } catch (requestError) {
      const message = axios.isAxiosError(requestError) && typeof requestError.response?.data?.message === "string"
        ? requestError.response.data.message
        : "Unable to check Creator application eligibility. Please try again.";
      setEligibilityError(message);
    } finally {
      setCheckingEligibility(false);
    }
  };
  return <section className="rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-5"><h2 className="font-semibold text-theme-text">Become a Creator</h2><p className="mt-2 text-sm text-theme-muted">Your verified profile is eligible for the existing Creator application flow.</p>{eligibilityError && <p className="mt-3 rounded-[var(--radius-control)] border border-theme-danger bg-theme-danger-tint p-3 text-sm text-theme-danger">{eligibilityError}</p>}<button type="button" disabled={checkingEligibility} onClick={() => void beginApplication()} className="mt-4 rounded-[var(--radius-control)] bg-theme-primary px-4 py-2 text-sm font-medium text-theme-primary-text transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">{checkingEligibility ? "Checking eligibility..." : "Begin Creator Application"}</button></section>;
}

function CreatorAccountSection() {
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await api.get<CreatorProfile>("/v1/creator/profile");
        if (!cancelled) setProfile(response.data);
      } catch {
        if (!cancelled) setError("Creator account details are unavailable right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <p className="text-sm text-theme-muted">Loading Creator account details...</p>;
  if (error || !profile) return <p className="rounded-[var(--radius-card)] border border-theme-danger bg-theme-danger-tint p-4 text-sm text-theme-danger">{error ?? "Creator account details are unavailable right now."}</p>;

  const categories = profile.categories?.length ? profile.categories.join(", ") : profile.primaryCategory;
  const languages = profile.languages?.length ? profile.languages.join(", ") : "Not specified";
  return <section className="space-y-5"><div><h2 className="text-xl font-semibold text-theme-text">Creator Account</h2><p className="mt-1 text-sm text-theme-muted">Your approved Creator profile and workspace shortcuts.</p></div><div className="rounded-[var(--radius-card)] border border-theme-success bg-theme-success-tint p-4"><p className="text-sm font-semibold text-theme-success">Approved Creator · {profile.status}</p><p className="mt-1 text-sm text-theme-text">Your account is ready to offer services and manage bookings.</p></div><dl className="grid gap-4 rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-5 text-sm sm:grid-cols-2"><div><dt className="text-theme-muted">Display name</dt><dd className="mt-1 text-theme-text">{profile.displayName}</dd></div><div><dt className="text-theme-muted">Public slug</dt><dd className="mt-1 text-theme-text">{profile.slug}</dd></div><div><dt className="text-theme-muted">Category</dt><dd className="mt-1 text-theme-text">{categories}</dd></div><div><dt className="text-theme-muted">Location</dt><dd className="mt-1 text-theme-text">{profile.city}, {profile.country}</dd></div><div><dt className="text-theme-muted">Creator currency</dt><dd className="mt-1 text-theme-text">{profile.currency}</dd></div><div><dt className="text-theme-muted">Languages</dt><dd className="mt-1 text-theme-text">{languages}</dd></div></dl><div className="flex flex-wrap gap-3"><Link to="/creator/profile" className="rounded-[var(--radius-control)] border border-theme-border bg-theme-surface px-4 py-2 text-sm font-medium text-theme-text transition-colors hover:border-theme-border-strong hover:bg-theme-inset">Edit Creator Profile</Link><Link to="/dashboard/creator/services" className="rounded-[var(--radius-control)] border border-theme-border bg-theme-surface px-4 py-2 text-sm font-medium text-theme-text transition-colors hover:border-theme-border-strong hover:bg-theme-inset">Manage Services</Link><Link to="/dashboard/creator/availability" className="rounded-[var(--radius-control)] border border-theme-border bg-theme-surface px-4 py-2 text-sm font-medium text-theme-text transition-colors hover:border-theme-border-strong hover:bg-theme-inset">Manage Availability</Link></div></section>;
}

function AppearanceSection() {
  const { preference, setPreference } = useTheme();
  const options: Array<{ value: ThemePreference; label: string; description: string }> = [
    { value: "light", label: "Light", description: "Use the light interface." },
    { value: "dark", label: "Dark", description: "Use the dark interface." },
    { value: "system", label: "System", description: "Follow your device appearance." },
  ];

  return (
    <section aria-labelledby="appearance-heading" className="rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-4 sm:p-5">
      <div>
        <h2 id="appearance-heading" className="text-lg font-semibold text-theme-text">Appearance</h2>
        <p className="mt-1 text-sm text-theme-muted">Choose how STHN appears on this device.</p>
      </div>
      <fieldset className="mt-4 grid gap-3 sm:grid-cols-3">
        <legend className="sr-only">Theme preference</legend>
        {options.map((option) => {
          const selected = preference === option.value;
          return (
            <label key={option.value} className="block cursor-pointer">
              <input
                type="radio"
                name="theme-preference"
                value={option.value}
                checked={selected}
                onChange={() => setPreference(option.value)}
                className="peer sr-only"
              />
              <span className={`flex min-h-24 flex-col rounded-[var(--radius-control)] border p-3 text-left transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-theme-accent ${selected ? "border-theme-accent bg-theme-accent-tint text-theme-accent" : "border-theme-border bg-theme-inset text-theme-text hover:border-theme-border-strong"}`}>
                <span className="text-sm font-medium">{option.label}</span>
                <span className={`mt-1 text-xs leading-5 ${selected ? "text-theme-accent" : "text-theme-muted"}`}>{option.description}</span>
                {selected ? <span className="mt-2 text-xs font-medium">Selected</span> : null}
              </span>
            </label>
          );
        })}
      </fieldset>
    </section>
  );
}

export default function AccountSettingsPage({ actor, section }: Props) {
  const Layout = actor === "user" ? UserDashboardLayout : DashboardLayout;
  const basePath = `/dashboard/${actor}/settings`;
  const content = section === "account" && actor === "user" ? <CustomerAccountSection /> : section === "creator" ? (actor === "user" ? <CreatorSettingsSection /> : <CreatorAccountSection />) : <DisputeTrackingContent actor={actor} embedded />;
  return <Layout><section className="mx-auto max-w-6xl space-y-6"><div><h1 className="text-2xl font-semibold text-theme-text">Settings</h1><p className="mt-1 text-sm text-theme-muted">Manage your account and participant support activity.</p></div><div className="flex flex-col gap-5 md:flex-row"><aside className="shrink-0 rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-3 md:w-56"><p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-theme-muted">Settings menu</p><nav className="flex gap-2 overflow-x-auto md:flex-col">{actor === "user" && <NavLink to={`${basePath}/account`} className={({ isActive }) => `whitespace-nowrap rounded-[var(--radius-control)] px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-theme-accent-tint text-theme-accent" : "text-theme-muted hover:bg-theme-inset hover:text-theme-text"}`}>Account</NavLink>}<NavLink to={`${basePath}/creator`} className={({ isActive }) => `whitespace-nowrap rounded-[var(--radius-control)] px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-theme-accent-tint text-theme-accent" : "text-theme-muted hover:bg-theme-inset hover:text-theme-text"}`}>{actor === "user" ? "Creator" : "Creator Account"}</NavLink><NavLink to={`${basePath}/disputes`} className={({ isActive }) => `whitespace-nowrap rounded-[var(--radius-control)] px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-theme-accent-tint text-theme-accent" : "text-theme-muted hover:bg-theme-inset hover:text-theme-text"}`}>Disputes</NavLink></nav></aside><div className="min-w-0 flex-1 space-y-6 rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-5 md:p-6"><AppearanceSection />{content}</div></div></section></Layout>;
}
