"use server";

import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import { createServiceClient } from "../supabase/service";
import { slugify } from "../slugify";

export type FormState = { error?: string; success?: boolean };

function isInvalidText(value: FormDataEntryValue | null) {
  return !value || String(value).trim() === "";
}

// Creates the auth.users row via the admin API (email_confirm: true, so a
// demo account never needs real email delivery), then immediately signs the
// visitor in through the cookie-based client so the follow-up profiles/
// vendors insert satisfies the `id = auth.uid()` RLS check.
async function createAndSignIn(email: string, password: string) {
  const serviceClient = createServiceClient();
  const { data, error } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    return { error: error?.message ?? "Could not create account." } as const;
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return {
      error: "Account created, but automatic sign-in failed. Please log in.",
    } as const;
  }

  return { userId: data.user.id, supabase } as const;
}

export async function registerCustomer(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const fullName = formData.get("full-name");

  if (isInvalidText(email) || !String(email).includes("@")) {
    return { error: "Please enter a valid email address." };
  }
  if (isInvalidText(password) || String(password).length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (isInvalidText(fullName)) {
    return { error: "Please enter your full name." };
  }

  const result = await createAndSignIn(String(email), String(password));
  if ("error" in result) return result;

  const { userId, supabase } = result;
  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    role: "customer",
    full_name: String(fullName),
  });

  if (profileError) {
    return { error: "Account created, but profile setup failed." };
  }

  redirect("/");
}

export async function registerVendor(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const fullName = formData.get("full-name");
  const businessName = formData.get("business-name");

  if (isInvalidText(email) || !String(email).includes("@")) {
    return { error: "Please enter a valid email address." };
  }
  if (isInvalidText(password) || String(password).length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (isInvalidText(businessName)) {
    return { error: "Please enter your business name." };
  }

  const result = await createAndSignIn(String(email), String(password));
  if ("error" in result) return result;

  const { userId, supabase } = result;

  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    role: "vendor",
    full_name: String(fullName),
  });
  if (profileError) {
    return { error: "Account created, but profile setup failed." };
  }

  const { error: vendorError } = await supabase.from("vendors").insert({
    id: userId,
    business_name: String(businessName),
    slug: slugify(String(businessName), userId.slice(0, 6)),
  });
  if (vendorError) {
    return { error: "Account created, but vendor setup failed." };
  }

  redirect("/vendor/dashboard");
}

export async function signOut(redirectTo: string = "/") {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(redirectTo);
}

// Public, unauthenticated first-run bootstrap — mirrors food-app-nextjs's
// /admin/setup pattern. Re-checks server-side that no admin exists yet
// (not just trusting the calling page), so the action can't be replayed as a
// public backdoor for creating extra admins later.
export async function createFirstAdmin(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirm-password");

  if (isInvalidText(email) || !String(email).includes("@")) {
    return { error: "Please enter a valid email address." };
  }
  if (isInvalidText(password) || String(password).length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const serviceClient = createServiceClient();
  const { data: existing, error: listError } =
    await serviceClient.auth.admin.listUsers();

  if (listError) {
    return { error: "Something went wrong. Please try again." };
  }
  if (existing.users.length > 0) {
    return { error: "Setup has already been completed. Please sign in instead." };
  }

  const { data, error } = await serviceClient.auth.admin.createUser({
    email: String(email),
    password: String(password),
    email_confirm: true,
  });
  if (error || !data.user) {
    return { error: error?.message ?? "Could not create admin account." };
  }

  const { error: profileError } = await serviceClient.from("profiles").insert({
    id: data.user.id,
    role: "admin",
  });
  if (profileError) {
    return { error: "Admin auth account created, but profile setup failed." };
  }

  return { success: true };
}
