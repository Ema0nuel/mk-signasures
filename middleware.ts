import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { jwtVerify } from "jose";

const protectedRoutes = ["/checkout", "/orders", "/wishlist", "/profile", "/addresses"];
const adminRoutes = ["/admin"];

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

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check admin routes
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    // Allow /admin/login without auth check
    if (pathname === "/admin/login") {
      // If already logged in, redirect to dashboard
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
      // Not authenticated — redirect to admin login
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    // Has valid session, proceed
    return NextResponse.next();
  }

  // Check protected routes (authenticated only via Supabase)
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

  // Refresh Supabase session for all other routes
  const { supabaseResponse } = await updateSession(request);
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
