// frontend/src/pages/Explorer.tsx

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchCreators } from "../api/public";
import type {
  CreatorPublicCardDTO,
  CreatorListingResponseDTO,
} from "../api/public";
import CreatorCard from "../components/CreatorCard";

export default function Explore() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category") ?? undefined;

  const [creators, setCreators] = useState<CreatorPublicCardDTO[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [sort, setSort] = useState("recommended");

  /* Reset page when filters change */
  useEffect(() => {
    setPage(1);
  }, [category, sort]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const res: CreatorListingResponseDTO =
          await fetchCreators({
            page,
            limit: 12,
            category,
            sort,
          });

        setCreators(res.data);
        setTotalPages(res.pagination.totalPages);
      } catch (err) {
        console.error("Failed to load creators", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [page, category, sort]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Explore creators
          </h1>

          {category && (
            <p className="text-sm text-white/60 mt-1">
              Category:{" "}
              <span className="font-medium text-white">
                {category}
              </span>
            </p>
          )}
        </div>

        {/* Sorting */}
        <div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-white/10 text-white px-3 py-2 rounded-lg text-sm"
          >
            <option value="recommended">Recommended</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20 text-white/50">
          Loading creators…
        </div>
      )}

      {/* Empty */}
      {!loading && creators.length === 0 && (
        <div className="flex justify-center py-20 text-white/50">
          No creators found.
        </div>
      )}

      {/* Grid */}
      {!loading && creators.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {creators.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-6 pt-8">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 bg-white/10 rounded-xl disabled:opacity-40 hover:bg-white/20 transition"
              >
                Previous
              </button>

              <span className="text-sm text-white/60">
                Page {page} of {totalPages}
              </span>

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 bg-white/10 rounded-xl disabled:opacity-40 hover:bg-white/20 transition"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}