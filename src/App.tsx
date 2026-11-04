// frontend/src/App.tsx

import { useAuth } from "./hooks/useAuth";
import { Routes, Route, Navigate } from "react-router-dom";
import type { ReactNode } from "react";

import Home from "./pages/Home";
import Explore from "./pages/Explore";
import CreatorPublicProfile from "./pages/CreatorPublicProfile";

import IdentityRefreshListener from "./components/IdentityRefreshListener";

import Login from "./components/Login";
import Register from "./components/Register";
import AdminRoute from "./components/AdminRoute";
import AdminWorkspaceRoute from "./components/AdminWorkspaceRoute";
import {
  AuthenticatedRoute,
  CreatorRoute,
  UserRoute,
} from "./components/RouteGuards";
import ProfileVerificationQueue from "./pages/admin/ProfileVerificationQueue";
import AdminReviewQueue from "./pages/admin/AdminReviewQueue";
import EntryLoader from "./pages/EntryLoader";
import Onboarding from "./pages/Onboarding";

import CreatorApplication from "./pages/CreatorApplication";
import CreatorApplicationsQueue from "./pages/admin/CreatorApplicationsQueue";

import AdminEntry from "./pages/admin/AdminEntry";
import SystemDashboard from "./pages/admin/system/SystemDashboard";
import OperationsDashboard from "./pages/admin/operations/OperationsDashboard";
import AdminCoreOperationsPage from "./pages/admin/operations/AdminCoreOperationsPage";
import AdminRiskCenterPage from "./pages/admin/operations/AdminRiskCenterPage";
import AdminTopUpOperationsPage from "./features/adminTopUp/AdminTopUpOperationsPage";
import AdminWalletConversionOperationsPage from "./features/adminWalletConversion/AdminWalletConversionOperationsPage";
import AdminEscrowOperationsPage from "./features/adminEscrow/AdminEscrowOperationsPage";
import AdminPlatformRevenuePage from "./features/adminRevenue/AdminPlatformRevenuePage";
import AdminGovernancePage from "./features/adminGovernance/AdminGovernancePage";
import AdminSettlementOperationsPage from "./features/adminSettlement/AdminSettlementOperationsPage";
import AdminPaymentOperationsPage from "./features/adminPayment/AdminPaymentOperationsPage";
import AdminFxOperationsPage from "./features/adminFx/AdminFxOperationsPage";
import AdminDisputeOperationsPage from "./features/adminDispute/AdminDisputeOperationsPage";
import AdminAppealsPage from "./features/adminAppeal/AdminAppealsPage";
import ParticipantDisputeDetailPage from "./pages/ParticipantDisputeDetailPage";

/* Dashboards */
import UserDashboard from "./dashboards/UserDashboard";
import CreatorDashboard from "./dashboards/CreatorDashboard";
import AdminDashboard from "./dashboards/AdminDashboard";
import WalletBackfill from "./pages/admin/system/WalletBackfill";
import CreatorBrowse from "./dashboards/CreatorBrowse";
import UserBrowse from "./dashboards/UserBrowser";
import CreatorRequests from "./dashboards/CreatorRequests";
import CreatorBookingDetails from "./pages/CreatorBookingDetails";
import CreatorAvailability from "./dashboards/CreatorAvailability";
import CreatorServices from "./dashboards/CreatorServices";

/* BOOKINGS */
import CreatorBookings from "./pages/CreatorBookings";
import UserBookings from "./pages/UserBookings";

/* WALLET */
import UserWallet from "./pages/UserWallet";
import CreatorWallet from "./pages/CreatorWallet";
import CreatorPayoutDestinations from "./pages/CreatorPayoutDestinations";
import CreatorEarnings from "./pages/CreatorEarnings";

/* ✅ NEW: USER BOOKING DETAIL */
import UserBookingDetail from "./pages/UserBookingDetail";

/* Profiles */
import UserProfilePage from "./pages/profile/UserProfile";
import PublicUserProfile from "./pages/PublicUserProfile";
import CreatorProfile from "./pages/profile/CreatorProfile";

/* CHAT */
import MessagesPage from "./pages/MessagesPage";
import ChatPage from "./pages/ChatPage";
import AccountSettingsPage from "./pages/AccountSettingsPage";
import NotificationsPage from "./pages/NotificationsPage";

function OperationsAdminRoute({ children }: { children: ReactNode }) {
  return <AdminRoute><AdminWorkspaceRoute workspace="operations">{children}</AdminWorkspaceRoute></AdminRoute>;
}

function SystemAdminRoute({ children }: { children: ReactNode }) {
  return <AdminRoute><AdminWorkspaceRoute workspace="system">{children}</AdminWorkspaceRoute></AdminRoute>;
}

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <IdentityRefreshListener />

      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/creators/:slug" element={<CreatorPublicProfile />} />

        {/* AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ENTRY */}
        <Route path="/entry" element={<EntryLoader />} />

        {/* ONBOARDING */}
        <Route path="/onboarding" element={<AuthenticatedRoute><Onboarding /></AuthenticatedRoute>} />
        <Route path="/creator-application" element={<UserRoute><CreatorApplication /></UserRoute>} />

        <Route
          path="/admin/operations/creator-applications"
          element={
            <OperationsAdminRoute>
              <CreatorApplicationsQueue />
            </OperationsAdminRoute>
          }
        />

        {/* ADMIN */}
        <Route
          path="/admin/entry"
          element={
            <AdminRoute>
              <AdminEntry />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/system"
          element={
            <SystemAdminRoute>
              <SystemDashboard />
            </SystemAdminRoute>
          }
        />

        <Route
          path="/admin/operations"
          element={
            <OperationsAdminRoute>
              <OperationsDashboard />
            </OperationsAdminRoute>
          }
        />
        <Route path="/admin/operations/users" element={<OperationsAdminRoute><AdminCoreOperationsPage kind="users" /></OperationsAdminRoute>} />
        <Route path="/admin/operations/creators" element={<OperationsAdminRoute><AdminCoreOperationsPage kind="creators" /></OperationsAdminRoute>} />
        <Route path="/admin/operations/bookings" element={<OperationsAdminRoute><AdminCoreOperationsPage kind="bookings" /></OperationsAdminRoute>} />
        <Route path="/admin/operations/risk" element={<OperationsAdminRoute><AdminRiskCenterPage /></OperationsAdminRoute>} />
        <Route path="/admin/operations/control-plane" element={<OperationsAdminRoute><AdminDashboard /></OperationsAdminRoute>} />

        <Route
          path="/admin/operations/profile-verification"
          element={
            <OperationsAdminRoute>
              <ProfileVerificationQueue />
            </OperationsAdminRoute>
          }
        />
        <Route
          path="/admin/operations/profile-verification/admin-review"
          element={
            <OperationsAdminRoute>
              <AdminReviewQueue />
            </OperationsAdminRoute>
          }
        />
        <Route
          path="/admin/operations/wallet-top-ups"
          element={
            <OperationsAdminRoute>
              <AdminTopUpOperationsPage />
            </OperationsAdminRoute>
          }
        />
        <Route
          path="/admin/operations/wallet-top-ups/:topUpReference"
          element={
            <OperationsAdminRoute>
              <AdminTopUpOperationsPage />
            </OperationsAdminRoute>
          }
        />
        <Route path="/admin/operations/wallet-conversions" element={<OperationsAdminRoute><AdminWalletConversionOperationsPage /></OperationsAdminRoute>} />
        <Route path="/admin/operations/wallet-conversions/:conversionReference" element={<OperationsAdminRoute><AdminWalletConversionOperationsPage /></OperationsAdminRoute>} />
        <Route path="/admin/operations/booking-escrow" element={<OperationsAdminRoute><AdminEscrowOperationsPage /></OperationsAdminRoute>} />
        <Route path="/admin/operations/booking-escrow/:bookingReference" element={<OperationsAdminRoute><AdminEscrowOperationsPage /></OperationsAdminRoute>} />
        <Route path="/admin/operations/platform-revenue" element={<OperationsAdminRoute><AdminPlatformRevenuePage /></OperationsAdminRoute>} />
        <Route path="/admin/operations/settlements" element={<OperationsAdminRoute><AdminSettlementOperationsPage /></OperationsAdminRoute>} />
        <Route path="/admin/operations/settlements/:settlementReference" element={<OperationsAdminRoute><AdminSettlementOperationsPage /></OperationsAdminRoute>} />
        <Route path="/admin/operations/payments" element={<OperationsAdminRoute><AdminPaymentOperationsPage /></OperationsAdminRoute>} />
        <Route path="/admin/operations/payments/:paymentReference" element={<OperationsAdminRoute><AdminPaymentOperationsPage /></OperationsAdminRoute>} />
        <Route path="/admin/operations/fx-rates" element={<OperationsAdminRoute><AdminFxOperationsPage /></OperationsAdminRoute>} />
        <Route path="/admin/operations/governance" element={<OperationsAdminRoute><AdminGovernancePage /></OperationsAdminRoute>} />
        <Route path="/admin/operations/disputes" element={<OperationsAdminRoute><AdminDisputeOperationsPage /></OperationsAdminRoute>} />
        <Route path="/admin/operations/disputes/:disputeId" element={<OperationsAdminRoute><AdminDisputeOperationsPage /></OperationsAdminRoute>} />
        <Route path="/admin/operations/appeals" element={<OperationsAdminRoute><AdminAppealsPage /></OperationsAdminRoute>} />
        <Route path="/admin/operations/appeals/:appealId" element={<OperationsAdminRoute><AdminAppealsPage /></OperationsAdminRoute>} />
        <Route path="/admin/system/wallet-backfill" element={<SystemAdminRoute><WalletBackfill /></SystemAdminRoute>} />
        <Route path="/admin/notifications" element={<AdminRoute><NotificationsPage /></AdminRoute>} />

        {/* USER */}
        <Route path="/dashboard/user" element={<UserRoute><UserDashboard /></UserRoute>} />
        <Route path="/dashboard/user/bookings" element={<UserRoute><UserBookings /></UserRoute>} />

        {/* ✅ NEW: USER BOOKING DETAIL ROUTE */}
        <Route
          path="/dashboard/user/bookings/:bookingId"
          element={<UserRoute><UserBookingDetail /></UserRoute>}
        />

        <Route path="/dashboard/user/wallet" element={<UserRoute><UserWallet /></UserRoute>} />
        <Route path="/dashboard/user/settings" element={<UserRoute><Navigate to="/dashboard/user/settings/account" replace /></UserRoute>} />
        <Route path="/dashboard/user/settings/account" element={<UserRoute><AccountSettingsPage actor="user" section="account" /></UserRoute>} />
        <Route path="/dashboard/user/settings/creator" element={<UserRoute><AccountSettingsPage actor="user" section="creator" /></UserRoute>} />
        <Route path="/dashboard/user/settings/disputes" element={<UserRoute><AccountSettingsPage actor="user" section="disputes" /></UserRoute>} />
        <Route path="/dashboard/user/settings/disputes/:disputeId" element={<UserRoute><ParticipantDisputeDetailPage actor="user" /></UserRoute>} />
        <Route path="/dashboard/user/disputes" element={<UserRoute><Navigate to="/dashboard/user/settings/disputes" replace /></UserRoute>} />

        <Route path="/dashboard/user/messages" element={<UserRoute><MessagesPage /></UserRoute>} />
        <Route path="/dashboard/user/notifications" element={<UserRoute><NotificationsPage /></UserRoute>} />
        <Route path="/dashboard/user/browse" element={<UserRoute><UserBrowse /></UserRoute>} />

        {/* PROFILE */}
        <Route path="/profile" element={<UserRoute><UserProfilePage /></UserRoute>} />
        <Route path="/users/:userId" element={<PublicUserProfile />} />
        <Route path="/creator/profile" element={<CreatorRoute><CreatorProfile /></CreatorRoute>} />

        {/* CREATOR */}
        <Route path="/dashboard/creator" element={<CreatorRoute><CreatorDashboard /></CreatorRoute>} />

        <Route
          path="/dashboard/creator/bookings"
          element={<CreatorRoute><CreatorBookings /></CreatorRoute>}
        />

        <Route
          path="/dashboard/creator/bookings/:id"
          element={<CreatorRoute><CreatorBookingDetails /></CreatorRoute>}
        />

        <Route path="/dashboard/creator/messages" element={<CreatorRoute><MessagesPage /></CreatorRoute>} />
        <Route path="/dashboard/creator/notifications" element={<CreatorRoute><NotificationsPage /></CreatorRoute>} />

        <Route
          path="/dashboard/creator/services"
          element={<CreatorRoute><CreatorServices /></CreatorRoute>}
        />

        <Route path="/dashboard/creator/browse" element={<CreatorRoute><CreatorBrowse /></CreatorRoute>} />

        <Route
          path="/dashboard/creator/requests"
          element={<CreatorRoute><CreatorRequests /></CreatorRoute>}
        />

        <Route
          path="/dashboard/creator/availability"
          element={<CreatorRoute><CreatorAvailability /></CreatorRoute>}
        />

        <Route path="/dashboard/creator/wallet" element={<CreatorRoute><CreatorWallet /></CreatorRoute>} />
        <Route path="/dashboard/creator/payout-destinations" element={<CreatorRoute><CreatorPayoutDestinations /></CreatorRoute>} />
        <Route path="/dashboard/creator/earnings" element={<CreatorRoute><CreatorEarnings /></CreatorRoute>} />
        <Route path="/dashboard/creator/settings" element={<CreatorRoute><Navigate to="/dashboard/creator/settings/creator" replace /></CreatorRoute>} />
        <Route path="/dashboard/creator/settings/creator" element={<CreatorRoute><AccountSettingsPage actor="creator" section="creator" /></CreatorRoute>} />
        <Route path="/dashboard/creator/settings/disputes" element={<CreatorRoute><AccountSettingsPage actor="creator" section="disputes" /></CreatorRoute>} />
        <Route path="/dashboard/creator/settings/disputes/:disputeId" element={<CreatorRoute><ParticipantDisputeDetailPage actor="creator" /></CreatorRoute>} />
        <Route path="/dashboard/creator/disputes" element={<CreatorRoute><Navigate to="/dashboard/creator/settings/disputes" replace /></CreatorRoute>} />

        {/* CHAT */}
        <Route path="/dashboard/chat/:bookingId" element={<AuthenticatedRoute><ChatPage /></AuthenticatedRoute>} />

        {/* ADMIN DASHBOARD */}
        <Route path="/dashboard/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
