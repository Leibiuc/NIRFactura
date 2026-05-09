import { cn } from "./cn";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export function Label({ children, className }: Props) {
  return (
    <label className={cn("text-xs font-medium text-gray-500 uppercase tracking-wide", className)}>
      {children}
    </label>
  );
}
