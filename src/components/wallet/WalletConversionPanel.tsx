import {
  AlertCircle,
  ArrowDown,
  ArrowRightLeft,
  CheckCircle2,
  ChevronDown,
  Clock3,
  History,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import { getCurrentFxSnapshot } from "../../features/walletConversion/api";
import {
  formatMinorAmount,
  parseMajorAmount,
} from "../../features/walletConversion/money";
import { useWalletConversions } from "../../features/walletConversion/useWalletConversions";
import type {
  FxRateSnapshotDto,
  WalletConversionRequestDto,
  WalletConversionStatus,
} from "../../features/walletConversion/types";
import type { UseWalletsResult } from "../../features/wallet/useWallets";

interface WalletConversionPanelProps {
  wallet: UseWalletsResult;
}

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50";

const labelClass = "text-xs font-medium uppercase tracking-wide text-white/50";

function statusLabel(status: WalletConversionStatus): string {
  const labels: Record<WalletConversionStatus, string> = {
    PENDING: "Awaiting admin review",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    COMPLETED: "Completed",
    FAILED: "Failed",
  };
  return labels[status];
}

function StatusBadge({ status }: { status: WalletConversionStatus }) {
  const styles: Record<
    WalletConversionStatus,
    { className: string; Icon: typeof Clock3 }
  > = {
    PENDING: {
      className: "border-amber-400/40 bg-amber-400/10 text-amber-300",
      Icon: Clock3,
    },
    APPROVED: {
      className: "border-sky-400/40 bg-sky-400/10 text-sky-300",
      Icon: CheckCircle2,
    },
    REJECTED: {
      className: "border-red-400/40 bg-red-400/10 text-red-300",
      Icon: XCircle,
    },
    COMPLETED: {
      className: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
      Icon: CheckCircle2,
    },
    FAILED: {
      className: "border-red-400/40 bg-red-400/10 text-red-300",
      Icon: XCircle,
    },
  };
  const { className, Icon } = styles[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {statusLabel(status)}
    </span>
  );
}

function providerDescription(
  request: WalletConversionRequestDto,
): string | null {
  if (request.status === "PENDING")
    return "No funds have moved while this request awaits review.";
  if (request.status === "APPROVED" && request.providerStatus === "PROCESSING")
    return "Provider execution is in progress; accounting has not completed.";
  if (request.status === "APPROVED" && request.providerStatus === "SUCCEEDED")
    return "Provider execution succeeded; backend accounting is still pending.";
  if (request.status === "APPROVED")
    return "Approved; provider execution and accounting have not completed.";
  if (request.status === "COMPLETED")
    return "Completed by backend accounting. Wallet balances have been refreshed.";
  if (request.status === "FAILED")
    return "The conversion did not complete; no optimistic balance change was applied.";
  return null;
}

export default function WalletConversionPanel({
  wallet,
}: WalletConversionPanelProps) {
  const conversions = useWalletConversions(() => {
    void wallet.refresh();
  });
  const metadata = useMemo(
    () =>
      new Map(wallet.currencies.map((currency) => [currency.code, currency])),
    [wallet.currencies],
  );
  const sourceOptions = useMemo(
    () =>
      wallet.wallets.filter(
        (bucket) => metadata.get(bucket.currency)?.walletEnabled,
      ),
    [metadata, wallet.wallets],
  );

  const [sourceChoice, setSourceChoice] = useState("");
  const [targetChoice, setTargetChoice] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<FxRateSnapshotDto | null>(null);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  const sourceCurrency = sourceChoice || sourceOptions[0]?.currency || "";
  const targetOptions = useMemo(
    () =>
      wallet.currencies.filter(
        (currency) =>
          currency.walletEnabled && currency.code !== sourceCurrency,
      ),
    [sourceCurrency, wallet.currencies],
  );
  const targetCurrency =
    targetChoice &&
    targetOptions.some((currency) => currency.code === targetChoice)
      ? targetChoice
      : targetOptions[0]?.code || "";
  const sourceMeta = metadata.get(sourceCurrency);
  const targetMeta = metadata.get(targetCurrency);
  const submitting = conversions.submitState === "submitting";
  const sourceBucket = sourceOptions.find(
    (bucket) => bucket.currency === sourceCurrency,
  );

  useEffect(() => {
    let cancelled = false;
    if (!sourceCurrency || !targetCurrency || sourceCurrency === targetCurrency)
      return undefined;

    void (async () => {
      // Defer the reset until after the effect commits; this prevents a
      // synchronous state cascade while retaining stale-request protection.
      await Promise.resolve();
      if (cancelled) return;
      setSnapshot(null);
      setSnapshotError(null);
      setSnapshotLoading(true);
      try {
        const result = await getCurrentFxSnapshot(
          sourceCurrency,
          targetCurrency,
        );
        if (!cancelled) setSnapshot(result);
      } catch {
        if (!cancelled) {
          setSnapshotError(
            "A current backend FX snapshot is unavailable for this pair.",
          );
        }
      } finally {
        if (!cancelled) setSnapshotLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sourceCurrency, targetCurrency]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (
      !sourceMeta ||
      !targetMeta ||
      !snapshot ||
      snapshot.isStale ||
      !snapshot.isCurrent
    ) {
      setFormError("Choose a pair with a current backend FX snapshot.");
      return;
    }
    const parsed = parseMajorAmount(amountInput, sourceMeta.minorUnits);
    if (parsed.error || parsed.amount === undefined) {
      setFormError(parsed.error ?? "Enter a valid amount.");
      return;
    }
    await conversions.submit({
      sourceCurrency: sourceMeta.code,
      targetCurrency: targetMeta.code,
      sourceAmount: parsed.amount,
    });
  }

  function resetForm() {
    conversions.resetSubmission();
    setAmountInput("");
    setFormError(null);
  }

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------- */}
      {/* 1. Conversion form                                          */}
      {/* ---------------------------------------------------------- */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300">
            <ArrowRightLeft aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold text-white">Convert money</h2>
            <p className="mt-0.5 text-sm text-white/60">
              Convert between your wallet currencies using the current backend
              FX rate. The final converted amount is confirmed when the request
              is created.
            </p>
          </div>
        </div>

        {wallet.state === "loading" ? (
          <div className="mt-6 space-y-3" aria-busy="true">
            <div className="h-24 animate-pulse rounded-xl border border-white/10 bg-white/[0.04]" />
            <div className="h-14 animate-pulse rounded-xl border border-white/10 bg-white/[0.04]" />
          </div>
        ) : sourceOptions.length === 0 || targetOptions.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-white/60">
            No wallet-backed currencies are currently eligible for conversion.
          </p>
        ) : conversions.submitState === "success" && conversions.lastCreated ? (
          <div className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-sm text-emerald-100">
            <p className="font-semibold text-emerald-200">
              Conversion request submitted
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-semibold">
                {formatMinorAmount(
                  conversions.lastCreated.sourceAmount,
                  conversions.lastCreated.sourceCurrency,
                  metadata.get(conversions.lastCreated.sourceCurrency),
                )}{" "}
                {conversions.lastCreated.sourceCurrency}
              </span>
              <ArrowRightLeft
                aria-hidden="true"
                className="h-3.5 w-3.5 text-emerald-200/70"
              />
              <span className="font-semibold">
                {formatMinorAmount(
                  conversions.lastCreated.targetAmount,
                  conversions.lastCreated.targetCurrency,
                  metadata.get(conversions.lastCreated.targetCurrency),
                )}{" "}
                {conversions.lastCreated.targetCurrency}
              </span>
            </p>
            <p className="mt-2 break-all text-xs text-emerald-100/70">
              Reference: {conversions.lastCreated.conversionReference}
            </p>
            <p className="mt-1 text-xs text-emerald-100/70">
              The shown target amount is the backend-snapshotted result. Wallet
              balances have not changed yet.
            </p>
            <button
              type="button"
              onClick={resetForm}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3.5 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10"
            >
              Make another request
            </button>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-end">
              {/* FROM */}
              <label className="block">
                <span className={labelClass}>From · source wallet</span>
                <div className="relative mt-1.5">
                  <select
                    value={sourceCurrency}
                    disabled={submitting}
                    onChange={(event) => {
                      setSourceChoice(event.target.value);
                      conversions.resetSubmission();
                    }}
                    className={`${fieldClass} appearance-none pr-9`}
                  >
                    {sourceOptions.map((bucket) => (
                      <option key={bucket.currency} value={bucket.currency}>
                        {bucket.currency} —{" "}
                        {bucket.meta?.displayName ?? bucket.currency}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    aria-hidden="true"
                    className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
                  />
                </div>
                {sourceBucket && (
                  <p className="mt-1.5 text-xs text-white/45">
                    Available{" "}
                    {wallet.format(
                      sourceBucket.available,
                      sourceBucket.currency,
                    )}
                  </p>
                )}
              </label>

              {/* Direction indicator */}
              <div className="hidden justify-center md:flex md:pb-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-400/20 bg-sky-400/5 text-sky-300">
                  <ArrowRightLeft aria-hidden="true" className="h-4 w-4" />
                </span>
              </div>
              <div className="flex justify-center md:hidden" aria-hidden="true">
                <span className="flex h-8 w-8 rotate-90 items-center justify-center rounded-full border border-sky-400/20 bg-sky-400/5 text-sky-300">
                  <ArrowRightLeft aria-hidden="true" className="h-3.5 w-3.5" />
                </span>
              </div>

              {/* TO */}
              <label className="block">
                <span className={labelClass}>To · target currency</span>
                <div className="relative mt-1.5">
                  <select
                    value={targetCurrency}
                    disabled={submitting}
                    onChange={(event) => {
                      setTargetChoice(event.target.value);
                      conversions.resetSubmission();
                    }}
                    className={`${fieldClass} appearance-none border-sky-400/20 pr-9`}
                  >
                    {targetOptions.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} — {currency.displayName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    aria-hidden="true"
                    className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
                  />
                </div>
                <p className="mt-1.5 text-xs text-white/45">
                  {targetMeta
                    ? `You'll receive the converted amount in ${targetMeta.displayName}.`
                    : "Choose the destination currency."}
                </p>
              </label>
            </div>

            {/* AMOUNT — primary input */}
            <label className="block">
              <span className={labelClass}>Amount to convert</span>
              <div className="relative mt-1.5">
                <input
                  inputMode="decimal"
                  value={amountInput}
                  disabled={submitting}
                  onChange={(event) => setAmountInput(event.target.value)}
                  placeholder={sourceMeta?.minorUnits === 0 ? "10" : "10.00"}
                  className={`${fieldClass} py-3.5 pr-16 text-base tabular-nums`}
                />
                {sourceCurrency && (
                  <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm font-semibold text-white/50">
                    {sourceCurrency}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-xs text-white/45">
                Enter the amount in {sourceCurrency || "the source currency"}{" "}
                you want to convert.
              </p>
            </label>

            {/* FX snapshot */}
            <div>
              {snapshotLoading && (
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/50">
                  <Loader2
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin"
                  />
                  Fetching the current backend FX rate…
                </div>
              )}
              {snapshot && (
                <div className="rounded-xl border border-sky-400/20 bg-sky-400/5 px-4 py-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-200/70">
                    Current rate
                  </p>
                  <p className="mt-1 text-base font-semibold text-sky-100">
                    1 {snapshot.baseCurrency} ≈ {snapshot.rate}{" "}
                    {snapshot.quoteCurrency}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-sky-100/70">
                    This rate is indicative. The backend binds the authoritative
                    snapshot and calculates the final target amount when the
                    request is created.
                  </p>
                </div>
              )}
              {snapshotError && (
                <div
                  role="alert"
                  className="flex gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300"
                >
                  <AlertCircle
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0"
                  />
                  <p>{snapshotError}</p>
                </div>
              )}
            </div>

            {formError && (
              <div
                role="alert"
                className="flex gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300"
              >
                <AlertCircle
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0"
                />
                <p>{formError}</p>
              </div>
            )}
            {conversions.submitError && (
              <div
                role="alert"
                className="flex gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300"
              >
                <AlertCircle
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0"
                />
                <p>{conversions.submitError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || snapshotLoading || !snapshot}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {submitting && (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              )}
              {submitting ? "Submitting…" : "Request conversion"}
            </button>
          </form>
        )}
      </section>

      {/* ---------------------------------------------------------- */}
      {/* 2. Conversion history                                       */}
      {/* ---------------------------------------------------------- */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300">
              <History aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold text-white">Conversion requests</h2>
              <p className="mt-0.5 text-sm text-white/60">
                Backend-authoritative request, provider, and accounting
                lifecycle.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void conversions.refresh()}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10"
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {conversions.listLoading ? (
          <div className="mt-5 space-y-3" aria-busy="true">
            {[0, 1].map((item) => (
              <div
                key={item}
                className="h-20 animate-pulse rounded-xl border border-white/10 bg-white/[0.04]"
              />
            ))}
          </div>
        ) : conversions.listError && conversions.conversions.length === 0 ? (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300"
          >
            {conversions.listError}
          </p>
        ) : conversions.conversions.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-white/15 p-8 text-center">
            <p className="text-sm font-medium text-white/80">
              No conversion requests yet
            </p>
            <p className="mt-1 text-xs text-white/50">
              Conversion requests you submit will appear here.
            </p>
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {conversions.conversions.map((request) => (
              <li
                key={request.conversionReference}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold tabular-nums text-white">
                        {formatMinorAmount(
                          request.sourceAmount,
                          request.sourceCurrency,
                          metadata.get(request.sourceCurrency),
                        )}{" "}
                        <span className="text-white/50">
                          {request.sourceCurrency}
                        </span>
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/50">
                        <ArrowDown
                          aria-hidden="true"
                          className="h-3 w-3 text-sky-300"
                        />
                        {formatMinorAmount(
                          request.targetAmount,
                          request.targetCurrency,
                          metadata.get(request.targetCurrency),
                        )}{" "}
                        <span>{request.targetCurrency}</span>
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={request.status} />
                </div>

                <p className="mt-3 break-all font-mono text-xs text-white/45">
                  {request.conversionReference}
                </p>
                <p className="mt-1 text-xs text-white/45">
                  Requested {new Date(request.requestedAt).toLocaleString()} ·
                  Snapshot {request.fxSnapshotReference}
                </p>

                {providerDescription(request) && (
                  <p className="mt-2 text-xs leading-5 text-white/60">
                    {providerDescription(request)}
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
