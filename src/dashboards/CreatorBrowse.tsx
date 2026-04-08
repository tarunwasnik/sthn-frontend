// frontend/src/dashboards/CreatorBrowse.tsx

import DashboardLayout from "../layouts/DashboardLayout";
import CreatorListing from "../components/creator-listing/CreatorListing";

export default function CreatorBrowse() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-white">
          Browse Creators
        </h1>

        <CreatorListing />
      </div>
    </DashboardLayout>
  );
}