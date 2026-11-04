import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../../api/axios";
import AdminButton from "../../components/admin/common/AdminButton";
import AdminEmptyState from "../../components/admin/feedback/AdminEmptyState";
import AdminLoadingState from "../../components/admin/feedback/AdminLoadingState";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import AdminPageHeader from "../../components/admin/layout/AdminPageHeader";
import { useToast } from "../../hooks/useToast";

type AppealStatus = "OPEN" | "UPHELD" | "REJECTED";
type Appeal = { appealId: string; disputeId: string; bookingId: string | null; bookingReference: string | null; serviceTitle: string | null; raisedByRole: "USER" | "CREATOR"; status: AppealStatus; reason: string; evidence: string[]; createdAt: string; decision: { action: "REVERSE_DECISION" | "CONFIRM_DECISION"; note: string | null; decidedAt: string } | null; dispute: { status: string; reason: string; resolution: { action: string; note: string | null; resolvedAt: string } | null } | null };
type ListResponse = { appeals: Appeal[]; pagination: { page: number; limit: number; total: number } };
const message = (error: unknown) => axios.isAxiosError(error) && typeof error.response?.data?.message === "string" ? error.response.data.message : "Unable to load appeals.";

export default function AdminAppealsPage() {
  const { showToast } = useToast();
  const { appealId } = useParams<{ appealId: string }>();
  const navigate = useNavigate();
  const [items, setItems] = useState<Appeal[]>([]);
  const [detail, setDetail] = useState<Appeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"" | AppealStatus>("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<ListResponse["pagination"] | null>(null);
  const [note, setNote] = useState("");
  const [deciding, setDeciding] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError(null); setDetail(null);
    try {
      if (appealId) setDetail((await api.get<{ appeal: Appeal }>(`/v1/admin/appeals/${encodeURIComponent(appealId)}`)).data.appeal);
      else { const response = await api.get<ListResponse>("/v1/admin/appeals", { params: { page, limit: 20, ...(status ? { status } : {}) } }); setItems(response.data.appeals); setPagination(response.data.pagination); }
    } catch (caught) { setError(message(caught)); }
    finally { setLoading(false); }
  }, [appealId, page, status]);
  useEffect(() => { void load(); }, [load]);
  const decide = async (action: "REVERSE_DECISION" | "CONFIRM_DECISION") => {
    if (!detail || !window.confirm(`Confirm ${action === "REVERSE_DECISION" ? "reversing" : "confirming"} this dispute decision?`)) return;
    try { setDeciding(true); setError(null); await api.post(`/v1/admin/appeals/${encodeURIComponent(detail.appealId)}/decide`, { action, ...(note.trim() ? { note: note.trim() } : {}) }); await load(); showToast(action === "REVERSE_DECISION" ? "Appeal decision reversed." : "Appeal decision confirmed.", "success"); }
    catch (caught) { setError(message(caught)); showToast("Couldn't decide the appeal.", "error"); }
    finally { setDeciding(false); }
  };
  return <AdminLayout workspace="operations"><AdminPageHeader title={appealId ? "Appeal detail" : "Appeals"} description="Review appeals using the existing dispute decision authority."><AdminButton onClick={() => void load()}>Refresh</AdminButton></AdminPageHeader>{error && <p role="alert" className="mb-4 rounded border border-theme-danger bg-theme-danger-tint p-3 text-sm text-theme-danger">{error}</p>}{loading ? <AdminLoadingState /> : appealId ? !detail ? <AdminEmptyState title="Appeal unavailable" description="The appeal could not be loaded." /> : <section className="space-y-5 rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-5"><button type="button" onClick={() => navigate("/admin/operations/appeals")} className="text-sm font-semibold text-theme-accent hover:underline">Back to appeals</button><div className="grid gap-4 sm:grid-cols-2"><Field label="Appeal" value={detail.appealId} /><Field label="Status" value={detail.status} /><Field label="Appellant role" value={detail.raisedByRole} /><Field label="Submitted" value={new Date(detail.createdAt).toLocaleString()} /><Field label="Booking" value={detail.bookingReference ?? "Unavailable"} /><Field label="Service" value={detail.serviceTitle ?? "Unavailable"} /></div><Field label="Appeal reason" value={detail.reason} /><Field label="Original dispute" value={detail.dispute ? `${detail.dispute.status}: ${detail.dispute.reason}` : "Unavailable"} /><button type="button" onClick={() => navigate(`/admin/operations/disputes/${detail.disputeId}`)} className="text-sm font-semibold text-theme-accent hover:underline">Open original dispute</button>{detail.evidence.length > 0 && <Field label="Evidence references" value={detail.evidence.join(", ")} />}{detail.decision ? <Field label="Decision" value={`${detail.decision.action} · ${new Date(detail.decision.decidedAt).toLocaleString()}`} /> : <div className="space-y-3 border-t border-theme-border pt-5"><label className="block text-sm text-theme-text">Decision note (optional)<textarea value={note} maxLength={1500} onChange={(event) => setNote(event.target.value)} className="mt-2 min-h-24 w-full rounded border border-theme-border bg-theme-inset p-3 text-theme-text" /></label><div className="flex flex-wrap gap-3"><AdminButton disabled={deciding} onClick={() => void decide("CONFIRM_DECISION")}>{deciding ? "Deciding…" : "Confirm decision"}</AdminButton><AdminButton disabled={deciding} onClick={() => void decide("REVERSE_DECISION")}>{deciding ? "Deciding…" : "Reverse decision"}</AdminButton></div></div>}</section> : <section className="space-y-4"><label className="text-sm text-theme-text">Status <select value={status} onChange={(event) => { setStatus(event.target.value as "" | AppealStatus); setPage(1); }} className="ml-2 rounded border border-theme-border bg-theme-surface px-2 py-1 text-theme-text"><option value="">All</option><option value="OPEN">Open</option><option value="UPHELD">Upheld</option><option value="REJECTED">Rejected</option></select></label>{items.length === 0 ? <AdminEmptyState title="No appeals" description="No appeals match this view." /> : <div className="space-y-3">{items.map((appeal) => <button key={appeal.appealId} type="button" onClick={() => navigate(`/admin/operations/appeals/${appeal.appealId}`)} className="grid w-full gap-3 rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-4 text-left hover:bg-theme-inset sm:grid-cols-4"><Field label="Booking" value={appeal.bookingReference ?? "Unavailable"} /><Field label="Appellant" value={appeal.raisedByRole} /><Field label="Status" value={appeal.status} /><Field label="Submitted" value={new Date(appeal.createdAt).toLocaleString()} /></button>)}</div>}{pagination && <div className="flex justify-between text-sm text-theme-muted"><span>{pagination.total} total</span><div className="flex gap-3"><button type="button" disabled={pagination.page <= 1} onClick={() => setPage(pagination.page - 1)}>Previous</button><button type="button" disabled={pagination.page * pagination.limit >= pagination.total} onClick={() => setPage(pagination.page + 1)}>Next</button></div></div>}</section>}</AdminLayout>;
}

function Field({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-medium uppercase tracking-wide text-theme-muted">{label}</p><p className="mt-1 break-words text-sm text-theme-text">{value}</p></div>; }
