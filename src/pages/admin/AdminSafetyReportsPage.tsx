import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import AdminPageHeader from "../../components/admin/layout/AdminPageHeader";
import { adminSafetyReport, adminSafetyReports, decideSafetyReport, type AdminSafetyReport, type SafetyStatus } from "../../api/safetyReports";

const outcomes = ["UNDER_REVIEW", "RESOLVED", "DISMISSED"] as const;

export default function AdminSafetyReportsPage() {
  const [items, setItems] = useState<AdminSafetyReport[]>([]);
  const [status, setStatus] = useState<SafetyStatus | "">("");
  const [selected, setSelected] = useState<AdminSafetyReport | null>(null);
  const [rationale, setRationale] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => { setLoading(true); setError(""); adminSafetyReports(status || undefined).then((result) => setItems(result.items)).catch(() => setError("Safety reports are unavailable.")).finally(() => setLoading(false)); };
  useEffect(load, [status]);
  const inspect = async (id: string) => { try { setError(""); setSelected(await adminSafetyReport(id)); setRationale(""); } catch { setError("That report could not be loaded."); } };
  const decide = async (outcome: typeof outcomes[number]) => {
    if (!selected) return;
    if (outcome !== "UNDER_REVIEW" && (rationale.trim().length < 12 || rationale.trim().length > 2000)) { setError("A decision rationale must contain 12–2000 characters."); return; }
    try { setSaving(true); setError(""); await decideSafetyReport(selected.id, { outcome, ...(outcome === "UNDER_REVIEW" ? {} : { rationale: rationale.trim() }) }); await inspect(selected.id); load(); }
    catch { setError("Decision could not be saved. The report may already have changed."); }
    finally { setSaving(false); }
  };

  return <AdminLayout workspace="operations">
    <AdminPageHeader title="Safety reports" description="Account-safety reports are separate from financial disputes and do not automatically apply governance actions." />
    <select value={status} onChange={(event) => setStatus(event.target.value as SafetyStatus | "")} className="mb-5 rounded border border-neutral-700 bg-neutral-900 p-2"><option value="">All statuses</option>{["SUBMITTED", "UNDER_REVIEW", "RESOLVED", "DISMISSED"].map((value) => <option key={value}>{value}</option>)}</select>
    {error && <p role="alert" className="mb-4 text-red-300">{error}</p>}
    {selected && <section className="mb-5 rounded-xl border border-neutral-700 bg-neutral-900 p-5" aria-label="Safety report investigation">
      <div className="flex justify-between gap-3"><h2 className="font-semibold">Investigation detail</h2><button onClick={() => setSelected(null)}>Close</button></div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-neutral-500">Reporter</dt><dd>{selected.reporter ? `${selected.reporter.role} · ${selected.reporter.id}` : "Unavailable"}</dd></div><div><dt className="text-neutral-500">Reported account</dt><dd>{selected.reported ? `${selected.reported.role} · ${selected.reported.id}` : "Unavailable"}</dd></div>
        <div><dt className="text-neutral-500">Submitted</dt><dd>{new Date(selected.createdAt).toLocaleString()}</dd></div><div><dt className="text-neutral-500">Status</dt><dd>{selected.status}</dd></div>
        <div><dt className="text-neutral-500">Authorized booking context</dt><dd>{selected.bookingId || "None"}</dd></div><div><dt className="text-neutral-500">Message/evidence reference</dt><dd>{selected.messageId || "None"}</dd></div>
      </dl>
      <p className="mt-4 text-sm font-medium">{selected.reason.replaceAll("_", " ")}</p><p className="mt-1 whitespace-pre-wrap text-sm text-neutral-300">{selected.explanation}</p>
      {selected.decision && <p className="mt-4 text-sm text-neutral-400">Decision: {selected.decision.outcome} — {selected.decision.rationale}</p>}
      {["SUBMITTED", "UNDER_REVIEW"].includes(selected.status) && <div className="mt-5 space-y-3"><textarea value={rationale} onChange={(event) => setRationale(event.target.value)} maxLength={2000} placeholder="Required for resolve or dismiss (12–2000 characters)" className="min-h-24 w-full rounded border border-neutral-700 bg-neutral-950 p-3 text-sm" /><div className="flex flex-wrap gap-3">{outcomes.map((outcome) => <button key={outcome} disabled={saving} onClick={() => void decide(outcome)} className="rounded border border-neutral-600 px-3 py-2 disabled:opacity-50">{outcome.replaceAll("_", " ")}</button>)}</div></div>}
    </section>}
    {loading ? <p>Loading…</p> : <div className="space-y-3">{items.map((item) => <article key={item.id} className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4"><div className="flex flex-wrap justify-between gap-3"><b>{item.reason.replaceAll("_", " ")}</b><span>{item.status}</span></div><p className="mt-2 line-clamp-2 text-sm text-neutral-300">{item.explanation}</p><p className="mt-2 text-xs text-neutral-500">Reporter {item.reporter?.role ?? "unavailable"} · Reported {item.reported?.role ?? "unavailable"} · {new Date(item.createdAt).toLocaleString()}</p><button onClick={() => void inspect(item.id)} className="mt-3 rounded border border-neutral-600 px-3 py-1 text-sm">Inspect report</button></article>)}</div>}
  </AdminLayout>;
}
