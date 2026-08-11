import { AlertCircle, ArrowLeft, CheckCircle2, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminLayout from "../../components/admin/layout/AdminLayout";
import AdminPageHeader from "../../components/admin/layout/AdminPageHeader";
import { getSupportedCurrencies } from "../wallet/api";
import type { CurrencyMetadataDto } from "../wallet/types";
import { formatMinorAmount } from "../walletConversion/money";
import { useAdminEscrow } from "./useAdminEscrow";
import type { AdminEscrowDto, AdminEscrowState } from "./types";

const states: Array<{ value?: AdminEscrowState; label: string }> = [
  { label: "All" }, { value: "HELD", label: "Held" }, { value: "ELIGIBLE", label: "Eligible" },
  { value: "SETTLED", label: "Settled" }, { value: "BLOCKED", label: "Blocked" },
];

function dateTime(value?: string) { return value ? new Date(value).toLocaleString() : "—"; }
function StateBadge({ state }: { state: AdminEscrowState }) {
  const tone: Record<AdminEscrowState, string> = { HELD: "border-amber-400/30 bg-amber-400/10 text-amber-200", ELIGIBLE: "border-sky-400/30 bg-sky-400/10 text-sky-200", SETTLED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200", BLOCKED: "border-red-400/30 bg-red-400/10 text-red-200" };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${tone[state]}`}>{state}</span>;
}
function Field({ label, value }: { label: string; value: ReactNode }) { return <div><dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</dt><dd className="mt-1 break-words text-sm text-white">{value}</dd></div>; }

export default function AdminEscrowOperationsPage() {
  const navigate = useNavigate();
  const { bookingReference } = useParams<{ bookingReference: string }>();
  const escrow = useAdminEscrow(bookingReference);
  const [currencies, setCurrencies] = useState<CurrencyMetadataDto[]>([]);
  const [reason, setReason] = useState("");
  const metadata = useMemo(() => new Map(currencies.map((currency) => [currency.code, currency])), [currencies]);
  const format = (amount: number, currency: string) => formatMinorAmount(amount, currency, metadata.get(currency));

  useEffect(() => { void getSupportedCurrencies().then(setCurrencies).catch(() => setCurrencies([])); }, []);
  const record = escrow.detail;
  const release = async () => {
    if (!record || !window.confirm(
      `Release settlement early now?\n\nBooking: ${record.bookingReference}\nEscrow: ${format(record.capturedGrossAmount, record.currency)}\nCreator net: ${format(record.creatorNetAmount, record.currency)}\nNormal settlement: ${dateTime(record.settlementEligibleAt)}\n\nThis invokes the authoritative settlement lifecycle.`,
    )) return;
    await escrow.release(reason.trim() || undefined);
  };

  return <AdminLayout workspace="operations">
    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">Admin operations · escrow</p>
    <AdminPageHeader title={bookingReference ? "Booking escrow detail" : "Booking escrow"} description="Captured Wallet funds awaiting or completing authoritative settlement. Amounts and release eligibility are backend-provided.">
      <button type="button" onClick={escrow.refresh} className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 px-3.5 py-2 text-sm text-neutral-200 hover:bg-neutral-800"><RefreshCw size={15} />Refresh</button>
    </AdminPageHeader>
    {!bookingReference ? <section className="space-y-4">
      <div className="flex flex-wrap gap-2">{states.map((item) => <button key={item.label} type="button" onClick={() => escrow.setState(item.value)} className={`rounded-lg px-3 py-2 text-sm ${escrow.state === item.value ? "bg-white text-black" : "border border-neutral-700 text-neutral-200 hover:bg-neutral-800"}`}>{item.label}</button>)}</div>
      {escrow.queueState === "loading" && <p className="rounded-xl border border-neutral-800 p-5 text-neutral-400">Loading escrow records…</p>}
      {escrow.queueState === "error" && <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">{escrow.queueError}</p>}
      {escrow.queueState === "ready" && escrow.queue.length === 0 && <p className="rounded-xl border border-neutral-800 p-5 text-neutral-400">No escrow records match this view.</p>}
      {escrow.queueState === "ready" && escrow.queue.map((item) => <button key={item.bookingReference} type="button" onClick={() => navigate(`/admin/operations/booking-escrow/${encodeURIComponent(item.bookingReference)}`)} className="grid w-full gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 text-left transition hover:border-neutral-600 md:grid-cols-5">
        <div><p className="text-xs text-neutral-500">Booking</p><p className="mt-1 font-semibold text-white">{item.bookingReference}</p></div><div><p className="text-xs text-neutral-500">Gross escrow</p><p className="mt-1 font-semibold text-white">{format(item.capturedGrossAmount, item.currency)}</p></div><div><p className="text-xs text-neutral-500">Creator net</p><p className="mt-1 font-semibold text-white">{format(item.creatorNetAmount, item.currency)}</p></div><div><p className="text-xs text-neutral-500">Auto settlement</p><p className="mt-1 text-sm text-white">{dateTime(item.settlementEligibleAt)}</p></div><div className="md:text-right"><StateBadge state={item.escrowState} /><p className="mt-2 text-xs text-neutral-400">{item.manualReleaseAllowed ? "Manual release available" : item.manualReleaseBlockedReason ?? "No manual release"}</p></div>
      </button>)}</section> : <section className="space-y-5">
      <button type="button" onClick={() => navigate("/admin/operations/booking-escrow")} className="inline-flex items-center gap-2 text-sm text-neutral-300 hover:text-white"><ArrowLeft size={16} />Back to escrow</button>
      {escrow.detailState === "loading" && <p className="rounded-xl border border-neutral-800 p-5 text-neutral-400">Loading escrow detail…</p>}
      {escrow.detailState === "error" && <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">{escrow.detailError}</p>}
      {record && <EscrowDetail record={record} format={format} reason={reason} setReason={setReason} release={release} pending={escrow.actionPending} actionError={escrow.actionError} />}
    </section>}
  </AdminLayout>;
}

function EscrowDetail({ record, format, reason, setReason, release, pending, actionError }: { record: AdminEscrowDto; format: (amount: number, currency: string) => string; reason: string; setReason: (value: string) => void; release: () => Promise<void>; pending: boolean; actionError: string | null }) {
  return <><div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5"><div><p className="font-semibold text-white">{record.bookingReference}</p><p className="mt-1 text-sm text-neutral-400">Captured escrow in {record.currency}</p></div><StateBadge state={record.escrowState} /></div>
    <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5"><h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">Booking and escrow</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Payment reference" value={record.paymentReference ?? "—"} /><Field label="Payment status" value={record.paymentStatus ?? "—"} /><Field label="Captured" value={dateTime(record.capturedAt)} /><Field label="Automatic settlement eligible" value={dateTime(record.settlementEligibleAt)} /><Field label="Gross captured" value={format(record.capturedGrossAmount, record.currency)} /><Field label="Settlement" value={record.settlement ? `${record.settlement.status ?? ""} · ${record.settlement.reference}` : "Not settled"} /></dl></section>
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5"><h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">Financial split</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Service amount" value={format(record.serviceAmount, record.currency)} /><Field label="Customer platform fee" value={format(record.customerFeeAmount, record.currency)} /><Field label="Creator commission" value={format(record.creatorCommissionAmount, record.currency)} /><Field label="Creator receives" value={format(record.creatorNetAmount, record.currency)} /></dl></section></div>
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5"><h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">Settlement safety</h2><div className="mt-4 grid gap-4 sm:grid-cols-3"><Field label="Open dispute" value={record.hasOpenDispute ? "Yes" : "No"} /><Field label="Financial lock" value={record.isFinancialLocked ? "Yes" : "No"} /><Field label="Manual release" value={record.manualReleaseAllowed ? "Available" : record.manualReleaseBlockedReason ?? "Unavailable"} /></div>{record.manualReleaseAllowed && <div className="mt-5 border-t border-neutral-800 pt-5"><label className="block text-sm font-medium text-neutral-300">Reason (optional)<textarea value={reason} maxLength={240} onChange={(event) => setReason(event.target.value)} className="mt-1.5 min-h-20 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white" /></label><button type="button" disabled={pending} onClick={() => void release()} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-3.5 py-2 text-sm font-semibold text-black disabled:opacity-50"><CheckCircle2 size={16} />{pending ? "Releasing…" : "Release settlement now"}</button></div>}{actionError && <p className="mt-4 flex gap-2 text-sm text-red-200"><AlertCircle size={16} />{actionError}</p>}</section>
  </>;
}
