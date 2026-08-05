import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

export default function Input({ label, id, className = "", ...props }: InputProps) {
  return (
    <label htmlFor={id} className="block text-xs font-medium uppercase tracking-widest text-stone">
      {label}
      <input
        id={id}
        name={id}
        className={`mt-1.5 block w-full border border-hairline bg-parchment px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none ${className}`}
        {...props}
      />
    </label>
  );
}
