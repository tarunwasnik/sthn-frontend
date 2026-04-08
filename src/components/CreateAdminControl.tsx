import { useState, useMemo } from "react";
import api from "../api/axios";

type Props = {
  onCreated: () => void;
  onClose: () => void;
};

export default function CreateAdminControl({
  onCreated,
  onClose,
}: Props) {
  const [scope, setScope] = useState<
    "GLOBAL" | "ACTION" | "EMERGENCY"
  >("GLOBAL");

  const [mode, setMode] = useState("");
  const [actionKey, setActionKey] = useState("");
  const [appliesTo, setAppliesTo] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ----------------------------------
  // Phase 30 – Step 3
  // UI safety constraints
  // ----------------------------------

  const validationError = useMemo(() => {
    if (!mode.trim()) return "Mode is required";
    if (!reason.trim()) return "Reason is required";

    if (scope === "ACTION") {
      if (!actionKey.trim()) {
        return "Action key is required for ACTION scope";
      }
    }

    if (scope === "EMERGENCY") {
      if (!appliesTo.trim()) {
        return "Applies-to is required for EMERGENCY scope";
      }

      if (!expiresAt) {
        return "Expiry is required for EMERGENCY controls";
      }
    }

    return null;
  }, [scope, mode, reason, actionKey, appliesTo, expiresAt]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validationError) return;

    setError(null);

    const payload: any = {
      scope,
      mode,
      reason,
    };

    if (scope === "ACTION") {
      payload.actionKey = actionKey.trim();
    }

    if (scope === "EMERGENCY") {
      payload.appliesTo = appliesTo.trim();
      payload.expiresAt = new Date(expiresAt).toISOString();
    }

    if (scope !== "EMERGENCY" && expiresAt) {
      payload.expiresAt = new Date(expiresAt).toISOString();
    }

    try {
      setLoading(true);

      await api.post(
        "/v1/admin/actions/controls",
        payload
      );

      onCreated();
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to create control"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: 12,
        marginTop: 12,
        maxWidth: 360,
      }}
    >
      <h4>Create Control</h4>

      {(error || validationError) && (
        <p style={{ color: "red" }}>
          {error || validationError}
        </p>
      )}

      <form onSubmit={submit}>
        <div>
          <label>Scope</label>
          <br />
          <select
            value={scope}
            onChange={(e) =>
              setScope(e.target.value as any)
            }
          >
            <option value="GLOBAL">GLOBAL</option>
            <option value="ACTION">ACTION</option>
            <option value="EMERGENCY">EMERGENCY</option>
          </select>
        </div>

        <div>
          <label>Mode</label>
          <br />
          <input
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            placeholder="mode"
          />
        </div>

        {scope === "ACTION" && (
          <div>
            <label>Action key</label>
            <br />
            <input
              value={actionKey}
              onChange={(e) =>
                setActionKey(e.target.value)
              }
              placeholder="BOOKING_CREATE"
            />
          </div>
        )}

        {scope === "EMERGENCY" && (
          <div>
            <label>Applies to</label>
            <br />
            <input
              value={appliesTo}
              onChange={(e) =>
                setAppliesTo(e.target.value)
              }
              placeholder="ALL or HIGH_RISK"
            />
          </div>
        )}

        <div>
          <label>
            Expires at{" "}
            {scope === "EMERGENCY"
              ? "(required)"
              : "(optional)"}
          </label>
          <br />
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) =>
              setExpiresAt(e.target.value)
            }
          />
        </div>

        <div>
          <label>Reason</label>
          <br />
          <input
            value={reason}
            onChange={(e) =>
              setReason(e.target.value)
            }
            placeholder="why is this control needed"
          />
        </div>

        <div style={{ marginTop: 8 }}>
          <button
            disabled={loading || !!validationError}
          >
            {loading ? "Creating..." : "Create"}
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{ marginLeft: 8 }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}