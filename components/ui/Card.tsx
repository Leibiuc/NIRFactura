import { cn } from "./cn";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: Props) {
  return (
    <div className={cn("bg-white rounded-xl p-4 border border-gray-200", className)}>
      {children}
    </div>
  );
}
