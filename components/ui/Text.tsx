import { cn } from "./cn";

type Variant = "heading" | "subheading" | "body" | "muted";
type Tag = "p" | "h1" | "h2" | "h3" | "span" | "div";

const styles: Record<Variant, string> = {
  heading: "text-2xl font-bold text-gray-900",
  subheading: "text-sm text-gray-500",
  body: "text-sm text-gray-700",
  muted: "text-sm text-gray-500",
};

interface Props {
  as?: Tag;
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

export function Text({ as: Component = "p", variant = "body", children, className }: Props) {
  return (
    <Component className={cn(styles[variant], className)}>
      {children}
    </Component>
  );
}
