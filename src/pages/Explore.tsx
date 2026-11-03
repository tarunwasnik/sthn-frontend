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
    <main className="min-h-[100dvh] bg-theme-bg px-4 py-8 text-theme-text sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Explore creators
          </h1>

          {category && (
            <p className="mt-1 text-sm text-theme-muted">
              Category:{" "}
              <span className="font-medium text-theme-text">
                {category}
              </span>
            </p>
          )}
        </div>

        {/* Sorting */}
        <div>
          <label className="block text-sm font-medium text-theme-text">
            <span className="sr-only">Sort creators</span>
            <select
            aria-label="Sort creators"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 w-full rounded-[var(--radius-control)] border border-theme-border bg-theme-surface px-3 text-sm text-theme-text transition-colors hover:border-theme-border-strong focus:border-theme-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent sm:w-auto"
          >
            <option value="recommended">Recommended</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="rating">Top Rated</option>
          </select>
          </label>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center rounded-[var(--radius-card)] border border-theme-border bg-theme-surface py-20 text-theme-muted" role="status">
          Loading creators…
        </div>
      )}

      {/* Empty */}
      {!loading && creators.length === 0 && (
        <div className="flex justify-center rounded-[var(--radius-card)] border border-dashed border-theme-border bg-theme-inset py-20 text-theme-muted">
          No creators found.
        </div>
      )}

      {/* Grid */}
      {!loading && creators.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {creators.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4 sm:gap-6">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                type="button"
                aria-label="Previous page"
                className="h-10 rounded-[var(--radius-control)] border border-theme-border bg-theme-surface px-4 text-sm font-medium text-theme-text transition-colors hover:border-theme-border-strong hover:bg-theme-inset disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <span className="text-sm text-theme-muted" aria-live="polite">
                Page {page} of {totalPages}
              </span>

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                type="button"
                aria-label="Next page"
                className="h-10 rounded-[var(--radius-control)] border border-theme-border bg-theme-surface px-4 text-sm font-medium text-theme-text transition-colors hover:border-theme-border-strong hover:bg-theme-inset disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
      </div>
    </main>
  );
}
