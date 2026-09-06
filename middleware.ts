import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { jwtVerify } from "jose";

const protectedRoutes = ["/checkout", "/orders", "/wishlist", "/profile", "/addresses"];
const adminRoutes = ["/admin"];
const ADMIN_SUBDOMAIN = "admin.mksignasures.shop";

async function verifyAdminSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get("mk-admin-session")?.value;
  if (!token) return false;

  try {
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret) return false;
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

function isAdminSubdomain(host: string | null): boolean {
  if (!host) return false;
  // Strip port number (e.g. "localhost:3000" → "localhost")
  const hostname = host.split(":")[0];
  return hostname === ADMIN_SUBDOMAIN || hostname === "localhost";
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const host = request.headers.get("host");

  // --- Admin subdomain: admin.mksignasures.shop ---
  if (isAdminSubdomain(host)) {
    const hasSession = await verifyAdminSession(request);

    // /admin/login on subdomain: redirect to dashboard if already logged in
    if (pathname === "/admin/login" || pathname === "/login") {
      if (hasSession) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/dashboard";
        return NextResponse.redirect(url);
      }
      // Not logged in: rewrite /login → /admin/login and pass through
      if (pathname === "/login") {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/login";
        return NextResponse.rewrite(url);
      }
      return NextResponse.next();
    }

    // Any other route on admin subdomain: require auth
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    // Authenticated: rewrite subdomain path to /admin/* internally
    // e.g. admin.mksignasures.shop/dashboard → /admin/dashboard
    const url = request.nextUrl.clone();
    url.pathname = "/admin" + pathname;
    return NextResponse.rewrite(url);
  }

  // --- Admin routes on main domain (temporary: for testing) ---
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    // Allow /admin/login without auth check
    if (pathname === "/admin/login") {
      const hasSession = await verifyAdminSession(request);
      if (hasSession) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/dashboard";
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }

    const hasSession = await verifyAdminSession(request);
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // --- Protected routes (authenticated only via Supabase) ---
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    const { supabaseResponse, supabase } = await updateSession(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("returnTo", pathname);
      return Response.redirect(url);
    }

    return supabaseResponse;
  }

  // --- All other routes: refresh Supabase session ---
  const { supabaseResponse } = await updateSession(request);
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
