"use client";

import { useActionState } from "react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { createFirstAdmin, type FormState } from "@/lib/actions/auth";

const initialState: FormState = {};

export default function SetupForm() {
  const [state, formAction, isSubmitting] = useActionState(
    createFirstAdmin,
    initialState
  );

  if (state.success) {
    return (
      <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-center">
        <p className="font-medium text-green-800">Admin Created!</p>
        <p className="mt-1 text-sm text-green-700">
          You can now sign in with your new admin account.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <Input label="E-mail Address" type="email" id="email" required />
      <Input label="Password" type="password" id="password" minLength={8} required />
      <Input
        label="Confirm Password"
        type="password"
        id="confirm-password"
        minLength={8}
        required
      />

      {state.error && (
        <ErrorMessage title="Failed to create admin" message={state.error} />
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Creating..." : "Create Admin"}
      </Button>
    </form>
  );
}
