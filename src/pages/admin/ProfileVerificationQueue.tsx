// frontend/src/pages/admin/ProfileVerificationQueue.tsx

import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

import AdminLayout from "../../components/admin/layout/AdminLayout";
import AdminPageHeader from "../../components/admin/layout/AdminPageHeader";
import AdminMetricCard from "../../components/admin/layout/AdminMetricCard";
import AdminToolbar from "../../components/admin/layout/AdminToolbar";

import AdminAvatar from "../../components/admin/common/AdminAvatar";
import AdminButton from "../../components/admin/common/AdminButton";
import AdminFilterBar from "../../components/admin/common/AdminFilterBar";
import AdminSearch from "../../components/admin/common/AdminSearch";

import AdminDataTable, {
  AdminTableHead,
  AdminTableBody,
  AdminTableRow,
  AdminTableHeaderCell,
  AdminTableCell,
} from "../../components/admin/table/AdminDataTable";

import AdminStatusBadge from "../../components/admin/table/AdminStatusBadge";
import AdminPagination from "../../components/admin/table/AdminPagination";

import AdminDetailPanel from "../../components/admin/panel/AdminDetailPanel";

import AdminLoadingState from "../../components/admin/feedback/AdminLoadingState";
import AdminEmptyState from "../../components/admin/feedback/AdminEmptyState";
import AdminConfirmDialog from "../../components/admin/feedback/AdminConfirmDialog";
import AdminRejectDialog from "../../components/admin/feedback/AdminRejectDialog";

interface Profile {
  _id: string;
  username: string;
  dateOfBirth: string;
  bio: string;

  avatar: string;
  cover: string;

  interests: string[];
  profilePhotos: string[];

  profileStatus: string;
  verificationSubmittedAt?: string | null;
  createdAt: string;

  userId: {
    _id: string;
    email: string;
  };
}

type ConfirmAction = "approve" | "reject" | null;

const PAGE_SIZE = 10;

export default function ProfileVerificationQueue() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [processingId, setProcessingId] = useState<string | null>(null);

  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const [confirmProfile, setConfirmProfile] = useState<Profile | null>(null);

  const [rejectionReason, setRejectionReason] = useState("");

  const [reasonError, setReasonError] = useState("");

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get("/v1/admin/profile-verification/pending");

      setProfiles(res.data.profiles ?? []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Failed to load pending user verifications.",
      );
    } finally {
      setLoading(false);
    }
  };

  const approveProfile = async () => {
    if (!confirmProfile) return;

    try {
      setProcessingId(confirmProfile._id);

      await api.patch(
        `/v1/admin/profile-verification/${confirmProfile._id}/approve`,
      );

      await fetchProfiles();

      if (selectedProfile?._id === confirmProfile._id) {
        setSelectedProfile(null);
      }

      setConfirmAction(null);
      setConfirmProfile(null);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Failed to approve user.");
    } finally {
      setProcessingId(null);
    }
  };

  const rejectProfile = async () => {
    if (!confirmProfile) return;

    const trimmedReason = rejectionReason.trim();

    if (!trimmedReason) {
      setReasonError("Rejection reason is required.");
      return;
    }

    try {
      setProcessingId(confirmProfile._id);

      await api.patch(
        `/v1/admin/profile-verification/${confirmProfile._id}/reject`,
        {
          reason: trimmedReason,
        },
      );

      await fetchProfiles();

      if (selectedProfile?._id === confirmProfile._id) {
        setSelectedProfile(null);
      }

      setReasonError("");
      setConfirmAction(null);
      setRejectionReason("");
      setConfirmProfile(null);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Failed to reject user.");
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const filteredProfiles = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return profiles;

    return profiles.filter((profile) => {
      return (
        profile.username.toLowerCase().includes(keyword) ||
        profile.userId.email.toLowerCase().includes(keyword) ||
        profile.profileStatus.toLowerCase().includes(keyword)
      );
    });
  }, [profiles, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProfiles.length / PAGE_SIZE),
  );

  const paginatedProfiles = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;

    return filteredProfiles.slice(start, start + PAGE_SIZE);
  }, [filteredProfiles, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const metrics = useMemo(() => {
    const withAvatar = profiles.filter((p) => !!p.avatar).length;

    const withGallery = profiles.filter(
      (p) => p.profilePhotos.length > 0,
    ).length;

    return {
      pending: profiles.length,
      withAvatar,
      withGallery,
    };
  }, [profiles]);

  if (loading) {
    return (
      <AdminLayout workspace="operations">
        <AdminLoadingState
          title="Loading user verification queue..."
          description="Fetching pending user verification requests."
        />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout workspace="operations">
        <div className="rounded-xl border border-red-900 bg-red-950/40 p-6">
          <h2 className="text-lg font-semibold text-red-300">
            Failed to load user verification queue
          </h2>

          <p className="mt-2 text-sm text-red-200">{error}</p>

          <div className="mt-6">
            <AdminButton onClick={fetchProfiles}>Retry</AdminButton>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout workspace="operations">
      <div className="space-y-6">
        <AdminPageHeader
          title="User Verification"
          description="Review, inspect and process pending user verification requests."
        >
          <AdminButton onClick={fetchProfiles}>Refresh Queue</AdminButton>
        </AdminPageHeader>

        <div className="grid gap-4 md:grid-cols-3">
          <AdminMetricCard
            label="Pending Users"
            value={metrics.pending}
            subtitle="Awaiting verification review"
          />

          <AdminMetricCard
            label="Users With Avatar"
            value={metrics.withAvatar}
            subtitle="Primary profile image uploaded"
          />

          <AdminMetricCard
            label="Users With Gallery"
            value={metrics.withGallery}
            subtitle="Gallery images available"
          />
        </div>

        <AdminToolbar
          left={
            <>
              <AdminSearch
                value={search}
                onChange={(value) => {
                  setSearch(value);
                  setPage(1);
                }}
                placeholder="Search username, email or status..."
              />

              <AdminFilterBar>
                <span className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300">
                  Pending: {metrics.pending}
                </span>

                <span className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300">
                  Page {page} / {totalPages}
                </span>
              </AdminFilterBar>
            </>
          }
        />

        {filteredProfiles.length === 0 ? (
          <AdminEmptyState
            title="No pending user verifications"
            description="There are currently no users waiting for verification review."
            action={<AdminButton onClick={fetchProfiles}>Refresh</AdminButton>}
          />
        ) : (
          <>
            <AdminDataTable>
              <AdminTableHead>
                <AdminTableRow>
                  <AdminTableHeaderCell>Profile</AdminTableHeaderCell>

                  <AdminTableHeaderCell>Username</AdminTableHeaderCell>

                  <AdminTableHeaderCell>Bio</AdminTableHeaderCell>

                  <AdminTableHeaderCell>Interests</AdminTableHeaderCell>

                  <AdminTableHeaderCell>
                    Submitted for Review
                  </AdminTableHeaderCell>

                  <AdminTableHeaderCell>Status</AdminTableHeaderCell>

                  <AdminTableHeaderCell align="right">
                    Actions
                  </AdminTableHeaderCell>
                </AdminTableRow>
              </AdminTableHead>

              <AdminTableBody>
                {paginatedProfiles.map((profile) => (
                  <AdminTableRow
                    key={profile._id}
                    selected={selectedProfile?._id === profile._id}
                    onClick={() => setSelectedProfile(profile)}
                  >
                    <AdminTableCell>
                      <div className="flex items-center gap-3">
                        <AdminAvatar
                          src={profile.avatar || profile.profilePhotos[0]}
                          name={profile.username}
                          size="md"
                        />

                        <div className="min-w-0">
                          <div className="truncate font-medium text-white">
                            {profile.userId.email}
                          </div>

                          <div className="truncate text-xs text-slate-500">
                            {profile._id}
                          </div>
                        </div>
                      </div>
                    </AdminTableCell>

                    <AdminTableCell>
                      <span className="font-medium">{profile.username}</span>
                    </AdminTableCell>

                    <AdminTableCell className="max-w-sm">
                      <div className="line-clamp-2 text-slate-300">
                        {profile.bio || "-"}
                      </div>
                    </AdminTableCell>

                    <AdminTableCell>
                      {profile.interests.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profile.interests.map((interest) => (
                            <span
                              key={interest}
                              className="rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </AdminTableCell>

                    <AdminTableCell>
                      {new Date(
                        profile.verificationSubmittedAt ?? profile.createdAt,
                      ).toLocaleDateString()}
                    </AdminTableCell>

                    <AdminTableCell>
                      <AdminStatusBadge status={profile.profileStatus} />
                    </AdminTableCell>

                    <AdminTableCell align="right">
                      <div
                        className="flex justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <AdminButton
                          variant="success"
                          loading={
                            processingId === profile._id &&
                            confirmAction === "approve"
                          }
                          onClick={() => {
                            setConfirmProfile(profile);
                            setConfirmAction("approve");
                          }}
                        >
                          Approve
                        </AdminButton>

                        <AdminButton
                          variant="danger"
                          loading={
                            processingId === profile._id &&
                            confirmAction === "reject"
                          }
                          onClick={() => {
                            setConfirmProfile(profile);
                            setRejectionReason("");
                            setReasonError("");
                            setConfirmAction("reject");
                          }}
                        >
                          Reject
                        </AdminButton>
                      </div>
                    </AdminTableCell>
                  </AdminTableRow>
                ))}
              </AdminTableBody>
            </AdminDataTable>

            <AdminPagination
              page={page}
              totalPages={totalPages}
              totalItems={filteredProfiles.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <AdminDetailPanel
        open={selectedProfile !== null}
        onClose={() => setSelectedProfile(null)}
        title={selectedProfile?.username ?? "User"}
        subtitle={selectedProfile?.userId.email}
        footer={
          selectedProfile && (
            <div className="flex justify-end gap-3">
              <AdminButton
                variant="success"
                loading={
                  processingId === selectedProfile._id &&
                  confirmAction === "approve"
                }
                onClick={() => {
                  setConfirmProfile(selectedProfile);
                  setConfirmAction("approve");
                }}
              >
                Approve User
              </AdminButton>

              <AdminButton
                variant="danger"
                loading={
                  processingId === selectedProfile._id &&
                  confirmAction === "reject"
                }
                onClick={() => {
                  setConfirmProfile(selectedProfile);
                  setRejectionReason("");
                  setReasonError("");
                  setConfirmAction("reject");
                }}
              >
                Reject User
              </AdminButton>
            </div>
          )
        }
      >
        {selectedProfile && (
          <div className="space-y-6">
            {selectedProfile.cover && (
              <img
                src={selectedProfile.cover}
                alt={`${selectedProfile.username} cover`}
                className="h-44 w-full rounded-xl border border-slate-800 object-cover"
              />
            )}

            <div className="flex items-center gap-4">
              <AdminAvatar
                src={selectedProfile.avatar || selectedProfile.profilePhotos[0]}
                name={selectedProfile.username}
                size="lg"
              />

              <div>
                <h3 className="text-xl font-semibold text-white">
                  {selectedProfile.username}
                </h3>

                <p className="text-sm text-slate-400">
                  {selectedProfile.userId.email}
                </p>

                <div className="mt-3">
                  <AdminStatusBadge status={selectedProfile.profileStatus} />
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date of Birth
                </p>

                <p className="text-sm text-slate-200">
                  {new Date(selectedProfile.dateOfBirth).toLocaleDateString()}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Submitted for Review
                </p>

                <p className="text-sm text-slate-200">
                  {new Date(
                    selectedProfile.verificationSubmittedAt ??
                      selectedProfile.createdAt,
                  ).toLocaleString()}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Biography
              </p>

              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">
                {selectedProfile.bio || "No biography provided."}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Interests
              </p>

              {selectedProfile.interests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedProfile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No interests provided.</p>
              )}
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Gallery
              </p>

              {selectedProfile.profilePhotos.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {selectedProfile.profilePhotos.map((photo, index) => (
                    <img
                      key={`${photo}-${index}`}
                      src={photo}
                      alt={`${selectedProfile.username}-${index}`}
                      className="aspect-square rounded-xl border border-slate-800 object-cover"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No gallery images uploaded.
                </p>
              )}
            </div>
          </div>
        )}
      </AdminDetailPanel>

      <AdminConfirmDialog
        open={confirmAction === "approve" && confirmProfile !== null}
        title="Approve User Verification"
        description={`Are you sure you want to approve ${confirmProfile?.username}'s user verification?`}
        confirmText="Approve"
        cancelText="Cancel"
        confirmVariant="primary"
        loading={processingId === confirmProfile?._id}
        onConfirm={approveProfile}
        onCancel={() => {
          if (processingId) return;

          setConfirmAction(null);
          setConfirmProfile(null);
        }}
      />

      <AdminRejectDialog
        open={confirmAction === "reject" && confirmProfile !== null}
        title="Reject User Verification"
        description={`Provide a clear reason why ${confirmProfile?.username}'s user verification is being rejected.`}
        value={rejectionReason}
        error={reasonError}
        loading={processingId === confirmProfile?._id}
        onChange={(value) => {
          setRejectionReason(value);

          if (reasonError) {
            setReasonError("");
          }
        }}
        onConfirm={rejectProfile}
        onCancel={() => {
          if (processingId) return;

          setConfirmAction(null);
          setConfirmProfile(null);
          setRejectionReason("");
          setReasonError("");
        }}
      />
    </AdminLayout>
  );
}
