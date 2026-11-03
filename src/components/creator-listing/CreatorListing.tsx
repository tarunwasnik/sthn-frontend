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
  const [creators, setCreators] = useState<
    CreatorPublicCardDTO[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] =
    useState(1);

  useEffect(() => {
    const loadCreators = async () => {
      try {
        setLoading(true);

        const response: CreatorListingResponseDTO =
          await fetchCreators({
            page,
            limit: pageSize,
          });

        console.log(
          "CREATOR RESPONSE",
          response
        );

        setCreators(response.data);

        setTotalPages(
          response.pagination.totalPages
        );
      } catch (err) {
        console.error(
          "Failed to fetch creators",
          err
        );
      } finally {
        setLoading(false);
      }
    };

    loadCreators();
  }, [page, pageSize]);

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div
        className="
          flex
          items-center
          justify-center
          py-16
          text-sm
          text-theme-muted
        "
      >
        Loading creators...
      </div>
    );
  }

  /* ================= EMPTY ================= */

  if (!loading && creators.length === 0) {
    return (
      <div
        className="
          rounded-[var(--radius-card)]
          border border-theme-border
          bg-theme-surface
          py-16
          text-center
        "
      >
        <p
          className="
            text-base
            font-medium
            text-theme-text
          "
        >
          No creators available
        </p>

        <p
          className="
            mt-2
            text-sm
            text-theme-muted
          "
        >
          Try adjusting filters or
          check again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ================= INFO ROW ================= */}

      <div
        className="
          flex
          items-center
          justify-between
          gap-4
          flex-wrap
        "
      >
        <div
          className="
            flex
            items-center
            gap-3
            flex-wrap
          "
        >
          <p
            className="
              text-sm
              text-theme-muted
            "
          >
            Prices show starting rates
            and booking slot badges show
            the creator's next available
            session time.
          </p>
        </div>

        <div
          className="
            h-9
            px-4
            rounded-[var(--radius-control)]

            border
            border-theme-accent

            bg-theme-accent-tint

            flex
            items-center
            justify-center

            text-sm
            font-medium
            text-theme-accent
          "
        >
          {creators.length} creators live
        </div>
      </div>

      {/* ================= GRID ================= */}

      <div
        className="
          grid
          grid-cols-1
          gap-5

          sm:grid-cols-2
          lg:grid-cols-3
          xl:grid-cols-4

          items-start
        "
      >
        {creators.map((creator) => (
          <CreatorCard
            key={creator.id}
            creator={creator}
          />
        ))}
      </div>

      {/* ================= PAGINATION ================= */}

      <div
        className="
          flex
          items-center
          justify-center
          gap-3
          pt-4
          flex-wrap
        "
      >
        <button
          disabled={page === 1}
          onClick={() =>
            setPage((prev) => prev - 1)
          }
          className="
            h-11
            px-5
            rounded-[var(--radius-control)]
            border border-theme-border
            bg-theme-surface
            text-sm
            font-medium
            text-theme-text
            transition-colors

            hover:bg-theme-inset
            hover:border-theme-border-strong

            disabled:opacity-40
            disabled:cursor-not-allowed
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
          "
        >
          Previous
        </button>

        <div
          className="
            h-11
            px-4
            rounded-[var(--radius-control)]
            border border-theme-border
            bg-theme-inset

            flex
            items-center

            text-sm
            text-theme-text
          "
        >
          Page {page} of {totalPages}
        </div>

        <button
          disabled={page === totalPages}
          onClick={() =>
            setPage((prev) => prev + 1)
          }
          className="
            h-11
            px-5
            rounded-[var(--radius-control)]
            border border-theme-border
            bg-theme-surface
            text-sm
            font-medium
            text-theme-text
            transition-colors

            hover:bg-theme-inset
            hover:border-theme-border-strong

            disabled:opacity-40
            disabled:cursor-not-allowed
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent
          "
        >
          Next
        </button>
      </div>
    </div>
  );
}
