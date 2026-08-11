import axios from "axios";
import { useState } from "react";

import AdminLayout from "../../components/admin/layout/AdminLayout";
import {
  completeAdminTopUpAccounting,
  decideAdminTopUp,
  finalizeAdminProviderFailure,
  getAdminTopUpRequest,
  inspectAdminTopUp,
  startAdminTopUpProcessing,
} from "./api";
import type {
  AdminTopUpRequestDto,
  ProviderFundingStatus,
  TopUpReconciliationDto,
  TopUpRejectionCode,
} from "./types";
import { useAdminTopUps } from "./useAdminTopUps";

function safeActionError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 403)
      return "You do not have access to perform this operation.";
    if (error.response?.status === 404)
      return "This top-up request no longer exists.";
    if (error.response?.status === 409)
      return "This request changed while you were working. It has been refreshed.";
    if (!error.response)
      return "We could not confirm this operation. Refresh before retrying.";
    const data = error.response.data;
    if (data && typeof data === "object" && "message" in data) {
      const message = String(data.message);
      if (
        message.includes("conflict") ||
        message.includes("not eligible") ||
        message.includes("not ready")
      ) {
        return "This request changed while you were working. It has been refreshed.";
      }
    }
  }
  return "The operation could not be completed. The authoritative state has been refreshed.";
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Pending decision",
    APPROVED: "Approved — awaiting provider processing",
    REJECTED: "Rejected",
    PROCESSING: "Processing",
    COMPLETED: "Completed — accounting credited Wallet",
    FAILED: "Failed",
  };
  return labels[status] ?? status;
}

function formatMinor(amount: number, currency: string): string {
  return `${amount.toLocaleString()} ${currency}`;
}

function formatMinorFull(amount: number, currency: string): string {
  return `${amount.toLocaleString()} minor units (${currency})`;
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

// ---------------------------------------------------------------------------
// Status badges — restrained, semantic, non-destructive visual language.
// ---------------------------------------------------------------------------

const requestStatusBadgeStyles: Record<string, string> = {
  PENDING: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  APPROVED: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  PROCESSING: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  COMPLETED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  REJECTED: "border-red-500/30 bg-red-500/10 text-red-300",
  FAILED: "border-red-500/40 bg-red-500/10 text-red-300",
};

const providerStatusBadgeStyles: Record<ProviderFundingStatus, string> = {
  CREATED: "border-neutral-600 bg-neutral-800/60 text-neutral-300",
  PROCESSING: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  SUCCEEDED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  FAILED: "border-red-500/40 bg-red-500/10 text-red-300",
};

function StatusBadge({ tone, label }: { tone: string; label: string }) {
  return (
    <span
      className={`inline-flex select-none items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${tone}`}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-80"
        aria-hidden="true"
      />
      {label.replace(/_/g, " ")}
    </span>
  );
}

function RequestStatusBadge({ status }: { status: string }) {
  return (
    <StatusBadge
      tone={
        requestStatusBadgeStyles[status] ??
        "border-neutral-600 bg-neutral-800/60 text-neutral-300"
      }
      label={status}
    />
  );
}

function ProviderStatusBadge({ status }: { status: ProviderFundingStatus }) {
  return (
    <StatusBadge tone={providerStatusBadgeStyles[status]} label={status} />
  );
}

// ---------------------------------------------------------------------------
// Small presentational helpers.
// ---------------------------------------------------------------------------

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-neutral-200">{children}</dd>
    </div>
  );
}

function DetailCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-neutral-800/80 bg-neutral-950/40 p-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
        {title}
      </h3>
      {subtitle && (
        <p className="mt-1 text-xs leading-5 text-neutral-500">{subtitle}</p>
      )}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-200"
      aria-hidden="true"
    />
  );
}

const inputClass =
  "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50";

const primaryButtonClass = `${buttonBase} bg-emerald-500 text-emerald-950 hover:bg-emerald-400`;
const accountingButtonClass = `${buttonBase} bg-emerald-600 text-white hover:bg-emerald-500`;
const neutralButtonClass = `${buttonBase} border border-neutral-700 text-neutral-200 hover:border-neutral-500 hover:bg-neutral-800/60`;
const destructiveButtonClass = `${buttonBase} border border-red-500/40 text-red-300 hover:border-red-400/60 hover:bg-red-500/10`;
const simulateFailureButtonClass = `${buttonBase} border border-amber-500/40 text-amber-200 hover:border-amber-400/60 hover:bg-amber-500/10`;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminTopUpOperationsPage() {
  const queue = useAdminTopUps();
  const [selected, setSelected] = useState<AdminTopUpRequestDto | null>(null);
  const [reconciliation, setReconciliation] =
    useState<TopUpReconciliationDto | null>(null);
  const [detailLoading, setDetailLoading] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejectionCode, setRejectionCode] =
    useState<TopUpRejectionCode>("ADMIN_DECLINED");
  const [rejectionReason, setRejectionReason] = useState("");
  const [failureCode, setFailureCode] = useState<
    "SIMULATED_DECLINE" | "SIMULATED_PROVIDER_ERROR"
  >("SIMULATED_DECLINE");
  const [failureReason, setFailureReason] = useState("");

  async function refreshSelected(topUpReference: string) {
    const [request, inspection] = await Promise.all([
      getAdminTopUpRequest(topUpReference),
      inspectAdminTopUp(topUpReference),
    ]);
    setSelected(request);
    setReconciliation(inspection);
    queue.refresh();
  }

  async function selectRequest(topUpReference: string) {
    setActionError(null);
    setDetailLoading(topUpReference);
    try {
      await refreshSelected(topUpReference);
    } catch (error) {
      setActionError(safeActionError(error));
    } finally {
      setDetailLoading(null);
    }
  }

  async function runAction(
    name: string,
    operation: (topUpReference: string) => Promise<unknown>,
  ) {
    if (!selected) return;
    const reference = selected.topUpReference;
    setActionError(null);
    setActionLoading(name);
    try {
      await operation(reference);
      await refreshSelected(reference);
    } catch (error) {
      setActionError(safeActionError(error));
      try {
        await refreshSelected(reference);
      } catch {
        // Preserve the bounded action error when a refresh is also unavailable.
      }
    } finally {
      setActionLoading(null);
    }
  }

  const providerStatus = reconciliation?.providerStatus;
  const canDecide = selected?.status === "PENDING";
  const canStart = selected?.status === "APPROVED";
  const canComplete =
    selected?.status === "PROCESSING" && providerStatus === "SUCCEEDED";
  const canFinalizeFailure =
    selected?.status === "PROCESSING" && providerStatus === "FAILED";
  const isTerminal =
    selected?.status === "REJECTED" ||
    selected?.status === "COMPLETED" ||
    selected?.status === "FAILED";

  return (
    <AdminLayout workspace="operations">
      <div className="space-y-6">
        {/* 1. Page header */}
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-800 pb-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Admin Operations · Funding
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-50">
              Wallet Top-Ups
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">
              The admin funding lifecycle queue. Approval, internal provider
              processing, and accounting are separate backend-controlled steps.
              A request only credits the Wallet once accounting completes.
            </p>
          </div>
          <button
            type="button"
            onClick={queue.refresh}
            className={`${neutralButtonClass} shrink-0`}
            disabled={queue.state === "loading"}
          >
            {queue.state === "loading" ? <Spinner /> : null}
            {queue.state === "loading" ? "Refreshing…" : "Refresh queue"}
          </button>
        </header>

        {/* Lifecycle explainer — reinforces that provider success != wallet credited */}
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-lg border border-neutral-800/70 bg-neutral-900/30 px-4 py-3 text-[11px] text-neutral-500">
          {[
            { label: "Pending", final: false },
            { label: "Approved", final: false },
            { label: "Provider processing", final: false },
            { label: "Provider succeeded", final: false },
            { label: "Accounting completed", final: false },
            { label: "Wallet credited", final: true },
          ].map((step, index, steps) => (
            <li key={step.label} className="flex items-center gap-2">
              <span
                className={
                  step.final
                    ? "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-semibold uppercase tracking-wider text-emerald-300"
                    : "font-medium uppercase tracking-wider text-neutral-400"
                }
              >
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <span aria-hidden="true" className="text-neutral-600">
                  →
                </span>
              )}
            </li>
          ))}
        </ol>

        {/* 2. Pending queue */}
        <section className="rounded-xl border border-neutral-800 bg-neutral-900/40">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-200">
                Pending queue
              </h2>
              <p className="mt-0.5 text-xs text-neutral-500">
                Requests awaiting an approve / reject decision.
              </p>
            </div>
            {queue.state === "ready" && (
              <span className="rounded-full border border-neutral-700 px-2.5 py-0.5 text-xs font-medium text-neutral-400">
                {queue.requests.length}{" "}
                {queue.requests.length === 1 ? "request" : "requests"}
              </span>
            )}
          </div>

          <div className="p-4">
            {queue.state === "loading" && (
              <div className="flex items-center gap-3 rounded-lg border border-neutral-800/70 bg-neutral-950/40 px-4 py-6 text-sm text-neutral-400">
                <Spinner />
                Loading pending requests…
              </div>
            )}
            {queue.state === "error" && (
              <div
                role="alert"
                className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-4 text-sm text-red-300"
              >
                {queue.errorMessage}
              </div>
            )}
            {queue.state === "ready" && queue.requests.length === 0 && (
              <div className="rounded-lg border border-dashed border-neutral-700 px-4 py-10 text-center">
                <p className="text-sm font-medium text-neutral-300">
                  No pending requests
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  The funding queue is clear. New top-up requests will appear
                  here.
                </p>
              </div>
            )}
            {queue.state === "ready" && queue.requests.length > 0 && (
              <ul className="space-y-2">
                {queue.requests.map((request) => {
                  const isSelected =
                    selected?.topUpReference === request.topUpReference;
                  const isLoadingThis =
                    detailLoading === request.topUpReference;
                  return (
                    <li key={request.topUpReference}>
                      <div
                        className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-lg border p-4 transition-colors ${
                          isSelected
                            ? "border-emerald-500/40 bg-emerald-500/5"
                            : "border-neutral-800 bg-neutral-950/40 hover:border-neutral-600"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                            <p className="text-base font-semibold tabular-nums text-neutral-100">
                              {formatMinor(request.amount, request.currency)}
                            </p>
                            <RequestStatusBadge status={request.status} />
                          </div>
                          <p className="mt-1.5 break-all font-mono text-xs text-neutral-400">
                            {request.topUpReference}
                          </p>
                          <p className="mt-1 text-xs text-neutral-500">
                            Requested {formatDateTime(request.requestedAt)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            void selectRequest(request.topUpReference)
                          }
                          disabled={isLoadingThis}
                          className={`${isSelected ? primaryButtonClass : neutralButtonClass} shrink-0`}
                        >
                          {isLoadingThis ? (
                            <>
                              <Spinner /> Opening…
                            </>
                          ) : isSelected ? (
                            "Open"
                          ) : (
                            "Review"
                          )}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* 3. Request detail */}
        {selected && (
          <section className="rounded-xl border border-neutral-800 bg-neutral-900/40">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-800 px-5 py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-200">
                    Request detail
                  </h2>
                  <RequestStatusBadge status={selected.status} />
                </div>
                <p className="mt-1.5 break-all font-mono text-xs text-neutral-500">
                  {selected.topUpReference}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void selectRequest(selected.topUpReference)}
                disabled={detailLoading !== null}
                className={`${neutralButtonClass} shrink-0`}
              >
                {detailLoading !== null ? <Spinner /> : null}
                Refresh detail
              </button>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              {/* Status summary line */}
              <p className="text-sm leading-6 text-neutral-400">
                {statusLabel(selected.status)}
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <DetailCard title="Request">
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <DetailField label="Amount">
                      <span className="font-semibold tabular-nums text-neutral-100">
                        {formatMinorFull(selected.amount, selected.currency)}
                      </span>
                    </DetailField>
                    <DetailField label="Currency">
                      {selected.currency}
                    </DetailField>
                    <DetailField label="Requested">
                      {formatDateTime(selected.requestedAt)}
                    </DetailField>
                    {selected.decidedAt && (
                      <DetailField label="Decided">
                        {formatDateTime(selected.decidedAt)}
                      </DetailField>
                    )}
                    {selected.completedAt && (
                      <DetailField label="Completed">
                        {formatDateTime(selected.completedAt)}
                      </DetailField>
                    )}
                  </dl>
                </DetailCard>

                <DetailCard
                  title="Provider / Funding"
                  subtitle="Internal provider lifecycle. Provider success alone does not credit the Wallet."
                >
                  {providerStatus ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <ProviderStatusBadge status={providerStatus} />
                      {providerStatus === "SUCCEEDED" &&
                        selected.status === "PROCESSING" && (
                          <span className="text-xs text-amber-300/90">
                            Succeeded — accounting still pending. Wallet not yet
                            credited.
                          </span>
                        )}
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-500">
                      {selected.status === "PENDING" ||
                      selected.status === "APPROVED"
                        ? "Provider processing has not started."
                        : "No provider state recorded."}
                    </p>
                  )}
                </DetailCard>

                {(selected.rejectionCode || selected.rejectionReason) && (
                  <DetailCard title="Decision">
                    <dl className="grid gap-4">
                      {selected.rejectionCode && (
                        <DetailField label="Rejection code">
                          {selected.rejectionCode}
                        </DetailField>
                      )}
                      {selected.rejectionReason && (
                        <DetailField label="Rejection reason">
                          {selected.rejectionReason}
                        </DetailField>
                      )}
                    </dl>
                  </DetailCard>
                )}

                {selected.status === "COMPLETED" && (
                  <DetailCard
                    title="Accounting"
                    subtitle="Authoritative accounting completed."
                  >
                    <div className="flex items-center gap-3">
                      <StatusBadge
                        tone="border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        label="Credited"
                      />
                      <span className="text-xs text-neutral-400">
                        Wallet projection credited by accounting completion.
                      </span>
                    </div>
                  </DetailCard>
                )}
              </div>

              {actionError && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-300"
                >
                  {actionError}
                </p>
              )}

              {/* Actions */}
              {isTerminal ? (
                <div className="rounded-lg border border-neutral-800/70 bg-neutral-950/40 px-4 py-3">
                  <p className="text-xs text-neutral-500">
                    This request is in a terminal state. No further actions are
                    available.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 border-t border-neutral-800 pt-5">
                  <h3 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                    Lifecycle actions
                  </h3>

                  {canDecide && (
                    <div className="space-y-4 rounded-lg border border-neutral-800/70 bg-neutral-950/40 p-4">
                      <p className="text-xs leading-5 text-neutral-500">
                        Decision actions are available only while the request is
                        pending. Approving does not fund the Wallet — it only
                        authorizes provider processing.
                      </p>
                      <div>
                        <button
                          type="button"
                          disabled={actionLoading !== null}
                          onClick={() =>
                            void runAction("approve", (reference) =>
                              decideAdminTopUp(reference, {
                                decision: "APPROVE",
                              }),
                            )
                          }
                          className={primaryButtonClass}
                        >
                          {actionLoading === "approve" ? (
                            <>
                              <Spinner /> Approving…
                            </>
                          ) : (
                            "Approve request"
                          )}
                        </button>
                      </div>

                      <div className="border-t border-neutral-800 pt-4">
                        <p className="text-xs font-medium uppercase tracking-wider text-red-300/80">
                          Reject request
                        </p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          <label className="block">
                            <span className="mb-1 block text-[11px] font-medium text-neutral-500">
                              Rejection code
                            </span>
                            <select
                              value={rejectionCode}
                              onChange={(event) =>
                                setRejectionCode(
                                  event.target.value as TopUpRejectionCode,
                                )
                              }
                              disabled={actionLoading !== null}
                              className={inputClass}
                            >
                              <option value="ADMIN_DECLINED">
                                Admin declined
                              </option>
                              <option value="INVALID_REQUEST">
                                Invalid request
                              </option>
                              <option value="SIMULATION_REJECTED">
                                Simulation rejected
                              </option>
                              <option value="OTHER">Other</option>
                            </select>
                          </label>
                          <label className="block sm:col-span-2">
                            <span className="mb-1 block text-[11px] font-medium text-neutral-500">
                              Reason{" "}
                              <span className="text-neutral-600">
                                (optional)
                              </span>
                            </span>
                            <input
                              value={rejectionReason}
                              onChange={(event) =>
                                setRejectionReason(event.target.value)
                              }
                              disabled={actionLoading !== null}
                              maxLength={500}
                              placeholder="Optional rejection reason"
                              className={inputClass}
                            />
                          </label>
                        </div>
                        <div className="mt-3">
                          <button
                            type="button"
                            disabled={actionLoading !== null}
                            onClick={() =>
                              void runAction("reject", (reference) =>
                                decideAdminTopUp(reference, {
                                  decision: "REJECT",
                                  rejectionCode,
                                  ...(rejectionReason.trim()
                                    ? {
                                        rejectionReason: rejectionReason.trim(),
                                      }
                                    : {}),
                                }),
                              )
                            }
                            className={destructiveButtonClass}
                          >
                            {actionLoading === "reject" ? (
                              <>
                                <Spinner /> Rejecting…
                              </>
                            ) : (
                              "Reject request"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {canStart && (
                    <div className="space-y-4 rounded-lg border border-neutral-800/70 bg-neutral-950/40 p-4">
                      <p className="text-xs leading-5 text-neutral-500">
                        These are{" "}
                        <span className="font-semibold text-neutral-300">
                          Internal Provider
                        </span>{" "}
                        simulation controls. They record the backend-controlled
                        provider outcome for this demo lifecycle — they are not
                        real external-bank actions and do not credit the Wallet.
                      </p>
                      <div>
                        <button
                          type="button"
                          disabled={actionLoading !== null}
                          onClick={() =>
                            void runAction("provider-success", (reference) =>
                              startAdminTopUpProcessing(reference, {
                                outcome: "SUCCESS",
                              }),
                            )
                          }
                          className={`${buttonBase} bg-sky-500 text-sky-950 hover:bg-sky-400`}
                        >
                          {actionLoading === "provider-success" ? (
                            <>
                              <Spinner /> Simulating…
                            </>
                          ) : (
                            "Simulate provider success"
                          )}
                        </button>
                      </div>

                      <div className="border-t border-neutral-800 pt-4">
                        <p className="text-xs font-medium uppercase tracking-wider text-amber-300/80">
                          Simulate provider failure
                        </p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          <label className="block">
                            <span className="mb-1 block text-[11px] font-medium text-neutral-500">
                              Failure code
                            </span>
                            <select
                              value={failureCode}
                              onChange={(event) =>
                                setFailureCode(
                                  event.target.value as
                                    | "SIMULATED_DECLINE"
                                    | "SIMULATED_PROVIDER_ERROR",
                                )
                              }
                              disabled={actionLoading !== null}
                              className={inputClass}
                            >
                              <option value="SIMULATED_DECLINE">
                                Simulated decline
                              </option>
                              <option value="SIMULATED_PROVIDER_ERROR">
                                Simulated provider error
                              </option>
                            </select>
                          </label>
                          <label className="block sm:col-span-2">
                            <span className="mb-1 block text-[11px] font-medium text-neutral-500">
                              Failure reason{" "}
                              <span className="text-neutral-600">
                                (optional)
                              </span>
                            </span>
                            <input
                              value={failureReason}
                              onChange={(event) =>
                                setFailureReason(event.target.value)
                              }
                              disabled={actionLoading !== null}
                              maxLength={500}
                              placeholder="Optional failure reason"
                              className={inputClass}
                            />
                          </label>
                        </div>
                        <div className="mt-3">
                          <button
                            type="button"
                            disabled={actionLoading !== null}
                            onClick={() =>
                              void runAction("provider-failure", (reference) =>
                                startAdminTopUpProcessing(reference, {
                                  outcome: "FAILURE",
                                  failureCode,
                                  ...(failureReason.trim()
                                    ? { failureReason: failureReason.trim() }
                                    : {}),
                                }),
                              )
                            }
                            className={simulateFailureButtonClass}
                          >
                            {actionLoading === "provider-failure" ? (
                              <>
                                <Spinner /> Simulating…
                              </>
                            ) : (
                              "Simulate provider failure"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {canComplete && (
                    <div className="space-y-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                      <p className="text-xs leading-5 text-neutral-400">
                        Provider funding succeeded — but the Wallet is not yet
                        credited. Completing accounting is the final financial
                        step and the only step that authoritatively credits the
                        Wallet.
                      </p>
                      <button
                        type="button"
                        disabled={actionLoading !== null}
                        onClick={() =>
                          void runAction(
                            "complete-accounting",
                            completeAdminTopUpAccounting,
                          )
                        }
                        className={accountingButtonClass}
                      >
                        {actionLoading === "complete-accounting" ? (
                          <>
                            <Spinner /> Completing accounting…
                          </>
                        ) : (
                          "Complete accounting — credit Wallet"
                        )}
                      </button>
                    </div>
                  )}

                  {canFinalizeFailure && (
                    <div className="space-y-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                      <p className="text-xs leading-5 text-neutral-400">
                        Provider funding failed. Finalization records the
                        authoritative failed request; it does not change Wallet
                        balances.
                      </p>
                      <button
                        type="button"
                        disabled={actionLoading !== null}
                        onClick={() =>
                          void runAction(
                            "finalize-failure",
                            finalizeAdminProviderFailure,
                          )
                        }
                        className={destructiveButtonClass}
                      >
                        {actionLoading === "finalize-failure" ? (
                          <>
                            <Spinner /> Finalizing…
                          </>
                        ) : (
                          "Finalize provider failure"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </AdminLayout>
  );
}
