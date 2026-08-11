// frontend/src/components/wallet/WalletView.tsx
//
// Presentational Wallet overview for BOTH User and Creator dashboards.
// Renders real backend wallet data. Contains NO financial authority and
// NO mock fallback — it only renders the DTO-based props it's given.
//
// Visual layer restyled to match the STHN dashboard design system:
// translucent glass cards (white/5 + white/10 border), emerald-400 accent,
// generous spacing. Behavior / data contract unchanged.

import {
  AlertCircle,
  Inbox,
  RefreshCw,
  Wallet as WalletIcon,
} from "lucide-react";

import type {
  UseWalletsResult,
  WalletViewBucket,
} from "../../features/wallet/useWallets";
import TopUpPanel from "./TopUpPanel";
import WalletConversionPanel from "./WalletConversionPanel";

interface WalletViewProps {
  /** e.g. "User Wallet" or "Creator Wallet" */
  badge: string;
  subtitle: string;
  /** Result from useWallets() — live backend wallet state. */
  wallet: UseWalletsResult;
}

function BucketCard({
  bucket,
  format,
}: {
  bucket: WalletViewBucket;
  format: UseWalletsResult["format"];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition hover:bg-white/[0.07]">
      {/* Card header: currency identity */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <WalletIcon size={18} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-white">
              {bucket.currency}
            </p>
            {bucket.meta?.displayName && (
              <p className="truncate text-xs text-white/50">
                {bucket.meta.displayName}
              </p>
            )}
          </div>
        </div>
        {bucket.meta?.symbol && (
          <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-sm text-white/70">
            {bucket.meta.symbol}
          </span>
        )}
      </div>

      {/* Balance rows */}
      <div className="space-y-2 text-sm">
        <Row
          label="Available"
          value={format(bucket.available, bucket.currency)}
        />
        <Row
          label="Reserved"
          value={format(bucket.reserved, bucket.currency)}
        />
        <Row label="Locked" value={format(bucket.locked, bucket.currency)} />
        <div className="mt-3 border-t border-white/10 pt-3">
          <Row
            label="Current balance"
            value={format(bucket.current, bucket.currency)}
            strong
          />
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-white/50">{label}</span>
      <span
        className={
          strong
            ? "font-semibold text-emerald-400"
            : "font-medium text-white/90"
        }
      >
        {value}
      </span>
    </div>
  );
}

export default function WalletView({
  badge,
  subtitle,
  wallet,
}: WalletViewProps) {
  const { state, wallets, errorMessage, refresh, format } = wallet;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 md:space-y-8">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            {badge}
          </p>
          <h1 className="mt-1.5 text-2xl font-bold text-white md:text-3xl">
            Wallet
          </h1>
          <p className="mt-2 text-sm text-white/60">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={refresh}
          aria-label="Refresh wallet balances"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          <RefreshCw size={16} aria-hidden="true" />
          Refresh
        </button>
      </header>

      {/* Loading state — never render ₹0 / $0 placeholders while loading */}
      {state === "loading" && (
        <div aria-busy="true" aria-live="polite">
          <p className="sr-only">Loading your wallet balances…</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-2xl border border-white/10 bg-white/5"
              />
            ))}
          </div>
        </div>
      )}

      {/* Error state — safe, bounded message + retry. No stack traces. */}
      {state === "error" && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-5 backdrop-blur-md"
        >
          <AlertCircle
            className="mt-0.5 shrink-0 text-red-400"
            size={20}
            aria-hidden="true"
          />
          <div>
            <p className="font-semibold text-red-300">Couldn't load wallet</p>
            <p className="mt-1 text-sm leading-relaxed text-white/70">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={refresh}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              <RefreshCw size={14} aria-hidden="true" />
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Loaded */}
      {state === "ready" && wallets.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {wallets.map((w) => (
            <BucketCard key={w.currency} bucket={w} format={format} />
          ))}
        </div>
      )}

      {/* Empty state — backend returned successfully but no wallets. No fake filling. */}
      {state === "ready" && wallets.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 px-6 py-14 text-center backdrop-blur-md">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/50">
            <Inbox size={24} aria-hidden="true" />
          </div>
          <p className="font-semibold text-white">No wallet balances yet</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/60">
            When you add funds or earn in a supported currency, your wallets
            will appear here.
          </p>
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/* Wallet actions — Top-Up + Conversion (shared User-owned)    */}
      {/* ---------------------------------------------------------- */}
      <section className="space-y-6 md:space-y-8">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">
            Fund & convert
          </h2>
          <div className="h-px flex-1 bg-white/10" aria-hidden="true" />
        </div>

        {/* Phase 2 — shared User-owned Top-Up experience (User + Creator). */}
        <TopUpPanel wallet={wallet} />

        {/* Phase 4 — shared User-owned conversion capability (User + Creator). */}
        <WalletConversionPanel wallet={wallet} />
      </section>
    </div>
  );
}
