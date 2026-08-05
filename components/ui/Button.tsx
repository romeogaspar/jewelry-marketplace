import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "text";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-ink text-parchment hover:bg-gold disabled:bg-hairline disabled:text-stone",
  secondary:
    "bg-transparent text-ink border border-ink hover:bg-ink hover:text-parchment",
  danger: "bg-red-50 text-red-700 hover:bg-red-100",
  text: "text-stone hover:text-gold underline-offset-2 hover:underline",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export default function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const base =
    variant === "text"
      ? "text-sm font-medium disabled:opacity-50"
      : "px-5 py-2.5 text-xs font-medium uppercase tracking-widest transition-colors disabled:cursor-not-allowed";

  return (
    <button
      className={`${base} ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
