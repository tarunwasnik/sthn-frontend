import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import axios from "axios";

import api from "../api/axios";
import { useAuth } from "../hooks/useAuth";
import DashboardLayout from "../layouts/DashboardLayout";
import UserDashboardLayout from "../layouts/UserDashboardLayout";
import { DisputeTrackingContent } from "./DisputesPage";

type SettingsActor = "user" | "creator";
type SettingsSection = "creator" | "disputes";

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

  if (loading) return <p className="text-sm text-white/50">Loading creator application status...</p>;
  if (error) return <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">{error}</p>;

  const applicationStatus = application?.status ?? creatorStatus ?? "none";
  if (applicationStatus === "approved" || creatorStatus === "approved") {
    return <section className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5"><h2 className="font-semibold text-emerald-200">Creator account active</h2><p className="mt-2 text-sm text-white/65">Your Creator account is approved. Manage your services, availability, and bookings from the Creator workspace.</p><Link to="/dashboard/creator" className="mt-4 inline-block text-sm font-semibold text-emerald-200 underline">Open Creator Dashboard</Link></section>;
  }
  if (profileStatus !== "verified") {
    return <section className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5"><h2 className="font-semibold text-yellow-200">Profile verification required</h2><p className="mt-2 text-sm text-white/65">Your profile must be verified before you can apply as a Creator.</p><Link to="/profile" className="mt-4 inline-block text-sm font-semibold text-cyan-200 underline">View profile</Link></section>;
  }
  if (applicationStatus === "submitted" || applicationStatus === "pending") {
    return <section className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5"><h2 className="font-semibold text-yellow-200">Creator application pending</h2><p className="mt-2 text-sm text-white/65">Your application is under review. No further submission is available while it is pending.</p></section>;
  }
  if (applicationStatus === "rejected") {
    return <section className="rounded-xl border border-red-500/20 bg-red-500/5 p-5"><h2 className="font-semibold text-red-200">Creator application needs updates</h2>{application?.rejectionReason && <p className="mt-2 text-sm text-white/70">{application.rejectionReason}</p>}<p className="mt-2 text-sm text-white/65">Review the feedback, update your application, and resubmit it through the existing application flow.</p><Link to="/creator-application" className="mt-4 inline-block text-sm font-semibold text-cyan-200 underline">Update application</Link></section>;
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
  return <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5"><h2 className="font-semibold text-white">Become a Creator</h2><p className="mt-2 text-sm text-white/65">Your verified profile is eligible for the existing Creator application flow.</p>{eligibilityError && <p className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-100">{eligibilityError}</p>}<button type="button" disabled={checkingEligibility} onClick={() => void beginApplication()} className="mt-4 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60">{checkingEligibility ? "Checking eligibility..." : "Begin Creator Application"}</button></section>;
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

  if (loading) return <p className="text-sm text-white/50">Loading Creator account details...</p>;
  if (error || !profile) return <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">{error ?? "Creator account details are unavailable right now."}</p>;

  const categories = profile.categories?.length ? profile.categories.join(", ") : profile.primaryCategory;
  const languages = profile.languages?.length ? profile.languages.join(", ") : "Not specified";
  return <section className="space-y-5"><div><h2 className="text-xl font-semibold text-white">Creator Account</h2><p className="mt-1 text-sm text-white/50">Your approved Creator profile and workspace shortcuts.</p></div><div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"><p className="text-sm font-semibold text-emerald-200">Approved Creator · {profile.status}</p><p className="mt-1 text-sm text-white/65">Your account is ready to offer services and manage bookings.</p></div><dl className="grid gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-5 text-sm sm:grid-cols-2"><div><dt className="text-white/45">Display name</dt><dd className="mt-1 text-white">{profile.displayName}</dd></div><div><dt className="text-white/45">Public slug</dt><dd className="mt-1 text-white">{profile.slug}</dd></div><div><dt className="text-white/45">Category</dt><dd className="mt-1 text-white">{categories}</dd></div><div><dt className="text-white/45">Location</dt><dd className="mt-1 text-white">{profile.city}, {profile.country}</dd></div><div><dt className="text-white/45">Creator currency</dt><dd className="mt-1 text-white">{profile.currency}</dd></div><div><dt className="text-white/45">Languages</dt><dd className="mt-1 text-white">{languages}</dd></div></dl><div className="flex flex-wrap gap-3"><Link to="/creator/profile" className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/5">Edit Creator Profile</Link><Link to="/dashboard/creator/services" className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/5">Manage Services</Link><Link to="/dashboard/creator/availability" className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/5">Manage Availability</Link></div></section>;
}

export default function AccountSettingsPage({ actor, section }: Props) {
  const Layout = actor === "user" ? UserDashboardLayout : DashboardLayout;
  const basePath = `/dashboard/${actor}/settings`;
  const content = section === "creator" ? (actor === "user" ? <CreatorSettingsSection /> : <CreatorAccountSection />) : <DisputeTrackingContent actor={actor} embedded />;
  return <Layout><section className="mx-auto max-w-6xl space-y-6"><div><h1 className="text-2xl font-bold text-white">Settings</h1><p className="mt-1 text-sm text-white/50">Manage your account and participant support activity.</p></div><div className="flex flex-col gap-5 md:flex-row"><aside className="shrink-0 rounded-xl border border-white/10 bg-white/[0.03] p-3 md:w-56"><p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-white/40">Settings menu</p><nav className="flex gap-2 overflow-x-auto md:flex-col">{<NavLink to={`${basePath}/creator`} className={({ isActive }) => `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"}`}>{actor === "user" ? "Creator" : "Creator Account"}</NavLink>}<NavLink to={`${basePath}/disputes`} className={({ isActive }) => `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"}`}>Disputes</NavLink></nav></aside><div className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.02] p-5 md:p-6">{content}</div></div></section></Layout>;
}
