import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminLayout from "../../components/admin/layout/AdminLayout";
import AdminPageHeader from "../../components/admin/layout/AdminPageHeader";
import { formatMinorAmount } from "../walletConversion/money";
import { useAdminWalletConversions } from "./useAdminWalletConversions";
import type {
  WalletConversionProviderStatus,
  WalletConversionRejectionCode,
  WalletConversionRepairAction,
  WalletConversionStatus,
} from "./types";

// Presentation-only human mapping. The exact backend action string is preserved
// when invoking repairReconciliation(action); this only renders a readable label.
const repairPresentation: Record<
  WalletConversionRepairAction,
  { label: string; description: string }
> = {
  RESTORE_MISSING_AUDIT: {
    label: "Restore missing audit record",
    description:
      "Repairs missing audit metadata through the bounded backend recovery path.",
  },
  RESTORE_LEDGER_REFERENCES: {
    label: "Restore Ledger references",
    description:
      "Restores missing persisted Ledger linkage after backend financial proof.",
  },
  RESTORE_PROJECTION_REFERENCES: {
    label: "Restore Wallet projection references",
    description:
      "Restores missing Wallet projection linkage through backend validation.",
  },
  RESTORE_ACCOUNTING_REFERENCES: {
    label: "Restore accounting references",
    description:
      "Restores missing conversion accounting metadata after graph verification.",
  },
};

function isRepairAction(value: string): value is WalletConversionRepairAction {
  return value in repairPresentation;
}

const statuses: WalletConversionStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
  "FAILED",
];
const rejectionCodes: WalletConversionRejectionCode[] = [
  "ADMIN_DECLINED",
  "INVALID_REQUEST",
  "FX_SNAPSHOT_NOT_ACCEPTABLE",
  "INSUFFICIENT_SOURCE_FUNDS",
  "SIMULATION_REJECTED",
  "OTHER",
];

function dateTime(value?: string): string {
  return value ? new Date(value).toLocaleString() : "—";
}
function statusLabel(status: WalletConversionStatus): string {
  return {
    PENDING: "Pending decision",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    COMPLETED: "Completed",
    FAILED: "Failed",
  }[status];
}

function StatusBadge({ status }: { status: WalletConversionStatus }) {
  const tone: Record<WalletConversionStatus, string> = {
    PENDING: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    APPROVED: "border-sky-400/30 bg-sky-400/10 text-sky-200",
    REJECTED: "border-red-400/30 bg-red-400/10 text-red-200",
    COMPLETED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    FAILED: "border-red-400/30 bg-red-400/10 text-red-200",
  };
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${tone[status]}`}
    >
      {statusLabel(status)}
    </span>
  );
}

function ProviderBadge({
  status,
}: {
  status?: WalletConversionProviderStatus;
}) {
  if (!status) {
    return (
      <span className="inline-flex items-center rounded-full border border-neutral-700 bg-neutral-800/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
        Not started
      </span>
    );
  }
  const tone: Record<WalletConversionProviderStatus, string> = {
    INITIALIZED: "border-neutral-600 bg-neutral-800/60 text-neutral-300",
    PROCESSING: "border-sky-400/30 bg-sky-400/10 text-sky-200",
    SUCCEEDED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    FAILED: "border-red-400/30 bg-red-400/10 text-red-200",
  };
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${tone[status]}`}
    >
      {status}
    </span>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
          {title}
        </h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const primaryBtn =
  "inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-3.5 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50";
const finalBtn =
  "inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50";
const dangerBtn =
  "inline-flex items-center gap-2 rounded-lg bg-red-500 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50";
const outlineDangerBtn =
  "inline-flex items-center gap-2 rounded-lg border border-red-500/50 px-3.5 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50";
const ghostBtn =
  "inline-flex items-center gap-2 rounded-lg border border-neutral-700 px-3.5 py-2 text-sm font-medium text-neutral-200 transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50";
const inputCls =
  "mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-sky-400 focus:outline-none";
const labelCls = "block text-sm font-medium text-neutral-300";

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-white">{value}</dd>
    </div>
  );
}

function AmountBlock({
  label,
  amount,
  currency,
  tone,
  format,
}: {
  label: string;
  amount: number;
  currency: string;
  tone: "source" | "target";
  format: (amount: number, currency: string) => string;
}) {
  const toneCls =
    tone === "source"
      ? "border-sky-400/20 bg-sky-400/5"
      : "border-emerald-400/20 bg-emerald-400/5";
  const labelCls2 = tone === "source" ? "text-sky-300" : "text-emerald-300";
  return (
    <div className={`min-w-0 flex-1 rounded-xl border p-4 ${toneCls}`}>
      <p
        className={`text-[11px] font-semibold uppercase tracking-wider ${labelCls2}`}
      >
        {label}
      </p>
      <p className="mt-2 truncate text-lg font-bold tabular-nums text-white">
        {format(amount, currency)}
      </p>
      <p className="mt-0.5 text-xs font-medium text-neutral-400">{currency}</p>
    </div>
  );
}

export default function AdminWalletConversionOperationsPage() {
  const navigate = useNavigate();
  const { conversionReference } = useParams<{ conversionReference: string }>();
  const operations = useAdminWalletConversions(conversionReference);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionCode, setRejectionCode] =
    useState<WalletConversionRejectionCode>("ADMIN_DECLINED");
  const [rejectionReason, setRejectionReason] = useState("");
  const [failureCode, setFailureCode] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const metadata = useMemo(
    () => new Map(operations.currencies.map((item) => [item.code, item])),
    [operations.currencies],
  );
  const request = operations.detail;
  const fmt = (amount: number, currency: string) =>
    formatMinorAmount(amount, currency, metadata.get(currency));

  async function confirmAndRun(
    message: string,
    operation: () => Promise<boolean>,
  ) {
    if (!window.confirm(message)) return;
    await operation();
  }

  const lifecycleSteps = [
    "Request",
    "Approval",
    "Internal Provider",
    "Accounting",
    "Completed",
  ];

  return (
    <AdminLayout workspace="operations">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
        Admin operations · FX
      </p>
      <AdminPageHeader
        title={
          conversionReference
            ? "Wallet conversion detail"
            : "Wallet conversions"
        }
        description="Review conversion requests, control Internal Provider execution, complete accounting, and inspect reconciliation. Provider success is not accounting completion."
      >
        <button type="button" onClick={operations.refresh} className={ghostBtn}>
          <RefreshCw size={15} aria-hidden="true" />
          Refresh
        </button>
      </AdminPageHeader>

      {/* Static lifecycle explainer */}
      <div className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-2 rounded-2xl border border-neutral-800 bg-neutral-900/40 px-4 py-3">
        {lifecycleSteps.map((step, index) => (
          <span key={step} className="flex items-center gap-2">
            <span
              className={`text-xs font-medium ${
                step === "Accounting" ? "text-emerald-300" : "text-neutral-300"
              }`}
            >
              {step}
            </span>
            {index < lifecycleSteps.length - 1 && (
              <ArrowRight
                size={13}
                className="text-neutral-600"
                aria-hidden="true"
              />
            )}
          </span>
        ))}
        <span className="ml-auto text-xs text-neutral-500">
          Provider success is not accounting completion. Only backend accounting
          marks a request completed.
        </span>
      </div>

      {!conversionReference ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/40 px-4 py-3">
            <label className="flex items-center gap-2 text-sm text-neutral-300">
              Status
              <select
                value={operations.status}
                onChange={(event) =>
                  operations.setStatus(
                    event.target.value as WalletConversionStatus,
                  )
                }
                className="rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-1.5 text-sm text-white focus:border-sky-400 focus:outline-none"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-neutral-500">
              The backend supports one authoritative status filter at a time.
            </p>
          </div>

          {operations.queueState === "loading" ? (
            <p
              aria-busy="true"
              className="flex items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 text-neutral-400"
            >
              <RefreshCw
                size={16}
                className="animate-spin"
                aria-hidden="true"
              />
              Loading conversion requests…
            </p>
          ) : operations.queueState === "error" ? (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-200"
            >
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <p className="text-sm">{operations.queueError}</p>
            </div>
          ) : operations.queue.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-neutral-700 bg-neutral-900/30 p-10 text-center text-sm text-neutral-400">
              No {statusLabel(operations.status).toLowerCase()} conversion
              requests.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-neutral-800">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-neutral-900 text-[11px] uppercase tracking-wider text-neutral-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Reference</th>
                    <th className="px-4 py-3 font-medium">Conversion</th>
                    <th className="px-4 py-3 font-medium">Requested</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {operations.queue.map((item) => (
                    <tr
                      key={item.conversionReference}
                      className="border-t border-neutral-800 transition hover:bg-neutral-900/60"
                    >
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/admin/operations/wallet-conversions/${item.conversionReference}`,
                            )
                          }
                          className="break-all text-left font-mono text-xs text-sky-300 hover:underline"
                        >
                          {item.conversionReference}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="whitespace-nowrap font-medium text-neutral-100">
                          {fmt(item.sourceAmount, item.sourceCurrency)}{" "}
                          <span className="text-neutral-500">
                            {item.sourceCurrency}
                          </span>
                        </span>
                        <ArrowRight
                          size={13}
                          className="mx-1.5 inline text-neutral-500"
                          aria-hidden="true"
                        />
                        <span className="whitespace-nowrap font-medium text-neutral-100">
                          {fmt(item.targetAmount, item.targetCurrency)}{" "}
                          <span className="text-neutral-500">
                            {item.targetCurrency}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-400">
                        {dateTime(item.requestedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : operations.detailState === "loading" ? (
        <p
          aria-busy="true"
          className="flex items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 text-neutral-400"
        >
          <RefreshCw size={16} className="animate-spin" aria-hidden="true" />
          Loading conversion detail…
        </p>
      ) : operations.detailState === "error" || !request ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-200"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <p className="text-sm">{operations.detailError}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/admin/operations/wallet-conversions")}
            className="mt-3 inline-flex items-center gap-2 text-sm underline"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back to queue
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => navigate("/admin/operations/wallet-conversions")}
            className="inline-flex items-center gap-2 text-sm text-sky-300 hover:underline"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back to queue
          </button>

          {operations.actionError && (
            <div
              role="alert"
              className="flex gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
            >
              <AlertCircle
                size={17}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <p>{operations.actionError}</p>
            </div>
          )}

          {/* REQUEST + CONVERSION */}
          <div className="grid gap-5 lg:grid-cols-2">
            <Section
              title="Request"
              action={<StatusBadge status={request.status} />}
            >
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Reference"
                  value={
                    <span className="font-mono text-xs">
                      {request.conversionReference}
                    </span>
                  }
                />
                <Field
                  label="Requested"
                  value={dateTime(request.requestedAt)}
                />
              </dl>
            </Section>

            <Section title="Conversion">
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <AmountBlock
                  label="From"
                  amount={request.sourceAmount}
                  currency={request.sourceCurrency}
                  tone="source"
                  format={fmt}
                />
                <ArrowRight
                  size={18}
                  className="mx-auto shrink-0 rotate-90 text-neutral-500 sm:rotate-0"
                  aria-hidden="true"
                />
                <AmountBlock
                  label="To"
                  amount={request.targetAmount}
                  currency={request.targetCurrency}
                  tone="target"
                  format={fmt}
                />
              </div>
              <p className="mt-3 text-xs text-neutral-500">
                Persisted request identity. Amounts are backend-bound values,
                not editable here.
              </p>
            </Section>
          </div>

          {/* FX SNAPSHOT */}
          <Section title="Authoritative conversion snapshot">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Snapshot reference"
                value={
                  <span className="font-mono text-xs">
                    {request.fxSnapshotReference}
                  </span>
                }
              />
              <Field label="FX provider" value={request.fxProvider} />
              <Field
                label="Rate"
                value={
                  <span className="tabular-nums">
                    1 {request.sourceCurrency} = {request.rate}{" "}
                    {request.targetCurrency}
                  </span>
                }
              />
              <Field label="Effective date" value={request.fxEffectiveDate} />
            </dl>
            <p className="mt-4 border-t border-neutral-800 pt-3 text-xs leading-relaxed text-neutral-500">
              This is the persisted backend snapshot bound to the request — not
              a live or recalculated rate.
            </p>
          </Section>

          {/* DECISION + PROVIDER */}
          <div className="grid gap-5 lg:grid-cols-2">
            <Section title="Decision">
              {request.status === "PENDING" ? (
                <div className="space-y-3">
                  <p className="text-sm text-neutral-400">
                    Approval validates the persisted snapshot and source funds
                    again. It does not execute the provider.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={operations.actionPending}
                      onClick={() =>
                        void confirmAndRun(
                          "Approve this conversion request? Provider execution and accounting remain separate.",
                          () => operations.decide("APPROVE"),
                        )
                      }
                      className={primaryBtn}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={operations.actionPending}
                      onClick={() => setRejecting((value) => !value)}
                      className={outlineDangerBtn}
                    >
                      Reject
                    </button>
                  </div>
                  {rejecting && (
                    <div className="space-y-3 rounded-xl border border-neutral-700 bg-neutral-950/60 p-4">
                      <label className={labelCls}>
                        Rejection code
                        <select
                          value={rejectionCode}
                          onChange={(event) =>
                            setRejectionCode(
                              event.target
                                .value as WalletConversionRejectionCode,
                            )
                          }
                          className={inputCls}
                        >
                          {rejectionCodes.map((code) => (
                            <option key={code} value={code}>
                              {code}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className={labelCls}>
                        Reason (optional)
                        <textarea
                          value={rejectionReason}
                          maxLength={500}
                          onChange={(event) =>
                            setRejectionReason(event.target.value)
                          }
                          className={inputCls}
                        />
                      </label>
                      <button
                        type="button"
                        disabled={operations.actionPending}
                        onClick={() =>
                          void confirmAndRun(
                            "Reject this conversion request? This cannot be reversed from this console.",
                            () =>
                              operations.decide(
                                "REJECT",
                                rejectionCode,
                                rejectionReason.trim() || undefined,
                              ),
                          )
                        }
                        className={dangerBtn}
                      >
                        Confirm rejection
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Decision" value={request.decision ?? "—"} />
                  <Field
                    label="Decided at"
                    value={dateTime(request.decidedAt)}
                  />
                  {request.rejectionCode && (
                    <Field
                      label="Rejection code"
                      value={request.rejectionCode}
                    />
                  )}
                  {request.rejectionReason && (
                    <Field label="Reason" value={request.rejectionReason} />
                  )}
                </dl>
              )}
            </Section>

            <Section
              title="Provider execution"
              action={<ProviderBadge status={request.providerStatus} />}
            >
              {request.status === "APPROVED" && !request.providerStatus ? (
                <div className="space-y-3">
                  <p className="text-sm text-neutral-400">
                    Internal Provider simulation. Select only an outcome; React
                    creates no provider identity or money movement.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={operations.actionPending}
                      onClick={() =>
                        void confirmAndRun(
                          "Execute the Internal Provider with a successful outcome? Accounting will still be required.",
                          () => operations.executeProvider("SUCCESS"),
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-lg bg-sky-300 px-3.5 py-2 text-sm font-semibold text-black transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Execute success
                    </button>
                    <button
                      type="button"
                      disabled={operations.actionPending}
                      onClick={() =>
                        void confirmAndRun(
                          "Execute the Internal Provider with a failure outcome?",
                          () =>
                            operations.executeProvider(
                              "FAILURE",
                              failureCode.trim() || undefined,
                              failureReason.trim() || undefined,
                            ),
                        )
                      }
                      className={outlineDangerBtn}
                    >
                      Execute failure
                    </button>
                  </div>
                  <label className={labelCls}>
                    Failure code (optional, uppercase letters/numbers/underscore
                    only)
                    <input
                      value={failureCode}
                      maxLength={64}
                      onChange={(event) => setFailureCode(event.target.value)}
                      className={inputCls}
                    />
                  </label>
                  <label className={labelCls}>
                    Failure reason (optional)
                    <input
                      value={failureReason}
                      maxLength={500}
                      onChange={(event) => setFailureReason(event.target.value)}
                      className={inputCls}
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  {request.status === "APPROVED" &&
                    request.providerStatus === "SUCCEEDED" && (
                      <p className="flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-relaxed text-amber-200/90">
                        <AlertCircle
                          size={14}
                          className="mt-0.5 shrink-0"
                          aria-hidden="true"
                        />
                        Provider execution succeeded. Accounting is still
                        pending — the conversion is not completed yet.
                      </p>
                    )}
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field
                      label="Provider status"
                      value={<ProviderBadge status={request.providerStatus} />}
                    />
                    <Field
                      label="Outcome"
                      value={request.providerOutcome ?? "—"}
                    />
                    <Field
                      label="Completed"
                      value={dateTime(request.providerCompletedAt)}
                    />
                  </dl>
                </div>
              )}
            </Section>
          </div>

          {/* ACCOUNTING + RECONCILIATION */}
          <div className="grid gap-5 lg:grid-cols-2">
            <Section title="Accounting">
              {request.status === "APPROVED" &&
              (request.providerStatus === "SUCCEEDED" ||
                request.providerStatus === "FAILED") ? (
                <div className="space-y-3">
                  <p className="text-sm text-neutral-400">
                    {request.providerStatus === "SUCCEEDED"
                      ? "Provider succeeded. Accounting is pending; only backend accounting can mark the request completed."
                      : "Provider failed. Backend accounting finalizes the request as failed; it does not credit Wallets."}
                  </p>
                  <button
                    type="button"
                    disabled={operations.actionPending}
                    onClick={() =>
                      void confirmAndRun(
                        request.providerStatus === "SUCCEEDED"
                          ? "Complete backend accounting for this conversion?"
                          : "Finalize this provider failure through backend accounting?",
                        operations.completeAccounting,
                      )
                    }
                    className={
                      request.providerStatus === "SUCCEEDED"
                        ? finalBtn
                        : dangerBtn
                    }
                  >
                    {request.providerStatus === "SUCCEEDED"
                      ? "Complete accounting"
                      : "Finalize provider failure"}
                  </button>
                  <p className="text-xs text-neutral-500">
                    Finalizes the backend cross-currency Ledger and Wallet
                    accounting. React performs no accounting itself.
                  </p>
                </div>
              ) : (
                <p className="flex items-start gap-2 text-sm text-neutral-400">
                  {request.status === "COMPLETED" && (
                    <CheckCircle2
                      size={16}
                      className="mt-0.5 shrink-0 text-emerald-300"
                      aria-hidden="true"
                    />
                  )}
                  {request.status === "COMPLETED"
                    ? `Completed at ${dateTime(request.completedAt)}.`
                    : "No accounting action is currently eligible."}
                </p>
              )}
            </Section>

            <Section title="Operational reconciliation">
              <div className="space-y-3">
                <p className="text-sm text-neutral-400">
                  Inspection is backend-authoritative and separate from request,
                  provider, and accounting state.
                </p>
                <button
                  type="button"
                  disabled={operations.actionPending}
                  onClick={() => void operations.inspectReconciliation()}
                  className={ghostBtn}
                >
                  Inspect reconciliation
                </button>
                {operations.reconciliationError && (
                  <p className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                    <AlertCircle
                      size={14}
                      className="mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    {operations.reconciliationError}
                  </p>
                )}
                {operations.reconciliation && (
                  <div className="space-y-4 border-t border-neutral-800 pt-3">
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field
                        label="Reconciliation reference"
                        value={
                          <span className="font-mono text-xs">
                            {operations.reconciliation.reconciliationReference}
                          </span>
                        }
                      />
                      <Field
                        label="Classification"
                        value={operations.reconciliation.classification}
                      />
                      <Field
                        label="Severity"
                        value={operations.reconciliation.severity}
                      />
                      <Field
                        label="Issues"
                        value={
                          operations.reconciliation.issues.length
                            ? operations.reconciliation.issues.join(", ")
                            : "None"
                        }
                      />
                      <Field
                        label="Recovery performed"
                        value={`Retry: ${String(
                          operations.reconciliation.retryPerformed,
                        )} · Repair: ${String(
                          operations.reconciliation.repairPerformed,
                        )}`}
                      />
                    </dl>

                    {/* Bounded recovery — allowedActions is the sole authority */}
                    <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-200">
                        Bounded recovery
                      </h3>
                      {operations.reconciliation.allowedActions.length === 0 ? (
                        <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                          No bounded recovery action is currently permitted. The
                          inspection above reflects the backend-authoritative
                          state.
                        </p>
                      ) : (
                        <div className="mt-3 space-y-2.5">
                          {operations.reconciliation.allowedActions.includes(
                            "RETRY",
                          ) && (
                            <button
                              type="button"
                              disabled={operations.actionPending}
                              onClick={() =>
                                void confirmAndRun(
                                  "Retry accounting completion for this conversion? This replays only the backend-authorized recovery path and does not recreate money movement.",
                                  operations.retryReconciliation,
                                )
                              }
                              className={ghostBtn}
                            >
                              {operations.actionPending ? (
                                <RefreshCw
                                  size={14}
                                  className="animate-spin"
                                  aria-hidden="true"
                                />
                              ) : (
                                <RefreshCw size={14} aria-hidden="true" />
                              )}
                              Retry accounting completion
                            </button>
                          )}

                          {operations.reconciliation.allowedActions
                            .filter(isRepairAction)
                            .map((action) => {
                              const presentation = repairPresentation[action];
                              return (
                                <div
                                  key={action}
                                  className="rounded-lg border border-neutral-700/70 bg-neutral-900/40 p-3"
                                >
                                  <button
                                    type="button"
                                    disabled={operations.actionPending}
                                    onClick={() =>
                                      void confirmAndRun(
                                        `${presentation.label}? This bounded backend repair does not change balances, credit wallets, or recreate ledger entries.`,
                                        () =>
                                          operations.repairReconciliation(
                                            action,
                                          ),
                                      )
                                    }
                                    className="inline-flex items-center gap-2 rounded-lg border border-neutral-600 px-3 py-1.5 text-xs font-medium text-neutral-200 transition hover:bg-neutral-700/50 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {operations.actionPending ? (
                                      <RefreshCw
                                        size={12}
                                        className="animate-spin"
                                        aria-hidden="true"
                                      />
                                    ) : (
                                      <RefreshCw size={12} aria-hidden="true" />
                                    )}
                                    {presentation.label}
                                  </button>
                                  <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-500">
                                    {presentation.description}
                                  </p>
                                </div>
                              );
                            })}
                          <p className="text-[11px] leading-relaxed text-neutral-600">
                            Recovery controls are generated only from
                            backend-returned allowed actions and invoke the
                            verified backend recovery path. React performs no
                            financial mutation.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <p className="text-xs leading-relaxed text-neutral-500">
                  Inspection remains separate from recovery. The backend decides
                  what is wrong and what is safe; React only presents the
                  permitted actions.
                </p>
              </div>
            </Section>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
