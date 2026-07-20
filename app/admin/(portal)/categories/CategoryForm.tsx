"use client";

import { useActionState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { createCategory, type FormState } from "@/lib/actions/categories";

type Category = {
  id: string;
  name: string;
  level: number;
};

const initialState: FormState = {};

export default function CategoryForm({ categories }: { categories: Category[] }) {
  const [state, formAction, isSubmitting] = useActionState(
    createCategory,
    initialState
  );

  // A level-3 category can never be a parent — the DB trigger would reject
  // it anyway, but filtering it out here keeps the picker honest up front.
  const eligibleParents = categories.filter((c) => c.level < 3);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 p-4">
      <div className="min-w-[200px]">
        <Input label="Category Name" type="text" id="name" required />
      </div>
      <label htmlFor="parent-id" className="block text-sm font-medium text-neutral-700">
        Parent (optional)
        <select
          id="parent-id"
          name="parent-id"
          className="mt-1 block w-56 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
        >
          <option value="">— Top level —</option>
          {eligibleParents.map((c) => (
            <option key={c.id} value={c.id}>
              {"— ".repeat(c.level - 1)}
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Adding..." : "Add Category"}
      </Button>
      {state.error && (
        <div className="w-full">
          <ErrorMessage title="Could not add category" message={state.error} />
        </div>
      )}
    </form>
  );
}
