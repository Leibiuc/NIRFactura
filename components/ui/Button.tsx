import { cn } from "./cn";
import { Spinner } from "./Spinner";

const variants = {
  primary:
    "bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2",
  ghost: "text-sm text-gray-500 hover:text-gray-700 underline",
  link: "text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1",
  danger: "text-red-400 hover:text-red-600 text-xs font-bold",
};

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  loading,
  className,
  children,
  disabled,
  ...props
}: Props) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(variants[variant], className)}
      {...props}
    >
      {loading && variant === "primary" && <Spinner />}
      {children}
    </button>
  );
}
