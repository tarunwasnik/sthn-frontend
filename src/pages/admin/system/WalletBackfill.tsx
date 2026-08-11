// frontend/src/pages/admin/system/WalletBackfill.tsx

import { useCallback, useEffect, useState } from "react";
import { Wallet, Users, BadgeCheck } from "lucide-react";

import AdminLayout from "../../../components/admin/layout/AdminLayout";
import AdminPageHeader from "../../../components/admin/layout/AdminPageHeader";
import AdminMetricCard from "../../../components/admin/layout/AdminMetricCard";

import AdminLoadingState from "../../../components/admin/feedback/AdminLoadingState";
import AdminEmptyState from "../../../components/admin/feedback/AdminEmptyState";
import AdminConfirmDialog from "../../../components/admin/feedback/AdminConfirmDialog";

import AdminButton from "../../../components/admin/common/AdminButton";

import {
  getWalletBackfillPreview,
  runWalletBackfill,
} from "../../../api/adminWallet.api";

/* ============================================================
   Types
============================================================ */

interface WalletBackfillPreview {
  verifiedUsers: number;
  wallets: number;
  missingWallets: number;
}

interface WalletBackfillResult {
  success: boolean;
  message: string;
  data: unknown;
}

/* ============================================================
   Component
============================================================ */

export default function WalletBackfill() {
  /* ============================================================
     State
  ============================================================ */

  const [preview, setPreview] = useState<WalletBackfillPreview | null>(null);

  const [loading, setLoading] = useState(true);

  const [running, setRunning] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);

  const [result, setResult] = useState<WalletBackfillResult | null>(null);

  /* ============================================================
     Preview Loader
  ============================================================ */

  const loadPreview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getWalletBackfillPreview();

      setPreview(response);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Failed to load wallet backfill preview.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* ============================================================
     Initial Load
  ============================================================ */

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  /* ============================================================
     Execute Backfill
  ============================================================ */

  const handleExecute = async () => {
    try {
      setRunning(true);

      const response = await runWalletBackfill();

      setResult(response);

      setConfirmOpen(false);

      await loadPreview();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Failed to execute wallet backfill.",
      );
    } finally {
      setRunning(false);
    }
  };

  /* ============================================================
     Render
  ============================================================ */

  return (
    <AdminLayout workspace="system">
      <AdminPageHeader
        title="Wallet Backfill"
        description="Create wallets for verified users that do not already have one."
      />

      {/* ============================================================
          Loading
      ============================================================ */}

      {loading ? (
        <AdminLoadingState
          title="Loading Wallet Backfill"
          description="Preparing wallet backfill preview..."
        />
      ) : error ? (
        /* ============================================================
            Error
        ============================================================ */
        <AdminEmptyState
          title="Unable to Load Wallet Backfill"
          description={error}
          action={<AdminButton onClick={loadPreview}>Try Again</AdminButton>}
        />
      ) : (
        <>
          {/* ============================================================
              Metrics
          ============================================================ */}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <AdminMetricCard
              label="Verified Users"
              value={preview?.verifiedUsers ?? 0}
              subtitle="Verified profiles eligible for wallet ownership."
              icon={<BadgeCheck size={22} />}
            />

            <AdminMetricCard
              label="Existing Wallets"
              value={preview?.wallets ?? 0}
              subtitle="Wallets currently present in the system."
              icon={<Wallet size={22} />}
            />

            <AdminMetricCard
              label="Missing Wallets"
              value={preview?.missingWallets ?? 0}
              subtitle="Verified users that still require wallet creation."
              icon={<Users size={22} />}
            />
          </div>

          {/* ============================================================
              Preview
          ============================================================ */}

          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900">
            <div className="border-b border-slate-800 px-6 py-5">
              <h2 className="text-lg font-semibold text-white">
                Wallet Backfill Preview
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Review the current wallet status before executing the backfill
                operation. Only verified users without an existing wallet will
                receive one.
              </p>
            </div>

            <div className="p-6">
              {preview?.missingWallets === 0 ? (
                <AdminEmptyState
                  title="Wallet Backfill Not Required"
                  description="All verified users already have wallets. No administrative action is required."
                />
              ) : (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
                  <h3 className="text-base font-semibold text-white">
                    Backfill Summary
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    The system has identified{" "}
                    <span className="font-semibold text-white">
                      {preview?.missingWallets}
                    </span>{" "}
                    verified
                    {preview?.missingWallets === 1 ? " user" : " users"} without
                    a wallet. Running the backfill will create wallets only for
                    these users. Existing wallets will automatically be skipped.
                  </p>
                </div>
              )}
            </div>
          </div>
          {/* ============================================================
              Execute Wallet Backfill
          ============================================================ */}

          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900">
            <div className="border-b border-slate-800 px-6 py-5">
              <h2 className="text-lg font-semibold text-white">
                Execute Wallet Backfill
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                This operation will create wallets only for verified users that
                do not already own one. Existing wallets will never be modified
                or recreated.
              </p>
            </div>

            <div className="space-y-6 p-6">
              <div className="rounded-xl border border-amber-600/30 bg-amber-500/10 p-5">
                <h3 className="text-sm font-semibold text-amber-300">
                  Before You Continue
                </h3>

                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-amber-100/90">
                  <li>Only verified users are processed.</li>
                  <li>Existing wallets are skipped automatically.</li>
                  <li>No wallet balances are modified.</li>
                  <li>This operation is safe to execute multiple times.</li>
                </ul>
              </div>

              <div className="flex flex-col gap-6 rounded-xl border border-slate-800 bg-slate-950 p-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Ready to Execute
                  </h3>

                  <p className="mt-2 text-sm text-slate-400">
                    {preview?.missingWallets ?? 0} wallet
                    {(preview?.missingWallets ?? 0) !== 1 ? "s" : ""} will be
                    created. Existing wallets will automatically be skipped.
                  </p>
                </div>

                <AdminButton
                  variant="primary"
                  loading={running}
                  disabled={running || !preview || preview.missingWallets === 0}
                  onClick={() => setConfirmOpen(true)}
                >
                  Run Wallet Backfill
                </AdminButton>
              </div>

              {result && (
                <div className="rounded-xl border border-emerald-700 bg-emerald-500/10 p-5">
                  <h3 className="text-base font-semibold text-emerald-300">
                    Backfill Completed
                  </h3>

                  <p className="mt-2 text-sm text-emerald-100">
                    {result.message}
                  </p>

                  <div className="rounded-xl border border-emerald-700 bg-emerald-500/10 p-6">
                    <h3 className="text-lg font-semibold text-emerald-300">
                      Wallet Backfill Completed
                    </h3>

                    <p className="mt-2 text-sm text-emerald-100">
                      {result.message}
                    </p>

                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                      <div className="rounded-lg border border-emerald-700/40 bg-slate-950 p-4">
                        <p className="text-xs uppercase text-slate-400">
                          Success
                        </p>

                        <p className="mt-2 text-xl font-bold text-white">Yes</p>
                      </div>

                      <div className="rounded-lg border border-emerald-700/40 bg-slate-950 p-4">
                        <p className="text-xs uppercase text-slate-400">
                          Operation
                        </p>

                        <p className="mt-2 text-xl font-bold text-white">
                          Wallet Backfill
                        </p>
                      </div>

                      <div className="rounded-lg border border-emerald-700/40 bg-slate-950 p-4">
                        <p className="text-xs uppercase text-slate-400">
                          Status
                        </p>

                        <p className="mt-2 text-xl font-bold text-emerald-400">
                          Completed
                        </p>
                      </div>
                    </div>

                    <details className="mt-6">
                      <summary className="cursor-pointer text-sm text-slate-300">
                        Technical Response
                      </summary>

                      <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-300">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <AdminConfirmDialog
        open={confirmOpen}
        title="Run Wallet Backfill"
        description="This will create wallets for every verified user who does not already have one. Existing wallets will be skipped."
        confirmText="Run Backfill"
        cancelText="Cancel"
        loading={running}
        onConfirm={handleExecute}
        onCancel={() => {
          if (!running) {
            setConfirmOpen(false);
          }
        }}
      />
    </AdminLayout>
  );
}
