//frontend/src/components/admin/table/AdminPagination.tsx

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export default function AdminPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: AdminPaginationProps) {
  const canPrevious = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex flex-col gap-4 border-t border-theme-border bg-theme-surface px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="text-sm text-theme-muted">
        {typeof totalItems === "number" ? (
          <>
            Showing{" "}
            <span className="font-medium text-theme-text">
              {(page - 1) * (pageSize ?? 0) + 1}
            </span>{" "}
            -
            <span className="font-medium text-theme-text">
              {" "}
              {Math.min(page * (pageSize ?? totalItems), totalItems)}
            </span>{" "}
            of <span className="font-medium text-theme-text">{totalItems}</span>
          </>
        ) : (
          <>
            Page <span className="font-medium text-theme-text">{page}</span> of{" "}
            <span className="font-medium text-theme-text">{totalPages}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          disabled={!canPrevious}
          onClick={() => onPageChange(page - 1)}
          className="rounded-[var(--radius-control)] border border-theme-border-strong bg-transparent px-4 py-2 text-sm font-medium text-theme-text transition-colors hover:bg-theme-inset disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        <div className="rounded-[var(--radius-control)] border border-theme-accent bg-theme-accent-tint px-4 py-2 text-sm font-medium text-theme-accent">
          {page}
        </div>

        <button
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          className="rounded-[var(--radius-control)] border border-theme-border-strong bg-transparent px-4 py-2 text-sm font-medium text-theme-text transition-colors hover:bg-theme-inset disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
