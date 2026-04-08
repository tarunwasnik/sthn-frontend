// frontend/src/pages/admin/AdminEntry.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

type AdminMode = "SYSTEM" | "OPERATIONS";

export default function AdminEntry() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<AdminMode | null>(null);

  const selectMode = async (mode: AdminMode) => {
    try {
      setLoading(mode);

      const res = await api.post("/control-plane/admin/mode", {
        mode,
      });

      const { redirectTo } = res.data;

      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error("Failed to set admin mode", err);
      alert("Failed to enter admin mode. Please try again.");
      setLoading(null);
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <h2>Choose Admin Workspace</h2>

      <div
        style={{
          display: "flex",
          gap: 24,
          marginTop: 32,
        }}
      >
        {/* SYSTEM MODE */}
        <div
          onClick={() => selectMode("SYSTEM")}
          style={{
            padding: 24,
            width: 280,
            border: "1px solid #ccc",
            cursor: "pointer",
            opacity: loading && loading !== "SYSTEM" ? 0.5 : 1,
          }}
        >
          <h3>System</h3>
          <p>Rules, automation, metrics, platform health</p>
          {loading === "SYSTEM" && <p>Entering…</p>}
        </div>

        {/* OPERATIONS MODE */}
        <div
          onClick={() => selectMode("OPERATIONS")}
          style={{
            padding: 24,
            width: 280,
            border: "1px solid #ccc",
            cursor: "pointer",
            opacity: loading && loading !== "OPERATIONS" ? 0.5 : 1,
          }}
        >
          <h3>Operations</h3>
          <p>Bookings, disputes, manual interventions</p>
          {loading === "OPERATIONS" && <p>Entering…</p>}
        </div>
      </div>
    </div>
  );
}