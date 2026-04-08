// frontend/src/pages/admin/CreatorApplicationsQueue.tsx

import { useEffect, useState } from "react";
import api from "../../api/axios";

interface CreatorApplication {
  _id: string;
  status: string;
  createdAt: string;
  slug: string;
  displayName: string;
  primaryCategory: string;
  userId: {
    _id: string;
    email: string;
  };
}

export default function CreatorApplicationsQueue() {
  const [applications, setApplications] = useState<CreatorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get(
        "/v1/admin/creator-applications?status=submitted"
      );

      setApplications(res.data.applications || []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to fetch creator applications"
      );
    } finally {
      setLoading(false);
    }
  };

  const approveApplication = async (applicationId: string) => {
    try {
      await api.patch(
        `/v1/admin/creator-applications/${applicationId}/approve`
      );

      // Refetch after approval
      await fetchApplications();
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          "Failed to approve application"
      );
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  if (loading) {
    return <div>Loading creator applications...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (applications.length === 0) {
    return <div>No submitted creator applications.</div>;
  }

  return (
    <div>
      <h2>Submitted Creator Applications</h2>

      {applications.map((app) => (
        <div
          key={app._id}
          style={{
            border: "1px solid #ccc",
            padding: "16px",
            marginBottom: "12px",
          }}
        >
          <p>
            <strong>Email:</strong> {app.userId.email}
          </p>

          <p>
            <strong>Display Name:</strong> {app.displayName}
          </p>

          <p>
            <strong>Slug:</strong> {app.slug}
          </p>

          <p>
            <strong>Category:</strong> {app.primaryCategory}
          </p>

          <p>
            <strong>Status:</strong> {app.status}
          </p>

          <button
            onClick={() => approveApplication(app._id)}
          >
            Approve
          </button>
        </div>
      ))}
    </div>
  );
}