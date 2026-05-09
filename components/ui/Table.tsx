import { cn } from "./cn";

export function TableRoot({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  );
}

export function Thead({ children, className }: { children: React.ReactNode; className?: string }) {
  return <thead className={className}>{children}</thead>;
}

export function Tbody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function Tfoot({ children }: { children: React.ReactNode }) {
  return <tfoot>{children}</tfoot>;
}

interface TrProps {
  children: React.ReactNode;
  className?: string;
}

export function Tr({ children, className }: TrProps) {
  return <tr className={className}>{children}</tr>;
}

interface ThProps {
  children?: React.ReactNode;
  className?: string;
  colSpan?: number;
}

export function Th({ children, className, colSpan }: ThProps) {
  return (
    <th colSpan={colSpan} className={cn("border border-gray-200 px-2 py-2", className)}>
      {children}
    </th>
  );
}

interface TdProps {
  children?: React.ReactNode;
  className?: string;
  colSpan?: number;
  computed?: boolean;
}

export function Td({ children, className, colSpan, computed }: TdProps) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        "border border-gray-200 px-2 py-1",
        computed && "bg-gray-50 text-gray-600 tabular-nums",
        className
      )}
    >
      {children}
    </td>
  );
}
