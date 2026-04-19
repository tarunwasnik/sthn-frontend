// frontend/src/App.tsx

import { useAuth } from "./context/AuthContext";
import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Explore from "./pages/Explore";
import CreatorPublicProfile from "./pages/CreatorPublicProfile";

import Login from "./components/Login";
import Register from "./components/Register";
import AdminRoute from "./components/AdminRoute";
import ProfileVerificationQueue from "./pages/admin/ProfileVerificationQueue";
import EntryLoader from "./pages/EntryLoader";
import Onboarding from "./pages/Onboarding";

import CreatorApplication from "./pages/CreatorApplication";
import CreatorApplicationsQueue from "./pages/admin/CreatorApplicationsQueue";

import AdminEntry from "./pages/admin/AdminEntry";
import SystemDashboard from "./pages/admin/system/SystemDashboard";
import OperationsDashboard from "./pages/admin/operations/OperationsDashboard";

/* Dashboards */
import UserDashboard from "./dashboards/UserDashboard";
import CreatorDashboard from "./dashboards/CreatorDashboard";
import AdminDashboard from "./dashboards/AdminDashboard";
import CreatorBrowse from "./dashboards/CreatorBrowse";
import UserBrowse from "./dashboards/UserBrowser";
import CreatorRequests from "./dashboards/CreatorRequests";
import CreatorBookingDetails from "./pages/CreatorBookingDetails";
import CreatorAvailability from "./dashboards/CreatorAvailability";
import CreatorServices from "./dashboards/CreatorServices";

/* BOOKINGS */
import CreatorBookings from "./pages/CreatorBookings";
import UserBookings from "./pages/UserBookings";

/* ✅ NEW: USER BOOKING DETAIL */
import UserBookingDetail from "./pages/UserBookingDetail";

/* Profiles */
import UserProfilePage from "./pages/profile/UserProfile";
import PublicUserProfile from "./pages/PublicUserProfile";
import CreatorProfile from "./pages/profile/CreatorProfile";

/* CHAT */
import MessagesPage from "./pages/MessagesPage";
import ChatPage from "./pages/ChatPage";

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
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/creator-application" element={<CreatorApplication />} />

      <Route
        path="/admin/creator-applications"
        element={
          <AdminRoute>
            <CreatorApplicationsQueue />
          </AdminRoute>
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
          <AdminRoute>
            <SystemDashboard />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/operations"
        element={
          <AdminRoute>
            <OperationsDashboard />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/profile-verification"
        element={
          <AdminRoute>
            <ProfileVerificationQueue />
          </AdminRoute>
        }
      />

      {/* USER */}
      <Route path="/dashboard/user" element={<UserDashboard />} />
      <Route path="/dashboard/user/bookings" element={<UserBookings />} />

      {/* ✅ NEW: USER BOOKING DETAIL ROUTE */}
      <Route
        path="/dashboard/user/bookings/:bookingId"
        element={<UserBookingDetail />}
      />

      <Route path="/dashboard/user/messages" element={<MessagesPage />} />
      <Route path="/dashboard/user/browse" element={<UserBrowse />} />

      {/* PROFILE */}
      <Route path="/profile" element={<UserProfilePage />} />
      <Route path="/users/:userId" element={<PublicUserProfile />} />
      <Route path="/creator/profile" element={<CreatorProfile />} />

      {/* CREATOR */}
      <Route path="/dashboard/creator" element={<CreatorDashboard />} />

      <Route
        path="/dashboard/creator/bookings"
        element={<CreatorBookings />}
      />

      <Route
        path="/dashboard/creator/bookings/:id"
        element={<CreatorBookingDetails />}
      />

      <Route
        path="/dashboard/creator/messages"
        element={<MessagesPage />}
      />

      <Route
        path="/dashboard/creator/services"
        element={<CreatorServices />}
      />

      <Route
        path="/dashboard/creator/browse"
        element={<CreatorBrowse />}
      />

      <Route
        path="/dashboard/creator/requests"
        element={<CreatorRequests />}
      />

      <Route
        path="/dashboard/creator/availability"
        element={<CreatorAvailability />}
      />

      {/* CHAT */}
      <Route
        path="/dashboard/chat/:bookingId"
        element={<ChatPage />}
      />

      
      {/* ADMIN DASHBOARD */}
      <Route path="/dashboard/admin" element={<AdminDashboard />} />

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" />} />

    </Routes>
  );
}