// frontend/src/components/creator-listing/CreatorListing.tsx

import { useEffect, useState } from "react";
import { fetchCreators } from "../../api/public";
import type {
  CreatorPublicCardDTO,
  CreatorListingResponseDTO,
} from "../../api/public";
import CreatorCard from "../CreatorCard";

type CreatorListingProps = {
  pageSize?: number;
};

export default function CreatorListing({
  pageSize = 12,
}: CreatorListingProps) {
  const [creators, setCreators] = useState<CreatorPublicCardDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const loadCreators = async () => {
      try {
        setLoading(true);

        const response: CreatorListingResponseDTO =
          await fetchCreators({
            page,
            limit: pageSize,
          });

          console.log("CREATOR RESPONSE", response);

        setCreators(response.data);
        setTotalPages(response.pagination.totalPages);
      } catch (err) {
        console.error("Failed to fetch creators", err);
      } finally {
        setLoading(false);
      }
    };

    loadCreators();
  }, [page, pageSize]);

  if (loading) {
    return (
      <div className="text-center text-white/60 py-10">
        Loading creators...
      </div>
    );
  }

  if (!loading && creators.length === 0) {
    return (
      <div className="text-center text-white/40 py-10">
        No creators available.
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {creators.map((creator) => (
          <CreatorCard
            key={creator.id}
            creator={creator}
          />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-6">
        <button
          disabled={page === 1}
          onClick={() => setPage((prev) => prev - 1)}
          className="px-4 py-2 bg-white/10 rounded-xl disabled:opacity-40 hover:bg-white/20 transition"
        >
          Previous
        </button>

        <span className="text-white/60">
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage((prev) => prev + 1)}
          className="px-4 py-2 bg-white/10 rounded-xl disabled:opacity-40 hover:bg-white/20 transition"
        >
          Next
        </button>
      </div>
    </div>
  );
}