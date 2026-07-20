"use client";

import { useActionState } from "react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { registerVendor, type FormState } from "@/lib/actions/auth";

const initialState: FormState = {};

export default function VendorRegisterPage() {
  const [state, formAction, isSubmitting] = useActionState(
    registerVendor,
    initialState
  );

  return (
    <div className="mx-auto mt-16 w-full max-w-sm px-4">
      <form action={formAction} className="space-y-4">
        <h1 className="text-xl font-semibold text-neutral-900">
          Become a Vendor
        </h1>
        <p className="text-sm text-neutral-500">
          Your account and products will need admin approval before they go
          live on the storefront.
        </p>

        <Input label="Business Name" type="text" id="business-name" required />
        <Input label="Your Full Name" type="text" id="full-name" required />
        <Input label="E-mail Address" type="email" id="email" required />
        <Input label="Password" type="password" id="password" minLength={8} required />

        {state.error && (
          <ErrorMessage title="Could not create account" message={state.error} />
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creating account..." : "Register as vendor"}
        </Button>

        <p className="text-center text-sm text-neutral-500">
          Already a vendor?{" "}
          <Link href="/vendor/login" className="text-neutral-900 underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
