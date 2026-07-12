// frontend/src/pages/admin/CreatorApplicationsQueue.tsx

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

interface CreatorApplication {
  _id: string;

  displayName: string;
  primaryCategory: string;

  country: string;
  city: string;

  currency: string;

  publicBio: string;

  services: string[];
  languages: string[];

  avatarUrl?: string | null;
  coverUrl?: string | null;
  media?: string[];

  status: string;

  submittedForReviewAt?: string | null;
  createdAt: string;

  userId: {
    _id: string;
    email: string;
  };
}
type ConfirmAction = "approve" | "reject" | null;

const PAGE_SIZE = 10;

export default function CreatorApplicationsQueue() {
  const [applications, setApplications] = useState<CreatorApplication[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);

  const [selectedApplication, setSelectedApplication] =
    useState<CreatorApplication | null>(null);

  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const [confirmApplication, setConfirmApplication] =
    useState<CreatorApplication | null>(null);

  const [rejectionReason, setRejectionReason] = useState("");

  const [reasonError, setReasonError] = useState("");

  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get(
        "/v1/admin/creator-applications?status=submitted",
      );

      setApplications(res.data.applications ?? []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Failed to fetch creator applications.",
      );
    } finally {
      setLoading(false);
    }
  };

  const approveApplication = async () => {
    if (!confirmApplication) return;

    try {
      setProcessingId(confirmApplication._id);

      await api.patch(
        `/v1/admin/creator-applications/${confirmApplication._id}/approve`,
      );

      await fetchApplications();

      if (selectedApplication?._id === confirmApplication._id) {
        setSelectedApplication(null);
      }

      setConfirmAction(null);
      setConfirmApplication(null);
    } catch (err: any) {
      alert(
        err?.response?.data?.message ??
          "Failed to approve creator application.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const rejectApplication = async () => {
    if (!confirmApplication) return;

    const trimmedReason = rejectionReason.trim();

    if (!trimmedReason) {
      setReasonError("Rejection reason is required.");
      return;
    }

    try {
      setProcessingId(confirmApplication._id);

      await api.patch(
        `/v1/admin/creator-applications/${confirmApplication._id}/reject`,
        {
          reason: trimmedReason,
        },
      );

      await fetchApplications();

      if (selectedApplication?._id === confirmApplication._id) {
        setSelectedApplication(null);
      }

      setReasonError("");
      setConfirmAction(null);
      setRejectionReason("");
      setConfirmApplication(null);
    } catch (err: any) {
      alert(
        err?.response?.data?.message ?? "Failed to reject creator application.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const filteredApplications = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return applications;

    return applications.filter((application) => {
      return (
        application.displayName.toLowerCase().includes(keyword) ||
        application.userId.email.toLowerCase().includes(keyword) ||
        application.primaryCategory.toLowerCase().includes(keyword) ||
        application.status.toLowerCase().includes(keyword)
      );
    });
  }, [applications, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredApplications.length / PAGE_SIZE),
  );

  const paginatedApplications = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;

    return filteredApplications.slice(start, start + PAGE_SIZE);
  }, [filteredApplications, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const metrics = useMemo(() => {
    const withAvatar = applications.filter(
      (application) => !!application.avatarUrl,
    ).length;

    const withMedia = applications.filter(
      (application) => (application.media?.length ?? 0) > 0,
    ).length;

    return {
      submitted: applications.length,
      withAvatar,
      withMedia,
    };
  }, [applications]);

  if (loading) {
    return (
      <AdminLayout workspace="operations">
        <AdminLoadingState
          title="Loading creator applications..."
          description="Fetching submitted creator applications."
        />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout workspace="operations">
        <div className="rounded-xl border border-red-900 bg-red-950/40 p-6">
          <h2 className="text-lg font-semibold text-red-300">
            Failed to load creator applications
          </h2>

          <p className="mt-2 text-sm text-red-200">{error}</p>

          <div className="mt-6">
            <AdminButton onClick={fetchApplications}>Retry</AdminButton>
          </div>
        </div>
      </AdminLayout>
    );
  }
  return (
    <AdminLayout workspace="operations">
      <>
        <div className="space-y-6">
          <AdminPageHeader
            title="Creator Applications"
            description="Review submitted creator applications before approving creators onto the platform."
          >
            <AdminButton onClick={fetchApplications}>Refresh Queue</AdminButton>
          </AdminPageHeader>

          <div className="grid gap-4 md:grid-cols-3">
            <AdminMetricCard
              label="Submitted Applications"
              value={metrics.submitted}
              subtitle="Pending admin approval"
            />

            <AdminMetricCard
              label="Applications With Avatar"
              value={metrics.withAvatar}
              subtitle="Creator profile image uploaded"
            />

            <AdminMetricCard
              label="Applications With Media"
              value={metrics.withMedia}
              subtitle="Portfolio media attached"
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
                  placeholder="Search by display name, email or category..."
                />

                <AdminFilterBar>
                  <span className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300">
                    Submitted: {metrics.submitted}
                  </span>

                  <span className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300">
                    Page {page} / {totalPages}
                  </span>
                </AdminFilterBar>
              </>
            }
          />

          {filteredApplications.length === 0 ? (
            <AdminEmptyState
              title="No submitted creator applications"
              description="There are currently no creator applications waiting for approval."
              action={
                <AdminButton onClick={fetchApplications}>Refresh</AdminButton>
              }
            />
          ) : (
            <>
              <AdminDataTable>
                <AdminTableHead>
                  <AdminTableRow>
                    <AdminTableHeaderCell>Applicant</AdminTableHeaderCell>

                    <AdminTableHeaderCell>Display Name</AdminTableHeaderCell>

                    <AdminTableHeaderCell>Category</AdminTableHeaderCell>

                    <AdminTableHeaderCell>Country</AdminTableHeaderCell>

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
                  {paginatedApplications.map((application) => (
                    <AdminTableRow
                      key={application._id}
                      selected={selectedApplication?._id === application._id}
                      onClick={() => setSelectedApplication(application)}
                    >
                      <AdminTableCell>
                        <div className="flex items-center gap-3">
                          <AdminAvatar
                            src={
                              application.avatarUrl ?? application.media?.[0]
                            }
                            name={application.displayName}
                            size="md"
                          />

                          <div className="min-w-0">
                            <div className="truncate font-medium text-white">
                              {application.userId.email}
                            </div>

                            <div className="truncate text-xs text-slate-500">
                              {application._id}
                            </div>
                          </div>
                        </div>
                      </AdminTableCell>

                      <AdminTableCell>
                        <span className="font-medium">
                          {application.displayName}
                        </span>
                      </AdminTableCell>

                      <AdminTableCell>
                        {application.primaryCategory}
                      </AdminTableCell>

                      <AdminTableCell>{application.country}</AdminTableCell>

                      <AdminTableCell>
                        {new Date(
                          application.submittedForReviewAt ??
                            application.createdAt,
                        ).toLocaleDateString()}
                      </AdminTableCell>

                      <AdminTableCell>
                        <AdminStatusBadge status={application.status} />
                      </AdminTableCell>

                      <AdminTableCell align="right">
                        <div
                          className="flex justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <AdminButton
                            variant="success"
                            loading={
                              processingId === application._id &&
                              confirmAction === "approve"
                            }
                            onClick={() => {
                              setConfirmApplication(application);
                              setConfirmAction("approve");
                            }}
                          >
                            Approve
                          </AdminButton>

                          <AdminButton
                            variant="danger"
                            loading={
                              processingId === application._id &&
                              confirmAction === "reject"
                            }
                            onClick={() => {
                              setConfirmApplication(application);
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
                totalItems={filteredApplications.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
        <AdminDetailPanel
          open={selectedApplication !== null}
          onClose={() => setSelectedApplication(null)}
          title={selectedApplication?.displayName ?? "Creator Application"}
          subtitle={selectedApplication?.userId.email}
          footer={
            selectedApplication && (
              <div className="flex justify-end gap-3">
                <AdminButton
                  variant="success"
                  loading={
                    processingId === selectedApplication._id &&
                    confirmAction === "approve"
                  }
                  onClick={() => {
                    setConfirmApplication(selectedApplication);
                    setConfirmAction("approve");
                  }}
                >
                  Approve Application
                </AdminButton>

                <AdminButton
                  variant="danger"
                  loading={
                    processingId === selectedApplication._id &&
                    confirmAction === "reject"
                  }
                  onClick={() => {
                    setConfirmApplication(selectedApplication);
                    setRejectionReason("");
                    setReasonError("");
                    setConfirmAction("reject");
                  }}
                >
                  Reject Application
                </AdminButton>
              </div>
            )
          }
        >
          {selectedApplication && (
            <div className="space-y-6">
              {selectedApplication.coverUrl && (
                <img
                  src={selectedApplication.coverUrl}
                  alt={`${selectedApplication.displayName} cover`}
                  className="h-48 w-full rounded-xl border border-slate-800 object-cover"
                />
              )}

              <div className="flex items-center gap-4">
                <AdminAvatar
                  src={
                    selectedApplication.avatarUrl ??
                    selectedApplication.media?.[0]
                  }
                  name={selectedApplication.displayName}
                  size="lg"
                />

                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {selectedApplication.displayName}
                  </h3>

                  <p className="text-sm text-slate-400">
                    {selectedApplication.userId.email}
                  </p>

                  <div className="mt-3">
                    <AdminStatusBadge status={selectedApplication.status} />
                  </div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Primary Category
                  </p>

                  <p className="text-sm text-slate-200">
                    {selectedApplication.primaryCategory}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Submitted for Review
                  </p>

                  <p className="text-sm text-slate-200">
                    {new Date(
                      selectedApplication.submittedForReviewAt ??
                        selectedApplication.createdAt,
                    ).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Country
                  </p>

                  <p className="text-sm text-slate-200">
                    {selectedApplication.country}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    City
                  </p>

                  <p className="text-sm text-slate-200">
                    {selectedApplication.city}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Currency
                  </p>

                  <p className="text-sm text-slate-200">
                    {selectedApplication.currency}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Languages
                  </p>

                  {selectedApplication.languages.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedApplication.languages.map((language) => (
                        <span
                          key={language}
                          className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300"
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      No languages provided.
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Services
                  </p>

                  {selectedApplication.services.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedApplication.services.map((service) => (
                        <span
                          key={service}
                          className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      No services listed.
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Public Bio
                  </p>

                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">
                    {selectedApplication.publicBio}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Media Gallery
                  </p>
                  {selectedApplication.media &&
                  selectedApplication.media.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {selectedApplication.media.map((image, index) => (
                        <img
                          key={`${image}-${index}`}
                          src={image}
                          alt={`${selectedApplication.displayName}-${index}`}
                          className="aspect-square rounded-xl border border-slate-800 object-cover"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No media uploaded.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </AdminDetailPanel>

        <AdminConfirmDialog
          open={confirmAction === "approve" && confirmApplication !== null}
          title="Approve Creator Application"
          description={`Are you sure you want to approve ${confirmApplication?.displayName}'s creator application?`}
          confirmText="Approve"
          cancelText="Cancel"
          confirmVariant="primary"
          loading={processingId === confirmApplication?._id}
          onConfirm={approveApplication}
          onCancel={() => {
            if (processingId) return;

            setConfirmAction(null);
            setConfirmApplication(null);
          }}
        />

        <AdminRejectDialog
          open={confirmAction === "reject" && confirmApplication !== null}
          title="Reject Creator Application"
          description={`Provide a clear reason why ${confirmApplication?.displayName}'s creator application is being rejected.`}
          value={rejectionReason}
          error={reasonError}
          loading={processingId === confirmApplication?._id}
          onChange={(value) => {
            setRejectionReason(value);

            if (reasonError) {
              setReasonError("");
            }
          }}
          onConfirm={rejectApplication}
          onCancel={() => {
            if (processingId) return;

            setConfirmAction(null);
            setConfirmApplication(null);
            setRejectionReason("");
            setReasonError("");
          }}
        />
      </>
    </AdminLayout>
  );
}
