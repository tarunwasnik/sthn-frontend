import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getMyDisputes } from "../features/dispute/api";
import InvestigationClosedFooter from "../features/dispute/components/InvestigationClosedFooter";
import InvestigationComposer from "../features/dispute/components/InvestigationComposer";
import InvestigationHeader from "../features/dispute/components/InvestigationHeader";
import InvestigationThread from "../features/dispute/components/InvestigationThread";
import type { DisputeListItem } from "../features/dispute/types";
import { useParticipantInvestigation } from "../features/dispute/useParticipantInvestigation";
import DashboardLayout from "../layouts/DashboardLayout";
import UserDashboardLayout from "../layouts/UserDashboardLayout";

type Props = { actor: "user" | "creator" };

function Detail({ actor }: Props) {
  const { disputeId } = useParams<{ disputeId: string }>();
  const operations = useParticipantInvestigation(disputeId);
  const [dispute, setDispute] = useState<DisputeListItem | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    if (!disputeId) return;
    let cancelled = false;

    void (async () => {
      try {
        const found = (await getMyDisputes()).find((item) => item.disputeId === disputeId) ?? null;
        if (!cancelled) {
          setDispute(found);
          setDetailError(found ? null : "This dispute is unavailable.");
        }
      } catch {
        if (!cancelled) setDetailError("Dispute details are unavailable right now.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [disputeId]);

  const backPath = `/dashboard/${actor}/settings/disputes`;

  if (operations.loading || (!dispute && !detailError)) {
    return (
      <div className="mx-auto max-w-4xl rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-8 text-center">
        <p className="text-sm text-theme-muted">Loading dispute investigation...</p>
      </div>
    );
  }

  if (operations.error || detailError || !operations.investigation || !dispute) {
    return (
      <section className="mx-auto max-w-4xl space-y-4">
        <Link to={backPath} className="text-sm font-semibold text-theme-accent hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">
          ← Back to disputes
        </Link>
        <div className="flex items-start gap-3 rounded-[var(--radius-card)] border border-theme-danger bg-theme-danger-tint p-5 text-sm text-theme-danger">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold text-theme-text">Unable to load investigation</p>
            <p className="mt-1 text-xs">
              {operations.error ?? detailError ?? "This dispute investigation is unavailable."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const isInputOpen =
    operations.investigation.dispute.status === "OPEN" &&
    operations.investigation.dispute.input.state === "OPEN";

  const handleStatementSubmit = async (text: string) => {
    return operations.submit({ kind: "STATEMENT", text });
  };

  const handleEvidenceUpload = async (type: "IMAGE" | "DOCUMENT", file: File, note: string) => {
    return operations.upload(type, file, note);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* 1. Compact dispute header */}
      <InvestigationHeader
        dispute={dispute}
        inputState={operations.investigation.dispute.input.state}
        actor={actor}
        onRefresh={operations.refresh}
        refreshing={operations.loading}
      />

      {/* Mutation / Transient Error Alert */}
      {operations.error && (
        <div className="flex items-center gap-2 rounded-[var(--radius-control)] border border-theme-danger bg-theme-danger-tint px-4 py-2.5 text-xs text-theme-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{operations.error}</span>
        </div>
      )}

      {/* 2. Chronological investigation thread */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-theme-muted">
            Investigation Thread
          </h2>
          <span className="text-[11px] text-theme-muted">
            {operations.investigation.submissions.length +
              operations.investigation.adminRequests.length +
              operations.investigation.directEvidence.length}{" "}
            event(s)
          </span>
        </div>

        <InvestigationThread
          submissions={operations.investigation.submissions}
          adminRequests={operations.investigation.adminRequests}
          directEvidence={operations.investigation.directEvidence}
        />
      </section>

      {/* 3. Unified composer or read-only/closed footer */}
      {isInputOpen ? (
        <section className="pt-2">
          <InvestigationComposer
            onSubmitStatement={handleStatementSubmit}
            onUploadEvidence={handleEvidenceUpload}
            pending={operations.pending}
          />
        </section>
      ) : (
        <section className="pt-2">
          <InvestigationClosedFooter
            disputeStatus={operations.investigation.dispute.status}
            inputState={operations.investigation.dispute.input.state}
          />
        </section>
      )}
    </div>
  );
}

export default function ParticipantDisputeDetailPage({ actor }: Props) {
  const Layout = actor === "user" ? UserDashboardLayout : DashboardLayout;
  return (
    <Layout>
      <Detail actor={actor} />
    </Layout>
  );
}

