"use client";

import { useActionState } from "react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { registerCustomer, type FormState } from "@/lib/actions/auth";

const initialState: FormState = {};

export default function RegisterPage() {
  const [state, formAction, isSubmitting] = useActionState(
    registerCustomer,
    initialState
  );

  return (
    <div className="mx-auto mt-16 w-full max-w-sm px-4">
      <form action={formAction} className="space-y-4">
        <h1 className="text-xl font-semibold text-neutral-900">
          Create an Account
        </h1>

        <Input label="Full Name" type="text" id="full-name" required />
        <Input label="E-mail Address" type="email" id="email" required />
        <Input label="Password" type="password" id="password" minLength={8} required />

        {state.error && (
          <ErrorMessage title="Could not create account" message={state.error} />
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>

        <p className="text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link href="/login" className="text-neutral-900 underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
