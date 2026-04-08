// frontend/src/pages/admin/ProfileVerificationQueue.tsx

import { useEffect, useState } from "react";
import api from "../../api/axios";

interface Profile {
  _id: string;
  username: string;
  dateOfBirth: string;
  bio: string;
  interests: string[];
  profilePhotos: string[];
  profileStatus: string;
  createdAt: string;
  userId: {
    _id: string;
    email: string;
  };
}

export default function ProfileVerificationQueue() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get(
        "/v1/admin/profile-verification/pending"
      );

      setProfiles(res.data.profiles || []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to fetch pending profiles"
      );
    } finally {
      setLoading(false);
    }
  };

  const approveProfile = async (profileId: string) => {
    try {
      await api.patch(
        `/v1/admin/profile-verification/${profileId}/approve`
      );
      await fetchProfiles();
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          "Failed to approve profile"
      );
    }
  };

  const rejectProfile = async (profileId: string) => {
    try {
      await api.patch(
        `/v1/admin/profile-verification/${profileId}/reject`
      );
      await fetchProfiles();
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          "Failed to reject profile"
      );
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  if (loading) {
    return <div>Loading pending profiles...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (profiles.length === 0) {
    return <div>No pending profile verifications.</div>;
  }

  return (
    <div>
      <h2>Pending Profile Verifications</h2>

      {profiles.map((profile) => (
        <div
          key={profile._id}
          style={{
            border: "1px solid #ccc",
            padding: "16px",
            marginBottom: "12px",
          }}
        >
          <p>
            <strong>Email:</strong>{" "}
            {profile.userId.email}
          </p>

          <p>
            <strong>Username:</strong>{" "}
            {profile.username}
          </p>

          <p>
            <strong>Bio:</strong> {profile.bio}
          </p>

          <p>
            <strong>Interests:</strong>{" "}
            {profile.interests.join(", ")}
          </p>

          <p>
            <strong>Status:</strong>{" "}
            {profile.profileStatus}
          </p>

          <button
            onClick={() =>
              approveProfile(profile._id)
            }
            style={{ marginRight: "8px" }}
          >
            Approve
          </button>

          <button
            onClick={() =>
              rejectProfile(profile._id)
            }
          >
            Reject
          </button>
        </div>
      ))}
    </div>
  );
}