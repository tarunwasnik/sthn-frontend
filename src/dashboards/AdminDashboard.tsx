//frontend/src/dashboards/AdminDashboard.tsx

import { useEffect, useState } from "react";
import api from "../api/axios";
import CreateAdminControl from "../components/CreateAdminControl";

type AdminControl = {
  _id: string;
  scope: "GLOBAL" | "ACTION" | "EMERGENCY";
  mode: string;
  actionKey?: string;
  appliesTo?: string;
  reason: string;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
};

type PreviewDecision = {
  decision: "ALLOW" | "BLOCK" | "FORCE_DRY_RUN";
  reason?: string;
};

export default function AdminDashboard() {
  const [controls, setControls] = useState<AdminControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminControl | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);

  const [expireLoading, setExpireLoading] = useState(false);
  const [expireError, setExpireError] = useState<string | null>(null);

  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<AdminControl[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // ---------------------------------------------
  // Option B – preview state
  // ---------------------------------------------
  const [previewActionKey, setPreviewActionKey] = useState("");
  const [previewRisk, setPreviewRisk] = useState<
    "low" | "medium" | "high" | "critical"
  >("low");
  const [previewDryRun, setPreviewDryRun] = useState(false);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] =
    useState<PreviewDecision | null>(null);

  // -----------------------------
  // Active controls
  // -----------------------------

  const fetchControls = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get(
        "/v1/admin/actions/controls/active"
      );

      setControls(res.data.data || []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to load active controls"
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // History
  // -----------------------------

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      setHistoryError(null);

      const res = await api.get(
        "/v1/admin/actions/controls/history"
      );

      setHistory(res.data.data || []);
    } catch (err: any) {
      setHistoryError(
        err?.response?.data?.message ||
          "Failed to load history"
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchControls();
  }, []);

  // -----------------------------
  // Single control details
  // -----------------------------

  const loadDetail = async (id: string) => {
    try {
      setDetailLoading(true);
      setDetailError(null);

      const res = await api.get(
        `/v1/admin/actions/controls/${id}`
      );

      setDetail(res.data.data || null);
    } catch (err: any) {
      setDetailError(
        err?.response?.data?.message ||
          "Failed to load control details"
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      setExpireError(null);
      return;
    }

    setExpandedId(id);
    setDetail(null);
    setExpireError(null);
    loadDetail(id);
  };

  // -----------------------------
  // Expire
  // -----------------------------

  const expireControl = async (id: string) => {
    const ok = window.confirm(
      "Expire this control immediately?"
    );
    if (!ok) return;

    try {
      setExpireLoading(true);
      setExpireError(null);

      await api.post(
        `/v1/admin/actions/controls/${id}/expire`
      );

      setExpandedId(null);
      setDetail(null);

      await fetchControls();

      if (showHistory) {
        await fetchHistory();
      }
    } catch (err: any) {
      setExpireError(
        err?.response?.data?.message ||
          "Failed to expire control"
      );
    } finally {
      setExpireLoading(false);
    }
  };

  // -----------------------------
  // Option B – preview
  // -----------------------------

  const runPreview = async () => {
    if (!previewActionKey.trim()) {
      setPreviewError("Action key is required");
      return;
    }

    try {
      setPreviewLoading(true);
      setPreviewError(null);
      setPreviewResult(null);

      const res = await api.post(
        "/v1/admin/actions/controls/preview",
        {
          actionKey: previewActionKey.trim(),
          riskLevel: previewRisk,
          dryRun: previewDryRun,
        }
      );

      setPreviewResult(res.data.data);
    } catch (err: any) {
      setPreviewError(
        err?.response?.data?.message ||
          "Failed to preview control decision"
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const globals = controls.filter(
    (c) => c.scope === "GLOBAL"
  );
  const actions = controls.filter(
    (c) => c.scope === "ACTION"
  );
  const emergencies = controls.filter(
    (c) => c.scope === "EMERGENCY"
  );

  const renderRow = (c: AdminControl) => (
    <li key={c._id}>
      <div
        style={{ cursor: "pointer" }}
        onClick={() => toggleExpand(c._id)}
      >
        <strong>
          {c.scope === "GLOBAL" && c.mode}
          {c.scope === "ACTION" && c.actionKey}
          {c.scope === "EMERGENCY" && c.appliesTo}
        </strong>
        {" — "}
        reason: {c.reason}
        {" — "}
        expires: {c.expiresAt ?? "never"}
      </div>

      {expandedId === c._id && (
        <div style={{ marginLeft: 16, marginTop: 6 }}>
          {detailLoading && <p>Loading details...</p>}
          {detailError && (
            <p style={{ color: "red" }}>{detailError}</p>
          )}

          {detail && (
            <div>
              <p>
                <strong>Scope:</strong> {detail.scope}
              </p>

              <p>
                <strong>Mode:</strong> {detail.mode}
              </p>

              {detail.actionKey && (
                <p>
                  <strong>Action key:</strong>{" "}
                  {detail.actionKey}
                </p>
              )}

              {detail.appliesTo && (
                <p>
                  <strong>Applies to:</strong>{" "}
                  {detail.appliesTo}
                </p>
              )}

              <p>
                <strong>Created by:</strong>{" "}
                {detail.createdBy}
              </p>

              <p>
                <strong>Created at:</strong>{" "}
                {new Date(
                  detail.createdAt
                ).toLocaleString()}
              </p>

              <p>
                <strong>Expires at:</strong>{" "}
                {detail.expiresAt
                  ? new Date(
                      detail.expiresAt
                    ).toLocaleString()
                  : "never"}
              </p>

              <p>
                <strong>Reason:</strong> {detail.reason}
              </p>

              <div style={{ marginTop: 8 }}>
                <button
                  disabled={expireLoading}
                  onClick={() =>
                    expireControl(detail._id)
                  }
                >
                  {expireLoading
                    ? "Expiring..."
                    : "Expire control"}
                </button>

                {expireError && (
                  <p style={{ color: "red" }}>
                    {expireError}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  );

  return (
    <div>
      <h2>Admin Control Plane</h2>

      {/* ------------------------------------------------ */}
      {/* Option B – live consistency / effectiveness view */}
      {/* ------------------------------------------------ */}
      <section
        style={{
          border: "1px solid #ccc",
          padding: 12,
          marginBottom: 16,
          maxWidth: 420,
        }}
      >
        <h3>Control effectiveness preview</h3>

        <div>
          <label>Action key</label>
          <br />
          <input
            value={previewActionKey}
            onChange={(e) =>
              setPreviewActionKey(e.target.value)
            }
            placeholder="APPLY_CREATOR_COOLDOWN"
          />
        </div>

        <div>
          <label>Risk level</label>
          <br />
          <select
            value={previewRisk}
            onChange={(e) =>
              setPreviewRisk(e.target.value as any)
            }
          >
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
            <option value="critical">critical</option>
          </select>
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              checked={previewDryRun}
              onChange={(e) =>
                setPreviewDryRun(e.target.checked)
              }
            />{" "}
            dryRun
          </label>
        </div>

        <div style={{ marginTop: 8 }}>
          <button
            disabled={previewLoading}
            onClick={runPreview}
          >
            {previewLoading ? "Checking..." : "Preview"}
          </button>
        </div>

        {previewError && (
          <p style={{ color: "red" }}>{previewError}</p>
        )}

        {previewResult && (
          <div style={{ marginTop: 8 }}>
            <p>
              <strong>Decision:</strong>{" "}
              {previewResult.decision}
            </p>

            {previewResult.reason && (
              <p>
                <strong>Reason:</strong>{" "}
                {previewResult.reason}
              </p>
            )}
          </div>
        )}
      </section>

      <button onClick={() => setShowCreate((v) => !v)}>
        {showCreate ? "Close" : "Create control"}
      </button>

      <button
        style={{ marginLeft: 8 }}
        onClick={async () => {
          const next = !showHistory;
          setShowHistory(next);
          if (next) {
            await fetchHistory();
          }
        }}
      >
        {showHistory ? "Hide history" : "Show history"}
      </button>

      {showCreate && (
        <CreateAdminControl
          onCreated={async () => {
            setExpandedId(null);
            setDetail(null);
            await fetchControls();
            if (showHistory) {
              await fetchHistory();
            }
          }}
          onClose={() => setShowCreate(false)}
        />
      )}

      {loading && <p>Loading active controls...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <>
          <section>
            <h3>Global Controls</h3>
            {globals.length === 0 && (
              <p>No active global controls</p>
            )}
            <ul>{globals.map(renderRow)}</ul>
          </section>

          <section>
            <h3>Action-level Blackouts</h3>
            {actions.length === 0 && (
              <p>No active action blackouts</p>
            )}
            <ul>{actions.map(renderRow)}</ul>
          </section>

          <section>
            <h3>Emergency Controls</h3>
            {emergencies.length === 0 && (
              <p>No active emergency controls</p>
            )}
            <ul>{emergencies.map(renderRow)}</ul>
          </section>
        </>
      )}

      {showHistory && (
        <section style={{ marginTop: 24 }}>
          <h3>Control History</h3>

          {historyLoading && <p>Loading history...</p>}
          {historyError && (
            <p style={{ color: "red" }}>
              {historyError}
            </p>
          )}

          {!historyLoading && !historyError && (
            <ul>
              {history.map((c) => (
                <li key={c._id}>
                  <strong>{c.scope}</strong>
                  {" — "}
                  {c.scope === "GLOBAL" && c.mode}
                  {c.scope === "ACTION" && c.actionKey}
                  {c.scope === "EMERGENCY" &&
                    c.appliesTo}
                  {" — "}
                  created at{" "}
                  {new Date(
                    c.createdAt
                  ).toLocaleString()}
                  {" — "}
                  expires{" "}
                  {c.expiresAt
                    ? new Date(
                        c.expiresAt
                      ).toLocaleString()
                    : "never"}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}