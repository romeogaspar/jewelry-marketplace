import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Three sibling portals (customer /account, vendor /vendor, admin /admin) —
// not a hierarchy. An admin session does not automatically pass the vendor
// gate, and vice versa; each portal is its own separate account/login.
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isAdminSetup = pathname === "/admin/setup";
  const isAdminRoute = pathname.startsWith("/admin") && !isAdminSetup;
  const isVendorAuthRoute =
    pathname === "/vendor/login" || pathname === "/vendor/register";
  const isVendorRoute = pathname.startsWith("/vendor") && !isVendorAuthRoute;
  const isAccountRoute = pathname.startsWith("/account");

  if (!isAdminRoute && !isVendorRoute && !isAccountRoute) {
    return supabaseResponse;
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = isVendorRoute ? "/vendor/login" : "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role;

  if (isAdminRoute && role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isVendorRoute && role !== "vendor") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isAccountRoute && role !== "customer") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const proxyConfig = {
  matcher: ["/admin/:path*", "/vendor/:path*", "/account/:path*"],
};
