import { ArrowLeft, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import AdminPageHeader from "../../components/admin/layout/AdminPageHeader";
import { getSupportedCurrencies } from "../wallet/api";
import type { CurrencyMetadataDto } from "../wallet/types";
import { formatMinorAmount } from "../walletConversion/money";
import { useAdminDisputes } from "./useAdminDisputes";
import type { AdminDisputeDetail, AdminDisputeStatus, EscalationLevel } from "./types";
import AdminInvestigationThread from "./components/AdminInvestigationThread";
import AdminInvestigationComposer from "./components/AdminInvestigationComposer";
import AdminInvestigationControlPanel from "./components/AdminInvestigationControlPanel";

const statuses: Array<AdminDisputeStatus | undefined> = [undefined, "OPEN", "RESOLVED", "REJECTED"];
const escalations: Array<EscalationLevel | undefined> = [undefined, "NONE", "SOFT", "HARD"];
const dateTime = (value: string | null | undefined) => (value ? new Date(value).toLocaleString() : "—");

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-white">{value}</dd>
    </div>
  );
}

export default function AdminDisputeOperationsPage() {
  const navigate = useNavigate();
  const { disputeId } = useParams<{ disputeId: string }>();
  const operations = useAdminDisputes(disputeId);
  const [currencies, setCurrencies] = useState<CurrencyMetadataDto[]>([]);
  const [note, setNote] = useState("");
  const metadata = useMemo(() => new Map(currencies.map((currency) => [currency.code, currency])), [currencies]);
  const money = (amount: number, currency: string) => formatMinorAmount(amount, currency, metadata.get(currency));

  useEffect(() => {
    void getSupportedCurrencies().then(setCurrencies).catch(() => setCurrencies([]));
  }, []);

  const close = async () => {
    if (
      !operations.detail ||
      !window.confirm(
        `Close dispute ${operations.detail.dispute.disputeId} with no financial action?\n\nNo refund, Creator payment, Wallet, Ledger, escrow, or settlement movement will occur.`
      )
    )
      return;
    await operations.closeNoAction(note.trim());
  };

  return (
    <AdminLayout workspace="operations">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
        Admin operations · disputes
      </p>
      <AdminPageHeader
        title={disputeId ? "Dispute detail" : "Disputes"}
        description="Review bounded dispute, booking, and financial state. Financial outcomes are intentionally unavailable."
      >
        <button
          type="button"
          onClick={operations.refresh}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 px-3.5 py-2 text-sm text-neutral-200 hover:bg-neutral-800"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </AdminPageHeader>
      {!disputeId ? (
        <Queue operations={operations} navigate={navigate} />
      ) : (
        <Detail
          operations={operations}
          navigate={navigate}
          money={money}
          note={note}
          setNote={setNote}
          close={close}
        />
      )}
    </AdminLayout>
  );
}

function Queue({
  operations,
  navigate,
}: {
  operations: ReturnType<typeof useAdminDisputes>;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <label className="text-sm text-neutral-300">
          Status
          <select
            value={operations.filters.status ?? ""}
            onChange={(event) =>
              operations.setStatus((event.target.value || undefined) as AdminDisputeStatus | undefined)
            }
            className="ml-2 rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-white"
          >
            {statuses.map((status) => (
              <option key={status ?? "all"} value={status ?? ""}>
                {status ?? "All"}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-neutral-300">
          Escalation
          <select
            value={operations.filters.escalationLevel ?? ""}
            onChange={(event) =>
              operations.setEscalationLevel((event.target.value || undefined) as EscalationLevel | undefined)
            }
            className="ml-2 rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-white"
          >
            {escalations.map((level) => (
              <option key={level ?? "all"} value={level ?? ""}>
                {level ?? "All"}
              </option>
            ))}
          </select>
        </label>
      </div>

      {operations.listState === "loading" && (
        <p className="rounded-xl border border-neutral-800 p-5 text-neutral-400">Loading disputes…</p>
      )}
      {operations.listState === "error" && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">{operations.error}</p>
      )}
      {operations.listState === "ready" && operations.list?.disputes.length === 0 && (
        <p className="rounded-xl border border-neutral-800 p-5 text-neutral-400">No disputes match this view.</p>
      )}

      {operations.list?.disputes.map((item) => (
        <button
          key={item.disputeId}
          type="button"
          onClick={() => navigate(`/admin/operations/disputes/${item.disputeId}`)}
          className="grid w-full gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 text-left hover:border-neutral-600 md:grid-cols-5"
        >
          <div>
            <p className="text-xs text-neutral-500">Booking</p>
            <p className="mt-1 font-semibold text-white">{item.booking?.bookingReference ?? "Unavailable"}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Status</p>
            <p className="mt-1 text-white">{item.status}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Raised by</p>
            <p className="mt-1 text-white">{item.raisedByRole}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Escalation</p>
            <p className="mt-1 text-white">{item.escalationLevel}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Opened</p>
            <p className="mt-1 text-sm text-white">{dateTime(item.createdAt)}</p>
          </div>
        </button>
      ))}

      {operations.list && (
        <div className="flex justify-between text-sm text-neutral-400">
          <span>{operations.list.pagination.total} total</span>
          <div className="space-x-2">
            <button
              disabled={operations.list.pagination.page <= 1}
              onClick={() => operations.setPage(operations.list!.pagination.page - 1)}
            >
              Previous
            </button>
            <button
              disabled={operations.list.pagination.page * operations.list.pagination.limit >= operations.list.pagination.total}
              onClick={() => operations.setPage(operations.list!.pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function Detail({
  operations,
  navigate,
  money,
  note,
  setNote,
  close,
}: {
  operations: ReturnType<typeof useAdminDisputes>;
  navigate: ReturnType<typeof useNavigate>;
  money: (amount: number, currency: string) => string;
  note: string;
  setNote: (value: string) => void;
  close: () => Promise<void>;
}) {
  const record = operations.detail;
  if (operations.detailState === "loading")
    return <p className="rounded-xl border border-neutral-800 p-5 text-neutral-400">Loading dispute…</p>;
  if (operations.detailState === "error" || !record)
    return <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">{operations.error}</p>;

  return (
    <section className="space-y-6">
      <button
        type="button"
        onClick={() => navigate("/admin/operations/disputes")}
        className="inline-flex items-center gap-2 text-sm text-neutral-300 hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to disputes
      </button>

      {/* 1. Dispute / Booking / Financial State / Resolution Section */}
      <DisputeDetail
        record={record}
        money={money}
        note={note}
        setNote={setNote}
        close={close}
        pending={operations.pending}
      />

      {/* 2. Investigation Conversation Workspace */}
      <AdminInvestigationWorkspace operations={operations} />
    </section>
  );
}

function AdminInvestigationWorkspace({
  operations,
}: {
  operations: ReturnType<typeof useAdminDisputes>;
}) {
  const data = operations.investigation;
  const [activeTab, setActiveTab] = useState<"CUSTOMER" | "CREATOR" | "ALL">("CUSTOMER");

  if (!data)
    return <p className="rounded-xl border border-neutral-800 p-5 text-neutral-400">Investigation context unavailable.</p>;

  const mutable = data.dispute.status === "OPEN";

  // Item counts for tabs
  const customerCount =
    data.customerBranch.length +
    data.customerAdminRequests.length +
    data.sharedAdminRequests.length +
    data.directEvidence.filter((e) => e.source === "CUSTOMER").length +
    data.adminEvidence.filter((e) => e.audience === "CUSTOMER" || e.audience === "BOTH").length;

  const creatorCount =
    data.creatorBranch.length +
    data.creatorAdminRequests.length +
    data.sharedAdminRequests.length +
    data.directEvidence.filter((e) => e.source === "CREATOR").length +
    data.adminEvidence.filter((e) => e.audience === "CREATOR" || e.audience === "BOTH").length;

  const allCount =
    data.customerBranch.length +
    data.creatorBranch.length +
    data.customerAdminRequests.length +
    data.creatorAdminRequests.length +
    data.sharedAdminRequests.length +
    data.directEvidence.length +
    data.adminEvidence.length;

  return (
    <section className="space-y-4 pt-2">
      {/* Workspace Header & Branch Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900/60 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("CUSTOMER")}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === "CUSTOMER"
                ? "bg-sky-400/20 text-sky-200 border border-sky-400/30 shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <span>Customer</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                activeTab === "CUSTOMER" ? "bg-sky-400/30 text-sky-100" : "bg-neutral-800 text-neutral-400"
              }`}
            >
              {customerCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("CREATOR")}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === "CREATOR"
                ? "bg-purple-400/20 text-purple-200 border border-purple-400/30 shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <span>Creator</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                activeTab === "CREATOR" ? "bg-purple-400/30 text-purple-100" : "bg-neutral-800 text-neutral-400"
              }`}
            >
              {creatorCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === "ALL"
                ? "bg-neutral-700/60 text-white border border-neutral-600 shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <span>All Activity</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                activeTab === "ALL" ? "bg-neutral-600 text-white" : "bg-neutral-800 text-neutral-400"
              }`}
            >
              {allCount}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-neutral-400">
            Dispute: <strong className="text-white font-mono">{data.dispute.disputeId}</strong>
          </span>
          <span className="text-neutral-400">
            Status: <strong className="text-white">{data.dispute.status}</strong>
          </span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr] xl:grid-cols-[1.4fr_0.6fr]">
        {/* Left Column: Dedicated Conversation Thread & Composer */}
        <div className="flex flex-col space-y-4">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 shadow-lg sm:p-5 flex-1">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                {activeTab === "CUSTOMER"
                  ? "Admin ↔ Customer Investigation Conversation"
                  : activeTab === "CREATOR"
                  ? "Admin ↔ Creator Investigation Conversation"
                  : "Complete Chronological Investigation Audit Log"}
              </h3>
              {activeTab === "ALL" && (
                <span className="rounded-full border border-neutral-700 bg-neutral-800 px-2 py-0.5 text-[10px] font-medium text-neutral-400">
                  Read-only audit log
                </span>
              )}
            </div>

            <AdminInvestigationThread
              activeTab={activeTab}
              customerBranch={data.customerBranch}
              creatorBranch={data.creatorBranch}
              customerAdminRequests={data.customerAdminRequests}
              creatorAdminRequests={data.creatorAdminRequests}
              sharedAdminRequests={data.sharedAdminRequests}
              directEvidence={data.directEvidence}
              adminEvidence={data.adminEvidence}
              finalDecision={data.finalDecision}
              mutable={mutable}
              onShareSubmission={(ref) => operations.share(ref)}
            />
          </div>

          {/* Composer at bottom of conversation area (CUSTOMER and CREATOR tabs only) */}
          {activeTab !== "ALL" && (
            <AdminInvestigationComposer
              activeTab={activeTab}
              onRequestInfo={(target, text) => operations.requestInfo(target, text)}
              onUploadEvidence={(type, file, audience, note) =>
                operations.uploadEvidence(type, file, audience, note)
              }
              pending={operations.pending}
              disabled={!mutable}
            />
          )}
        </div>

        {/* Right Column: Investigation Controls, Context, Findings, Final Decision */}
        <div className="space-y-4">
          <AdminInvestigationControlPanel operations={operations} />
        </div>
      </div>
    </section>
  );
}

function DisputeDetail({
  record,
  money,
  note,
  setNote,
  close,
  pending,
}: {
  record: AdminDisputeDetail;
  money: (amount: number, currency: string) => string;
  note: string;
  setNote: (value: string) => void;
  close: () => Promise<void>;
  pending: boolean;
}) {
  const currency = record.booking?.currency ?? record.payment?.currency ?? "USD";
  return (
    <>
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">Dispute</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Status" value={record.dispute.status} />
          <Field label="Raised by" value={record.dispute.raisedByRole} />
          <Field label="Escalation" value={record.dispute.escalationLevel} />
          <Field label="Opened" value={dateTime(record.dispute.createdAt)} />
          <Field label="Escalated" value={dateTime(record.dispute.escalatedAt)} />
          <Field label="Signals" value={record.dispute.signals.join(", ") || "None"} />
        </dl>
        <p className="mt-4 text-sm text-neutral-200">{record.dispute.reason}</p>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">Booking</h2>
          {record.booking ? (
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Reference" value={record.booking.bookingReference ?? "—"} />
              <Field label="Status" value={record.booking.status} />
              <Field label="Service" value={record.booking.serviceTitle} />
              <Field label="Created" value={dateTime(record.booking.createdAt)} />
              <Field label="Gross" value={money(record.booking.totalAmount, currency)} />
              <Field label="Completed" value={dateTime(record.booking.completedAt)} />
            </dl>
          ) : (
            <p className="mt-4 text-sm text-neutral-400">Booking context unavailable.</p>
          )}
        </section>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">Financial state</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Payment"
              value={record.payment ? `${record.payment.status} · ${record.payment.paymentReference}` : "None"}
            />
            <Field
              label="Reservation"
              value={
                record.reservation
                  ? `${record.reservation.status} · ${record.reservation.reservationReference}`
                  : "None"
              }
            />
            <Field
              label="Escrow"
              value={
                record.escrow ? `${record.escrow.status} · ${record.escrow.allocationReference}` : "None"
              }
            />
            <Field
              label="Settlement"
              value={
                record.settlement
                  ? `${record.settlement.status} · ${record.settlement.settlementReference}`
                  : "None"
              }
            />
            <Field
              label="Refund"
              value={record.refund ? `${record.refund.status} · ${record.refund.refundReference}` : "None"}
            />
          </dl>
        </section>
      </div>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">Resolution</h2>
        {record.dispute.resolution ? (
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Action" value={record.dispute.resolution.action} />
            <Field label="Resolved" value={dateTime(record.dispute.resolution.resolvedAt)} />
            <Field label="Note" value={record.dispute.resolution.note ?? "—"} />
          </dl>
        ) : record.dispute.allowedActions.includes("NO_ACTION") ? (
          <div className="mt-4">
            <p className="text-sm text-neutral-300">
              Only a non-financial closure is currently supported. No Wallet, Ledger, escrow, settlement, refund,
              or Creator payment will occur.
            </p>
            <textarea
              value={note}
              maxLength={1000}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Resolution note (optional)"
              className="mt-4 min-h-20 w-full rounded-lg border border-neutral-700 bg-neutral-950 p-3 text-sm text-white"
            />
            <button
              type="button"
              disabled={pending}
              onClick={() => void close()}
              className="mt-3 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              {pending ? "Closing…" : "Close dispute — no financial action"}
            </button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-neutral-400">No safe resolution action is available for this dispute.</p>
        )}
      </section>
    </>
  );
}

