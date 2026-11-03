import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../../../api/axios";
import AdminEmptyState from "../../../components/admin/feedback/AdminEmptyState";
import AdminLoadingState from "../../../components/admin/feedback/AdminLoadingState";
import AdminLayout from "../../../components/admin/layout/AdminLayout";
import AdminPageHeader from "../../../components/admin/layout/AdminPageHeader";

type RiskReason = "HIGH_CANCELLATION" | "ABUSE_SCORE" | "ACTIVE_COOLDOWN";

type RiskSummary = {
  totalHighRiskCreators: number;
  reasons: Partial<Record<RiskReason, number>>;
};

type HighRiskCreator = {
  creatorId: string;
  name?: string;
  email?: string;
  abuseScore?: number;
  cooldownUntil?: string | null;
  cancellationRate: number;
  riskReasons: RiskReason[];
};

const reasonLabels: Record<RiskReason, string> = {
  HIGH_CANCELLATION: "High cancellation rate",
  ABUSE_SCORE: "Abuse-score threshold",
  ACTIVE_COOLDOWN: "Active Creator cooldown",
};

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "—";
}

export default function AdminRiskCenterPage() {
  const [summary, setSummary] = useState<RiskSummary | null>(null);
  const [creators, setCreators] = useState<HighRiskCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [summaryResponse, creatorsResponse] = await Promise.all([
          api.get<RiskSummary>("/v1/admin/dashboard/creators/risk-summary"),
          api.get<HighRiskCreator[]>("/v1/admin/dashboard/creators/high-risk"),
        ]);

        if (!active) return;
        setSummary(summaryResponse.data);
        setCreators(creatorsResponse.data);
      } catch (requestError: unknown) {
        if (!active) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load the available risk evidence.",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <AdminLayout workspace="operations">
      <div className="space-y-6">
        <AdminPageHeader
          title="Risk Center"
          description="Read-only operational risk evidence from the existing high-risk Creator dashboard APIs."
        />

        {loading ? <AdminLoadingState /> : null}
        {error ? <p className="rounded border border-red-900 bg-red-950/40 p-4 text-red-200">{error}</p> : null}

        {!loading && !error && summary ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Risk summary">
              <Metric label="High-risk Creator evidence" value={summary.totalHighRiskCreators} />
              {(Object.keys(reasonLabels) as RiskReason[]).map((reason) => (
                <Metric key={reason} label={reasonLabels[reason]} value={summary.reasons[reason] ?? 0} />
              ))}
            </section>

            <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
              <h2 className="text-lg font-semibold">Available review queues</h2>
              <p className="mt-1 text-sm text-neutral-400">
                The current dashboard APIs do not provide consolidated queue, dispute, or appeal counts. Use the existing protected review surfaces to inspect and decide those records.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <RiskLink to="/admin/operations/profile-verification">AI verification queue</RiskLink>
                <RiskLink to="/admin/operations/profile-verification/admin-review">Admin review queue</RiskLink>
                <RiskLink to="/admin/operations/disputes">Dispute operations</RiskLink>
                <RiskLink to="/admin/operations/governance">Governance &amp; actions</RiskLink>
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50">
              <div className="border-b border-neutral-800 px-5 py-4">
                <h2 className="text-lg font-semibold">High-risk Creators</h2>
                <p className="mt-1 text-sm text-neutral-400">Evidence is limited to cancellation rate, abuse score, and active Creator cooldowns.</p>
              </div>
              {creators.length === 0 ? (
                <div className="p-5"><AdminEmptyState title="No high-risk Creators" description="The current risk criteria produced no records." /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-neutral-950 text-neutral-400">
                      <tr>
                        <th className="px-5 py-3 font-medium">Creator</th>
                        <th className="px-5 py-3 font-medium">Cancellation rate</th>
                        <th className="px-5 py-3 font-medium">Abuse score</th>
                        <th className="px-5 py-3 font-medium">Cooldown until</th>
                        <th className="px-5 py-3 font-medium">Reasons</th>
                      </tr>
                    </thead>
                    <tbody>
                      {creators.map((creator) => (
                        <tr key={creator.creatorId} className="border-t border-neutral-800 align-top">
                          <td className="px-5 py-4"><p className="font-medium text-white">{creator.name || "Unnamed Creator"}</p><p className="text-neutral-400">{creator.email || creator.creatorId}</p></td>
                          <td className="px-5 py-4">{creator.cancellationRate.toFixed(1)}%</td>
                          <td className="px-5 py-4">{creator.abuseScore ?? "—"}</td>
                          <td className="px-5 py-4">{formatDate(creator.cooldownUntil)}</td>
                          <td className="px-5 py-4"><div className="flex flex-wrap gap-2">{creator.riskReasons.map((reason) => <span key={reason} className="rounded-full bg-amber-950 px-2 py-1 text-xs text-amber-200">{reasonLabels[reason] ?? reason}</span>)}</div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5"><p className="text-sm text-neutral-400">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>;
}

function RiskLink({ to, children }: { to: string; children: React.ReactNode }) {
  return <Link to={to} className="rounded-lg border border-neutral-700 px-3 py-2 text-neutral-100 hover:bg-neutral-800">{children}</Link>;
}
