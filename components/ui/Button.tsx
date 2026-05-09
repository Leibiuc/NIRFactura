import { cn } from "./cn";
import { Spinner } from "./Spinner";

const variants = {
  primary:
    "bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-all flex items-center gap-2 active:scale-[0.97] active:brightness-95",
  ghost: "text-sm text-gray-500 hover:text-gray-700 underline active:opacity-60",
  link: "text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 active:opacity-60",
  danger: "text-red-400 hover:text-red-600 text-xs font-bold active:opacity-60",
  card: "block w-full cursor-pointer active:opacity-80",
};

type BaseProps = {
  variant?: keyof typeof variants;
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
};

type AsButton = BaseProps & { as?: "button" } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "as" | keyof BaseProps>;
type AsAnchor = BaseProps & { as: "a" } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "as" | keyof BaseProps>;
type AsLabel  = BaseProps & { as: "label" } & Omit<React.LabelHTMLAttributes<HTMLLabelElement>, "as" | keyof BaseProps>;

export type ButtonProps = AsButton | AsAnchor | AsLabel;

export function Button({
  variant = "primary",
  loading,
  className,
  children,
  as,
  ...rest
}: ButtonProps) {
  const Tag = (as ?? "button") as React.ElementType;
  const isButton = !as || as === "button";

  return (
    <Tag
      {...(rest as object)}
      {...(isButton && {
        disabled: (rest as React.ButtonHTMLAttributes<HTMLButtonElement>).disabled || loading,
      })}
      className={cn(variants[variant], className)}
    >
      {isButton && loading && variant === "primary" && <Spinner />}
      {children}
    </Tag>
  );
}
