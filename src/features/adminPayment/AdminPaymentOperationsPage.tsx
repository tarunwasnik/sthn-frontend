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
import type { AdminPaymentStatus } from "./types";
import { useAdminPayments } from "./useAdminPayments";

const statuses: Array<{ label: string; value?: AdminPaymentStatus }> = [
  { label: "All" }, { label: "Created", value: "CREATED" }, { label: "Initializing", value: "INITIALIZING" },
  { label: "Pending", value: "PENDING" }, { label: "Authorized", value: "AUTHORIZED" }, { label: "Captured", value: "CAPTURED" },
  { label: "Settled", value: "SETTLED" }, { label: "Failed", value: "FAILED" }, { label: "Expired", value: "EXPIRED" },
  { label: "Cancelled", value: "CANCELLED" }, { label: "Refunded", value: "REFUNDED" },
];

function dateTime(value?: string) { return value ? new Date(value).toLocaleString() : "—"; }
function Field({ label, value }: { label: string; value: ReactNode }) { return <div><dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</dt><dd className="mt-1 break-words text-sm text-white">{value}</dd></div>; }
function StatusBadge({ status }: { status: string }) { return <span className="inline-flex rounded-full border border-neutral-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-200">{status}</span>; }

export default function AdminPaymentOperationsPage() {
  const navigate = useNavigate();
  const { paymentReference } = useParams<{ paymentReference: string }>();
  const payments = useAdminPayments(paymentReference);
  const [currencies, setCurrencies] = useState<CurrencyMetadataDto[]>([]);
  const [confirmSync, setConfirmSync] = useState(false);
  const metadata = useMemo(() => new Map(currencies.map((item) => [item.code, item])), [currencies]);
  const format = (amount: number, currency: string) => formatMinorAmount(amount, currency, metadata.get(currency));
  useEffect(() => { void getSupportedCurrencies().then(setCurrencies).catch(() => setCurrencies([])); }, []);

  return <AdminLayout workspace="operations">
    <AdminConfirmDialog open={confirmSync} title="Sync payment" confirmText="Sync payment" loading={payments.syncPending}
      description={payments.detail ? `Sync the provider-facing state for ${payments.detail.paymentReference}. This does not capture, settle, release, or retry a payment; it reloads provider status through backend lifecycle authority.` : "Synchronize this payment through backend lifecycle authority."}
      onConfirm={() => { setConfirmSync(false); void payments.sync(); }} onCancel={() => setConfirmSync(false)} />
    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">Admin operations · booking payments</p>
    <AdminPageHeader title={paymentReference ? "Payment detail" : "Payment operations"} description="Persisted booking-payment records and bounded financial relationships. Status, reservation, capture, escrow, and settlement remain backend-authoritative.">
      <button type="button" onClick={payments.refresh} className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 px-3.5 py-2 text-sm text-neutral-200 hover:bg-neutral-800"><RefreshCw size={15} />Refresh</button>
    </AdminPageHeader>
    {!paymentReference ? <PaymentList payments={payments} currencies={currencies} format={format} onOpen={(reference) => navigate(`/admin/operations/payments/${encodeURIComponent(reference)}`)} /> :
      <PaymentDetail payments={payments} format={format} onBack={() => navigate("/admin/operations/payments")} onSync={() => setConfirmSync(true)} />}
  </AdminLayout>;
}

function PaymentList({ payments, currencies, format, onOpen }: { payments: ReturnType<typeof useAdminPayments>; currencies: CurrencyMetadataDto[]; format: (amount: number, currency: string) => string; onOpen: (reference: string) => void }) {
  return <section className="space-y-4">
    <div className="flex flex-wrap gap-2">{statuses.map((item) => <button key={item.label} type="button" onClick={() => payments.setStatus(item.value)} className={`rounded-lg px-3 py-2 text-sm ${payments.filters.status === item.value ? "bg-white text-black" : "border border-neutral-700 text-neutral-200 hover:bg-neutral-800"}`}>{item.label}</button>)}</div>
    <label className="block max-w-xs text-sm text-neutral-300">Currency<select value={payments.filters.currency ?? ""} onChange={(event) => payments.setCurrency(event.target.value || undefined)} className="mt-1 block w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white"><option value="">All currencies</option>{currencies.map((currency) => <option key={currency.code} value={currency.code}>{currency.displayName} ({currency.code})</option>)}</select></label>
    {payments.listState === "loading" && <p className="rounded-xl border border-neutral-800 p-5 text-neutral-400">Loading payments…</p>}
    {payments.listState === "error" && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">{payments.listError}</p>}
    {payments.listState === "ready" && payments.list?.items.length === 0 && <p className="rounded-xl border border-neutral-800 p-5 text-neutral-400">No payments match these backend filters.</p>}
    {payments.listState === "ready" && payments.list?.items.map((item) => <button key={item.paymentReference} type="button" onClick={() => onOpen(item.paymentReference)} className="grid w-full gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 text-left transition hover:border-neutral-600 md:grid-cols-5"><div><p className="text-xs text-neutral-500">Payment</p><p className="mt-1 font-semibold text-white">{item.paymentReference}</p></div><div><p className="text-xs text-neutral-500">Amount</p><p className="mt-1 font-semibold text-white">{format(item.amount, item.currency)}</p></div><div><p className="text-xs text-neutral-500">Provider</p><p className="mt-1 text-sm text-white">{item.provider ?? "—"}</p></div><div><p className="text-xs text-neutral-500">Created</p><p className="mt-1 text-sm text-white">{dateTime(item.createdAt)}</p></div><div className="md:text-right"><StatusBadge status={item.status} /></div></button>)}
    {payments.list && payments.list.pagination.total > payments.list.pagination.limit && <AdminPagination page={payments.list.pagination.page} totalPages={Math.ceil(payments.list.pagination.total / payments.list.pagination.limit)} totalItems={payments.list.pagination.total} pageSize={payments.list.pagination.limit} onPageChange={payments.setPage} />}
  </section>;
}

function PaymentDetail({ payments, format, onBack, onSync }: { payments: ReturnType<typeof useAdminPayments>; format: (amount: number, currency: string) => string; onBack: () => void; onSync: () => void }) {
  const record = payments.financialDetail;
  const payment = record?.payment ?? payments.detail;
  return <section className="space-y-5">
    <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm text-neutral-300 hover:text-white"><ArrowLeft size={16} />Back to payments</button>
    {payments.detailState === "loading" && <p className="rounded-xl border border-neutral-800 p-5 text-neutral-400">Loading payment…</p>}
    {payments.detailState === "error" && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">{payments.detailError}</p>}
    {payment && <><div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5"><div><p className="font-semibold text-white">{payment.paymentReference}</p><p className="mt-1 text-sm text-neutral-400">{format(payment.amount, payment.currency)} · {payment.provider ?? "Provider unavailable"}</p></div><StatusBadge status={payment.status} /></div>
      <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5"><h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">Payment</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Amount" value={format(payment.amount, payment.currency)} /><Field label="Currency" value={payment.currency} /><Field label="Booking ID" value={payment.bookingId ?? "—"} /><Field label="Customer ID" value={payment.userId ?? "—"} /><Field label="Creator ID" value={payment.creatorId ?? "—"} /><Field label="Provider reference" value={payment.providerReference ?? "—"} /><Field label="Escrow recognized" value={payment.escrowRecognized ? "Yes" : "No"} /><Field label="Updated" value={dateTime(payment.updatedAt)} /></dl></section>
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5"><h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">Persisted pricing</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Service amount" value={payment.serviceAmount === undefined ? "—" : format(payment.serviceAmount, payment.currency)} /><Field label="Customer fee" value={payment.customerFeeAmount === undefined ? "—" : format(payment.customerFeeAmount, payment.currency)} /></dl><p className="mt-5 text-sm leading-6 text-neutral-400">These are persisted backend amounts. This workspace does not calculate fees, commissions, escrow, or settlement.</p></section></div>
      <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5"><h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">Booking relationship</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Booking reference" value={record?.booking?.bookingReference ?? "—"} /><Field label="Booking status" value={record?.booking?.status ?? "—"} /><Field label="Payment method" value={record?.booking?.paymentMethod ?? "—"} /><Field label="Completed" value={dateTime(record?.booking?.completedAt)} /><Field label="Settlement eligible" value={dateTime(record?.booking?.settlementEligibleAt)} /></dl></section>
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5"><h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">Wallet reservation</h2>{record?.reservation ? <dl className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Reference" value={record.reservation.reservationReference} /><Field label="Status" value={<StatusBadge status={record.reservation.status} />} /><Field label="Amount" value={format(record.reservation.amount, record.reservation.currency)} /><Field label="Authorized" value={dateTime(record.reservation.authorizedAt)} /><Field label="Released" value={dateTime(record.reservation.releasedAt)} /><Field label="Release cause" value={record.reservation.releaseCause ?? "—"} /><Field label="Captured" value={dateTime(record.reservation.capturedAt)} /><Field label="Capture cause" value={record.reservation.captureCause ?? "—"} /></dl> : <p className="mt-4 text-sm text-neutral-400">No Wallet reservation is associated with this payment.</p>}</section></div>
      <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5"><h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">Escrow relationship</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Allocation reference" value={record?.escrow?.allocationReference ?? "—"} /><Field label="Allocation status" value={record?.escrow?.status ?? "—"} /><Field label="Allocated" value={dateTime(record?.escrow?.allocatedAt)} /></dl></section><section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5"><h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">Creator settlement relationship</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Settlement reference" value={record?.settlement?.settlementReference ?? "—"} /><Field label="Settlement status" value={record?.settlement?.status ?? "—"} /><Field label="Settled" value={dateTime(record?.settlement?.settledAt)} /></dl></section></div>
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5"><h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">Payment synchronization</h2><p className="mt-2 text-sm leading-6 text-neutral-400">Sync asks the backend lifecycle to read the provider’s current payment status and reconcile the persisted Payment status. It does not initiate capture, release, settlement, or a retry. After any response, authoritative detail is reloaded; ambiguous network outcomes are not retried automatically.</p><button type="button" disabled={payments.syncPending} onClick={onSync} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-neutral-700 px-3.5 py-2 text-sm font-semibold text-neutral-100 hover:bg-neutral-800 disabled:opacity-50"><RefreshCw size={16} />{payments.syncPending ? "Syncing…" : "Sync payment"}</button>{payments.actionError && <p role="alert" className="mt-4 text-sm text-red-200">{payments.actionError}</p>}</section>
    </>}
  </section>;
}
