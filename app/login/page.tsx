"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const supabase = createClient();

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: String(formData.get("email")),
      password: String(formData.get("password")),
    });

    if (signInError || !data.user) {
      setError("Invalid email or password.");
      setIsSubmitting(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const redirectParam = new URLSearchParams(window.location.search).get(
      "redirect"
    );
    const fallback = profile?.role === "admin" ? "/admin/dashboard" : "/";
    router.push(redirectParam || fallback);
    router.refresh();
  }

  return (
    <div className="mx-auto mt-16 w-full max-w-sm px-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h1 className="text-xl font-semibold text-neutral-900">Sign In</h1>

        <Input label="E-mail Address" type="email" id="email" required />
        <Input label="Password" type="password" id="password" required />

        {error && <ErrorMessage title="Login failed" message={error} />}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>

        <p className="text-center text-sm text-neutral-500">
          New here? <Link href="/register" className="text-neutral-900 underline">Create an account</Link>
        </p>
        <p className="text-center text-sm text-neutral-500">
          Selling on our marketplace?{" "}
          <Link href="/vendor/login" className="text-neutral-900 underline">
            Vendor sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
