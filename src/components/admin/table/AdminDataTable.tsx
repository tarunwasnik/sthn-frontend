//frontend/src/components/admin/table/AdminDataTable.tsx

import React from "react";

interface AdminDataTableProps {
  children: React.ReactNode;
  className?: string;
}

export default function AdminDataTable({
  children,
  className = "",
}: AdminDataTableProps) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-slate-800 bg-slate-900 ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">{children}</table>
      </div>
    </div>
  );
}

interface SectionProps {
  children: React.ReactNode;
  className?: string;
}

export function AdminTableHead({ children, className = "" }: SectionProps) {
  return (
    <thead className={`sticky top-0 z-10 bg-slate-950 ${className}`}>
      {children}
    </thead>
  );
}

export function AdminTableBody({ children, className = "" }: SectionProps) {
  return (
    <tbody className={`divide-y divide-slate-800 ${className}`}>
      {children}
    </tbody>
  );
}

interface RowProps {
  children: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
}

export function AdminTableRow({
  children,
  onClick,
  selected = false,
}: RowProps) {
  return (
    <tr
      onClick={onClick}
      className={`
        transition-colors
        ${onClick ? "cursor-pointer hover:bg-slate-800/60" : ""}
        ${selected ? "bg-blue-500/10" : ""}
      `}
    >
      {children}
    </tr>
  );
}

interface CellProps {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}

export function AdminTableHeaderCell({
  children,
  align = "left",
  className = "",
}: CellProps) {
  return (
    <th
      className={`
        whitespace-nowrap
        px-5
        py-4
        text-xs
        font-semibold
        uppercase
        tracking-wider
        text-slate-400
        ${
          align === "center"
            ? "text-center"
            : align === "right"
              ? "text-right"
              : "text-left"
        }
        ${className}
      `}
    >
      {children}
    </th>
  );
}

export function AdminTableCell({
  children,
  align = "left",
  className = "",
}: CellProps) {
  return (
    <td
      className={`
        px-5
        py-4
        align-middle
        text-sm
        text-slate-200
        ${
          align === "center"
            ? "text-center"
            : align === "right"
              ? "text-right"
              : "text-left"
        }
        ${className}
      `}
    >
      {children}
    </td>
  );
}
