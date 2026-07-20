import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "text";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-neutral-900 text-white hover:bg-neutral-700 disabled:bg-neutral-300",
  secondary:
    "bg-white text-neutral-900 border border-neutral-300 hover:bg-neutral-50",
  danger: "bg-red-50 text-red-700 hover:bg-red-100",
  text: "text-neutral-600 hover:text-neutral-900 underline-offset-2 hover:underline",
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
      : "rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed";

  return (
    <button
      className={`${base} ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
