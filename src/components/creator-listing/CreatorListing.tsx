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
          text-white/50
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
          rounded-[28px]
          border border-white/10
          bg-gradient-to-br
          from-white/[0.04]
          to-white/[0.015]
          backdrop-blur-xl
          py-16
          text-center
        "
      >
        <p
          className="
            text-base
            font-medium
            text-white/70
          "
        >
          No creators available
        </p>

        <p
          className="
            mt-2
            text-sm
            text-white/40
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
              text-white/45
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
            rounded-full

            border
            border-emerald-400/20

            bg-emerald-400/10

            flex
            items-center
            justify-center

            text-sm
            font-medium
            text-emerald-300

            backdrop-blur-xl
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
            rounded-2xl
            border border-white/10
            bg-white/[0.04]
            text-sm
            text-white/70
            backdrop-blur-xl
            transition-all duration-300

            hover:bg-white/[0.08]
            hover:border-white/15

            disabled:opacity-40
            disabled:hover:bg-white/[0.04]
          "
        >
          Previous
        </button>

        <div
          className="
            h-11
            px-4
            rounded-2xl
            border border-white/10
            bg-white/[0.03]
            backdrop-blur-xl

            flex
            items-center

            text-sm
            text-white/70
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
            rounded-2xl
            border border-white/10
            bg-white/[0.04]
            text-sm
            text-white/70
            backdrop-blur-xl
            transition-all duration-300

            hover:bg-white/[0.08]
            hover:border-white/15

            disabled:opacity-40
            disabled:hover:bg-white/[0.04]
          "
        >
          Next
        </button>
      </div>
    </div>
  );
}