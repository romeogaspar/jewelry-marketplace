import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

export default function Input({ label, id, className = "", ...props }: InputProps) {
  return (
    <label htmlFor={id} className="block text-sm font-medium text-neutral-700">
      {label}
      <input
        id={id}
        name={id}
        className={`mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 ${className}`}
        {...props}
      />
    </label>
  );
}
