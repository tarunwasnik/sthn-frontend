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
      className={`overflow-hidden rounded-[var(--radius-card)] border border-theme-border bg-theme-surface ${className}`}
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
    <thead className={`sticky top-0 z-10 bg-theme-inset ${className}`}>
      {children}
    </thead>
  );
}

export function AdminTableBody({ children, className = "" }: SectionProps) {
  return (
    <tbody className={`divide-y divide-theme-border ${className}`}>
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
        ${onClick ? "cursor-pointer hover:bg-theme-inset" : ""}
        ${selected ? "bg-theme-accent-tint" : ""}
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
        text-theme-muted
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
        text-theme-text
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
