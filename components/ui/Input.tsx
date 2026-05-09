import { cn } from "./cn";

const variants = {
  default:
    "border border-gray-200 rounded px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400",
  cell: "w-full px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm text-gray-900",
};

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: keyof typeof variants;
}

export function Input({ variant = "default", className, ...props }: Props) {
  return (
    <input className={cn(variants[variant], className)} {...props} />
  );
}
