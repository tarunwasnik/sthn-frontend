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
    <div className="flex flex-col gap-4 border-t border-slate-800 bg-slate-900 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="text-sm text-slate-400">
        {typeof totalItems === "number" ? (
          <>
            Showing{" "}
            <span className="font-medium text-white">
              {(page - 1) * (pageSize ?? 0) + 1}
            </span>{" "}
            -
            <span className="font-medium text-white">
              {" "}
              {Math.min(page * (pageSize ?? totalItems), totalItems)}
            </span>{" "}
            of <span className="font-medium text-white">{totalItems}</span>
          </>
        ) : (
          <>
            Page <span className="font-medium text-white">{page}</span> of{" "}
            <span className="font-medium text-white">{totalPages}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          disabled={!canPrevious}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        <div className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-white">
          {page}
        </div>

        <button
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
