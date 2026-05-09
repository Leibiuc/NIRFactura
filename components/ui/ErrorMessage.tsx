import { cn } from "./cn";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export function ErrorMessage({ children, className }: Props) {
  return (
    <p className={cn("text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2", className)}>
      {children}
    </p>
  );
}
