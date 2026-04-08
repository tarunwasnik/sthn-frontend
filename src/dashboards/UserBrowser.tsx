// frontend/src/dashboards/UserBrowse.tsx

import UserDashboardLayout from "../layouts/UserDashboardLayout";
import CreatorListing from "../components/creator-listing/CreatorListing";

export default function UserBrowse() {
  return (
    <UserDashboardLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-white">
          Browse Creators
        </h1>

        <CreatorListing />
      </div>
    </UserDashboardLayout>
  );
}