import { RefreshCw } from "lucide-react";
import { useState } from "react";
import AdminConfirmDialog from "../../components/admin/feedback/AdminConfirmDialog";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import AdminPageHeader from "../../components/admin/layout/AdminPageHeader";
import type { AdminFxSnapshotDto } from "./types";
import { useAdminFx } from "./useAdminFx";

function time(value?: string) { return value ? new Date(value).toLocaleString() : "—"; }

export default function AdminFxOperationsPage() {
  const fx = useAdminFx();
  const [pair, setPair] = useState<{ baseCurrency: string; quoteCurrency: string } | null>(null);
  const snapshots = fx.data?.snapshots ?? [];
  return <AdminLayout workspace="operations">
    <AdminConfirmDialog open={pair !== null} title="Refresh FX rate" confirmText="Refresh FX rate" loading={fx.refreshing}
      description={pair ? `Refresh the authoritative ${pair.baseCurrency} → ${pair.quoteCurrency} FX snapshot through the configured backend provider. This does not convert Wallets, change historical conversions, post Ledger entries, or recalculate prior snapshots.` : "Refresh the selected FX rate."}
      onConfirm={() => { if (pair) { const current = pair; setPair(null); void fx.refreshRate(current.baseCurrency, current.quoteCurrency); } }} onCancel={() => setPair(null)} />
    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">Admin operations · FX authority</p>
    <AdminPageHeader title="FX rates and snapshots" description="Directed backend FX snapshot authority. Rates are displayed exactly as returned; this workspace never calculates a rate or reverse pair.">
      <button type="button" onClick={fx.reload} className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 px-3.5 py-2 text-sm text-neutral-200 hover:bg-neutral-800"><RefreshCw size={15} />Refresh view</button>
    </AdminPageHeader>
    {fx.state === "loading" && <p className="rounded-xl border border-neutral-800 p-5 text-neutral-400">Loading FX authority…</p>}
    {fx.state === "error" && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">{fx.error}</p>}
    {fx.data && <section className="space-y-5">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5"><p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Provider authority</p><div className="mt-3 grid gap-4 sm:grid-cols-2"><div><p className="text-xs text-neutral-500">Provider</p><p className="mt-1 text-sm text-white">{fx.data.provider}</p></div><div><p className="text-xs text-neutral-500">Mode</p><p className="mt-1 text-sm text-white">{fx.data.providerMode}</p></div></div><p className="mt-4 text-sm text-neutral-400">Provider mode is backend/environment authority. INTERNAL is development-only and cannot be selected or changed here.</p></div>
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5"><h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">Permitted refresh pairs</h2>{fx.data.refreshPairs.length === 0 ? <p className="mt-3 text-sm text-neutral-400">The backend has not declared a bounded refresh pair for this provider.</p> : <div className="mt-3 flex flex-wrap gap-2">{fx.data.refreshPairs.map((item) => <button key={`${item.baseCurrency}:${item.quoteCurrency}`} type="button" disabled={fx.refreshing} onClick={() => setPair(item)} className="rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-100 hover:bg-neutral-800 disabled:opacity-50">Refresh {item.baseCurrency} → {item.quoteCurrency}</button>)}</div>}</div>
      <div className="space-y-3"><h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">Persisted active snapshots</h2>{snapshots.length === 0 ? <p className="rounded-xl border border-neutral-800 p-5 text-neutral-400">No active FX snapshot is currently persisted for the configured provider.</p> : snapshots.map((snapshot) => <SnapshotCard key={snapshot.snapshotReference} snapshot={snapshot} />)}</div>
    </section>}
  </AdminLayout>;
}

function SnapshotCard({ snapshot }: { snapshot: AdminFxSnapshotDto }) {
  return <article className="grid gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 md:grid-cols-3"><div><p className="text-xs text-neutral-500">Directed pair</p><p className="mt-1 font-semibold text-white">{snapshot.baseCurrency} → {snapshot.quoteCurrency}</p><p className="mt-1 text-xs text-neutral-400">{snapshot.snapshotReference}</p></div><div><p className="text-xs text-neutral-500">Authoritative rate</p><p className="mt-1 font-semibold text-white">{snapshot.rate}</p><p className="mt-1 text-xs text-neutral-400">Provider: {snapshot.provider}</p></div><div><p className="text-xs text-neutral-500">Freshness</p><p className="mt-1 text-sm text-white">Expires {time(snapshot.expiresAt)}</p><p className="mt-1 text-xs text-neutral-400">Fetched {time(snapshot.fetchedAt)} · {snapshot.isStale ? "Stale" : "Current"}</p></div></article>;
}
