import { ArrowLeft, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminConfirmDialog from "../../components/admin/feedback/AdminConfirmDialog";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import AdminPageHeader from "../../components/admin/layout/AdminPageHeader";
import AdminPagination from "../../components/admin/table/AdminPagination";
import { getSupportedCurrencies } from "../wallet/api";
import type { CurrencyMetadataDto } from "../wallet/types";
import { formatMinorAmount } from "../walletConversion/money";
import type { AdminSettlementDto, AdminSettlementStatus } from "./types";
import { useAdminSettlements } from "./useAdminSettlements";

const statuses: Array<{ label: string; value?: AdminSettlementStatus }> = [
  { label: "All" }, { label: "Created", value: "CREATED" },
  { label: "Pending", value: "PENDING" }, { label: "Processing", value: "PROCESSING" },
  { label: "Completed", value: "COMPLETED" }, { label: "Failed", value: "FAILED" },
  { label: "Cancelled", value: "CANCELLED" }, { label: "Expired", value: "EXPIRED" },
];

function dateTime(value?: string) { return value ? new Date(value).toLocaleString() : "—"; }
function Field({ label, value }: { label: string; value: ReactNode }) { return <div><dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</dt><dd className="mt-1 break-words text-sm text-white">{value}</dd></div>; }
function StatusBadge({ status }: { status: AdminSettlementStatus }) {
  const tone: Record<AdminSettlementStatus, string> = { CREATED: "border-neutral-600 text-neutral-300", PENDING: "border-amber-400/30 bg-amber-400/10 text-amber-200", PROCESSING: "border-sky-400/30 bg-sky-400/10 text-sky-200", COMPLETED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200", FAILED: "border-red-400/30 bg-red-400/10 text-red-200", CANCELLED: "border-neutral-600 text-neutral-300", EXPIRED: "border-neutral-600 text-neutral-300" };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${tone[status]}`}>{status}</span>;
}

export default function AdminSettlementOperationsPage() {
  const navigate = useNavigate();
  const { settlementReference } = useParams<{ settlementReference: string }>();
  const settlement = useAdminSettlements(settlementReference);
  const [currencies, setCurrencies] = useState<CurrencyMetadataDto[]>([]);
  const [confirmRecheck, setConfirmRecheck] = useState(false);
  const metadata = useMemo(() => new Map(currencies.map((item) => [item.code, item])), [currencies]);
  const format = (amount: number, currency: string) => formatMinorAmount(amount, currency, metadata.get(currency));

  useEffect(() => { void getSupportedCurrencies().then(setCurrencies).catch(() => setCurrencies([])); }, []);
  const record = settlement.detail;

  return <AdminLayout workspace="operations">
    <AdminConfirmDialog
      open={confirmRecheck}
      title="Recheck settlement"
      description={record ? `Recheck ${record.settlementReference} (${format(record.amount, record.currency)} · ${record.status}). This invokes the existing backend settlement eligibility/replay authority and then reloads authoritative state.` : "Recheck this settlement using backend authority."}
      confirmText="Recheck settlement"
      loading={settlement.recheckPending}
      onConfirm={() => { setConfirmRecheck(false); void settlement.recheck(); }}
      onCancel={() => setConfirmRecheck(false)}
    />
    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">Admin operations · internal settlement</p>
    <AdminPageHeader title={settlementReference ? "Settlement detail" : "Settlement operations"} description="Internal booking settlement records. Amounts, eligibility, and status remain backend-authoritative; this workspace does not process withdrawals or payouts.">
      <button type="button" onClick={settlement.refresh} className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 px-3.5 py-2 text-sm text-neutral-200 hover:bg-neutral-800"><RefreshCw size={15} />Refresh</button>
    </AdminPageHeader>
    {!settlementReference ? <section className="space-y-4">
      <div className="flex flex-wrap gap-2">{statuses.map((item) => <button key={item.label} type="button" onClick={() => settlement.setStatus(item.value)} className={`rounded-lg px-3 py-2 text-sm ${settlement.filters.status === item.value ? "bg-white text-black" : "border border-neutral-700 text-neutral-200 hover:bg-neutral-800"}`}>{item.label}</button>)}</div>
      <label className="block max-w-xs text-sm text-neutral-300">Currency<select value={settlement.filters.currency ?? ""} onChange={(event) => settlement.setCurrency(event.target.value || undefined)} className="mt-1 block w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white"><option value="">All currencies</option>{currencies.map((currency) => <option key={currency.code} value={currency.code}>{currency.displayName} ({currency.code})</option>)}</select></label>
      {settlement.listState === "loading" && <p className="rounded-xl border border-neutral-800 p-5 text-neutral-400">Loading settlements…</p>}
      {settlement.listState === "error" && <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">{settlement.listError}</p>}
      {settlement.listState === "ready" && settlement.list?.items.length === 0 && <p className="rounded-xl border border-neutral-800 p-5 text-neutral-400">No settlements match these backend filters.</p>}
      {settlement.listState === "ready" && settlement.list?.items.map((item) => <button key={item.settlementReference} type="button" onClick={() => navigate(`/admin/operations/settlements/${encodeURIComponent(item.settlementReference)}`)} className="grid w-full gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 text-left transition hover:border-neutral-600 md:grid-cols-5"><div><p className="text-xs text-neutral-500">Settlement</p><p className="mt-1 font-semibold text-white">{item.settlementReference}</p></div><div><p className="text-xs text-neutral-500">Amount</p><p className="mt-1 font-semibold text-white">{format(item.amount, item.currency)}</p></div><div><p className="text-xs text-neutral-500">Booking</p><p className="mt-1 break-all text-sm text-white">{item.bookingId ?? "—"}</p></div><div><p className="text-xs text-neutral-500">Created</p><p className="mt-1 text-sm text-white">{dateTime(item.createdAt)}</p></div><div className="md:text-right"><StatusBadge status={item.status} /></div></button>)}
      {settlement.list && settlement.list.pagination.total > settlement.list.pagination.limit && <AdminPagination page={settlement.list.pagination.page} totalPages={Math.ceil(settlement.list.pagination.total / settlement.list.pagination.limit)} totalItems={settlement.list.pagination.total} pageSize={settlement.list.pagination.limit} onPageChange={settlement.setPage} />}
    </section> : <section className="space-y-5">
      <button type="button" onClick={() => navigate("/admin/operations/settlements")} className="inline-flex items-center gap-2 text-sm text-neutral-300 hover:text-white"><ArrowLeft size={16} />Back to settlements</button>
      {settlement.detailState === "loading" && <p className="rounded-xl border border-neutral-800 p-5 text-neutral-400">Loading settlement…</p>}
      {settlement.detailState === "error" && <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">{settlement.detailError}</p>}
      {record && <SettlementDetail record={record} format={format} onRecheck={() => setConfirmRecheck(true)} pending={settlement.recheckPending} actionError={settlement.actionError} />}
    </section>}
  </AdminLayout>;
}

function SettlementDetail({ record, format, onRecheck, pending, actionError }: { record: AdminSettlementDto; format: (amount: number, currency: string) => string; onRecheck: () => void; pending: boolean; actionError: string | null }) {
  return <><div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5"><div><p className="font-semibold text-white">{record.settlementReference}</p><p className="mt-1 text-sm text-neutral-400">Internal settlement in {record.currency}</p></div><StatusBadge status={record.status} /></div>
    <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5"><h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">Settlement</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Amount" value={format(record.amount, record.currency)} /><Field label="Currency" value={record.currency} /><Field label="Booking ID" value={record.bookingId ?? "—"} /><Field label="Payment ID" value={record.paymentId ?? "—"} /><Field label="Creator ID" value={record.creatorId ?? "—"} /><Field label="Eligible at" value={dateTime(record.settlementEligibleAt)} /><Field label="Settled at" value={dateTime(record.settledAt)} /><Field label="Ledger transaction" value={record.ledgerTransactionReference ?? "—"} /></dl></section>
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5"><h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">Persisted financial split</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Service amount" value={record.serviceAmount === undefined ? "—" : format(record.serviceAmount, record.currency)} /><Field label="Customer fee" value={record.customerFeeAmount === undefined ? "—" : format(record.customerFeeAmount, record.currency)} /><Field label="Creator commission" value={record.platformCommissionAmount === undefined ? "—" : format(record.platformCommissionAmount, record.currency)} /><Field label="Creator net" value={record.creatorNetAmount === undefined ? "—" : format(record.creatorNetAmount, record.currency)} /></dl></section></div>
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5"><h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">Operational action</h2><p className="mt-2 text-sm leading-6 text-neutral-400">Recheck invokes the backend settlement eligibility and replay authority. It is not a payout, withdrawal, or force-settlement control.</p><button type="button" disabled={pending} onClick={onRecheck} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-neutral-700 px-3.5 py-2 text-sm font-semibold text-neutral-100 hover:bg-neutral-800 disabled:opacity-50"><RefreshCw size={16} />{pending ? "Rechecking…" : "Recheck settlement"}</button>{actionError && <p role="alert" className="mt-4 text-sm text-red-200">{actionError}</p>}</section>
  </>;
}
