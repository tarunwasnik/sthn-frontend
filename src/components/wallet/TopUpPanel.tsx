// frontend/src/components/wallet/TopUpPanel.tsx
//
// Shared User-owned Wallet Top-Up panel (User + Creator identical).
// Creates REAL WalletTopUpRequest via backend; observes lifecycle via backend.
// Never mutates wallet balance locally; refetches balances only on COMPLETED.
// Visual language matches the STHN dashboard design system (glass cards,
// emerald-400 accent). No mock data, no external payment gateway.

import {
  AlertCircle,
  ArrowDownToLine,
  CheckCircle2,
  ChevronDown,
  Clock3,
  History,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import type { UseWalletsResult } from "../../features/wallet/useWallets";
import type { TopUpStatus } from "../../features/topUp/types";
import useTopUps from "../../features/topUp/useTopUps";
import { formatMinorAmount } from "../../features/walletConversion/money";

interface TopUpPanelProps {
  wallet: UseWalletsResult;
}

interface ParsedAmount {
  amount?: number;
  error?: string;
}

/**
 * Deterministic major-string -> minor-integer parser keyed on currency
 * minorUnits. No floating-point arithmetic (no parseFloat * 100).
 * Rejects: empty / negative / malformed / excess fractional digits / non-integer.
 */
function parseMajorAmount(value: string, minorUnits: number): ParsedAmount {
  const trimmed = value.trim();
  if (!trimmed) return { error: "Enter an amount." };
  const match = /^(\d+)(?:\.(\d*))?$/.exec(trimmed);
  if (!match) return { error: "Enter a positive amount using digits only." };

  const whole = match[1];
  const fraction = match[2] ?? "";
  if (fraction.length > minorUnits) {
    return {
      error:
        minorUnits === 0
          ? "This currency does not support decimal amounts."
          : `Use no more than ${minorUnits} decimal place${minorUnits === 1 ? "" : "s"}.`,
    };
  }

  const combined = `${whole}${fraction.padEnd(minorUnits, "0")}`.replace(
    /^0+(?=\d)/,
    "",
  );
  const amount = Number(combined);
  if (!Number.isSafeInteger(amount)) {
    return { error: "Enter a valid amount." };
  }
  if (amount < 1) return { error: "Enter an amount greater than zero." };
  return { amount };
}

function statusLabel(status: TopUpStatus): string {
  const labels: Record<TopUpStatus, string> = {
    PENDING: "Awaiting admin review",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    PROCESSING: "Processing",
    COMPLETED: "Completed",
    FAILED: "Failed",
  };
  return labels[status];
}

function StatusBadge({ status }: { status: TopUpStatus }) {
  const meta: Record<TopUpStatus, { badge: string; Icon: typeof Clock3 }> = {
    COMPLETED: {
      badge: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
      Icon: CheckCircle2,
    },
    REJECTED: {
      badge: "border-red-400/40 bg-red-400/10 text-red-300",
      Icon: XCircle,
    },
    FAILED: {
      badge: "border-red-400/40 bg-red-400/10 text-red-300",
      Icon: XCircle,
    },
    PROCESSING: {
      badge: "border-sky-400/40 bg-sky-400/10 text-sky-300",
      Icon: Loader2,
    },
    APPROVED: {
      badge: "border-teal-400/40 bg-teal-400/10 text-teal-300",
      Icon: CheckCircle2,
    },
    PENDING: {
      badge: "border-amber-400/40 bg-amber-400/10 text-amber-300",
      Icon: Clock3,
    },
  };
  const { badge, Icon } = meta[status];
  const spin = status === "PROCESSING" ? " animate-spin" : "";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge}`}
    >
      <Icon aria-hidden="true" className={`h-3.5 w-3.5${spin}`} />
      {statusLabel(status)}
    </span>
  );
}

const fieldClass =
  "w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50";

export default function TopUpPanel({ wallet }: TopUpPanelProps) {
  // On COMPLETED, refetch authoritative wallet balances (never local increment).
  const topUps = useTopUps(() => {
    void wallet.refresh();
  });

  const eligibleCurrencies = useMemo(
    () => wallet.currencies.filter((c) => c.walletEnabled && c.topUpEnabled),
    [wallet.currencies],
  );
  const metadata = useMemo(
    () => new Map(wallet.currencies.map((c) => [c.code, c])),
    [wallet.currencies],
  );

  const [currencyChoice, setCurrencyChoice] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const currency = currencyChoice && metadata.has(currencyChoice)
    ? currencyChoice : "";

  const selectedCurrency = metadata.get(currency);
  const submitting = topUps.submitState === "submitting";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!selectedCurrency) {
      setFormError("Choose a currency that is enabled for top-up.");
      return;
    }
    const parsed = parseMajorAmount(amountInput, selectedCurrency.minorUnits);
    if (parsed.error || parsed.amount === undefined) {
      setFormError(parsed.error ?? "Enter a valid amount.");
      return;
    }
    await topUps.submit(parsed.amount, selectedCurrency.code);
  }

  function startNew() {
    topUps.resetSubmission();
    setAmountInput("");
    setFormError(null);
  }

  return (
    <div className="space-y-6">
      {/* Create top-up request */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <ArrowDownToLine aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-semibold text-white">Request a top-up</h2>
            <p className="mt-0.5 text-sm text-white/60">
              A request is reviewed by an administrator. Your balance changes
              only after the request completes.
            </p>
          </div>
        </div>

        {wallet.state === "loading" ? (
          <div
            className="mt-5 grid gap-4 sm:grid-cols-2"
            aria-busy="true"
            aria-label="Loading top-up currencies"
          >
            <span className="sr-only">
              Loading currencies available for top-up…
            </span>
            <div className="h-11 animate-pulse rounded-lg border border-white/10 bg-white/[0.04]" />
            <div className="h-11 animate-pulse rounded-lg border border-white/10 bg-white/[0.04]" />
          </div>
        ) : eligibleCurrencies.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-white/15 p-6 text-center">
            <ArrowDownToLine
              aria-hidden="true"
              className="mx-auto h-6 w-6 text-white/30"
            />
            <p className="mt-3 text-sm text-white/60">
              No currencies are currently enabled for top-up.
            </p>
          </div>
        ) : topUps.submitState === "success" && topUps.lastCreated ? (
          <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300"
              />
              <div className="min-w-0">
                <p className="font-semibold text-emerald-200">
                  Top-up request submitted
                </p>
                <p className="mt-1 text-sm text-emerald-100/90">
                  {formatMinorAmount(
                    topUps.lastCreated.amount,
                    topUps.lastCreated.currency,
                    metadata.get(topUps.lastCreated.currency),
                  )}{" "}
                  {topUps.lastCreated.currency} —{" "}
                  {statusLabel(topUps.lastCreated.status)}.
                </p>
                <p className="mt-2 break-all text-xs text-emerald-100/70">
                  Reference: {topUps.lastCreated.topUpReference}
                </p>
                <p className="mt-1 text-xs text-emerald-100/70">
                  Your wallet balance has not changed yet.
                </p>
                <button
                  type="button"
                  onClick={startNew}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                >
                  Make another request
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
            <label className="grid min-w-0 gap-1.5 text-sm text-white/80">
              <span className="text-xs font-medium uppercase tracking-wide text-white/50">
                Currency
              </span>
              <div className="relative">
                <select
                  value={currencyChoice}
                  onChange={(e) => {
                    setCurrencyChoice(e.target.value);
                    topUps.resetSubmission();
                  }}
                  disabled={submitting}
                  className={`${fieldClass} appearance-none pr-9`}
                >
                  <option value="" disabled>
                    Choose a currency
                  </option>
                  {eligibleCurrencies.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.code} — {item.displayName}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
                />
              </div>
            </label>
            <label className="grid min-w-0 gap-1.5 text-sm text-white/80">
              <span className="text-xs font-medium uppercase tracking-wide text-white/50">
                Amount
              </span>
              <div className="relative">
                {selectedCurrency?.symbol && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/40"
                  >
                    {selectedCurrency.symbol}
                  </span>
                )}
                <input
                  inputMode="decimal"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  disabled={submitting}
                  placeholder={
                    selectedCurrency?.minorUnits === 0 ? "10" : "10.00"
                  }
                  className={`${fieldClass} ${selectedCurrency?.symbol ? "pl-8" : ""}`}
                />
              </div>
            </label>
            <div className="sm:col-span-2">
              {formError && (
                <div
                  role="alert"
                  className="mb-3 flex items-start gap-2 text-sm text-red-300"
                >
                  <AlertCircle
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0"
                  />
                  <p>{formError}</p>
                </div>
              )}
              {topUps.submitError && (
                <div
                  role="alert"
                  className="mb-3 flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300"
                >
                  <AlertCircle
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0"
                  />
                  <p>{topUps.submitError}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {submitting && (
                  <Loader2
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin"
                  />
                )}
                {submitting ? "Submitting…" : "Request top-up"}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Top-up request history — authoritative backend lifecycle */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <History aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="font-semibold text-white">Top-up requests</h2>
              <p className="mt-0.5 text-sm text-white/60">
                A credit appears only once a request is completed by the
                backend.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void topUps.refresh()}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {topUps.listLoading ? (
          <div
            className="mt-4 space-y-3"
            aria-busy="true"
            aria-label="Loading top-up requests"
          >
            <span className="sr-only">Loading top-up requests…</span>
            {[0, 1].map((row) => (
              <div
                key={row}
                className="h-16 animate-pulse rounded-xl border border-white/10 bg-white/[0.04]"
              />
            ))}
          </div>
        ) : topUps.listError && topUps.requests.length === 0 ? (
          <div
            role="alert"
            className="mt-4 flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300"
          >
            <AlertCircle
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <p>{topUps.listError}</p>
          </div>
        ) : topUps.requests.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-white/15 p-6 text-center">
            <History
              aria-hidden="true"
              className="mx-auto h-6 w-6 text-white/30"
            />
            <p className="mt-3 text-sm font-medium text-white/70">
              No top-up requests yet
            </p>
            <p className="mt-1 text-sm text-white/50">
              Your submitted top-up requests will appear here.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {topUps.requests.map((request) => (
              <li
                key={request.topUpReference}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm transition hover:bg-white/[0.05]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-base font-semibold text-white">
                    {formatMinorAmount(
                      request.amount,
                      request.currency,
                      metadata.get(request.currency),
                    )}
                    <span className="ml-2 text-sm font-normal text-white/50">
                      {request.currency}
                    </span>
                  </span>
                  <StatusBadge status={request.status} />
                </div>
                <p className="mt-2 break-all text-xs text-white/50">
                  Reference: {request.topUpReference}
                </p>
                <p className="mt-1 text-xs text-white/50">
                  Requested {new Date(request.requestedAt).toLocaleString()}
                </p>
                {request.status === "APPROVED" && (
                  <p className="mt-2 text-xs text-white/50">
                    Approved — funding has not completed yet.
                  </p>
                )}
                {request.status === "REJECTED" && request.rejectionReason && (
                  <p className="mt-2 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-300">
                    {request.rejectionReason}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
