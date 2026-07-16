import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "attacklab_session";
const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || "fallback-secret-change-me");

// Public routes that don't require authentication
const PUBLIC_ROUTES = new Set([
  "/",
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/contact",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/auth/verify-email",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/resend-verification",
  "/api/auth/google",
  "/api/auth/google/callback",
  "/api/auth/github",
  "/api/auth/github/callback",
  "/api/admin/stats",
  "/api/admin/users",
  "/api/admin/courses",
  "/api/admin/payments",
  "/api/admin/audit-logs",
  "/api/admin/auth-events",
]);

// Static asset prefixes
const STATIC_PREFIXES = ["/_next/", "/favicon", "/public/", "/robots", "/sitemap", "/og-image", "/apple-touch", "/google"];

function isPublicRoute(pathname: string): boolean {
  // Exact match
  if (PUBLIC_ROUTES.has(pathname)) return true;

  // Static assets
  if (STATIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;

  // API auth routes
  if (pathname.startsWith("/api/auth/")) return true;

  // Admin setup endpoint (one-time use)
  if (pathname === "/api/admin/setup") return true;

  // Root path
  if (pathname === "/") return true;

  return false;
}

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin/");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static assets and public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Check for session cookie
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    // Admin routes: return 403
    if (isAdminRoute(pathname)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    // All other protected routes: redirect to login
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify JWT token
  try {
    const { payload } = await jwtVerify(token, SECRET);

    // For admin routes, we check the JWT has userId and trust
    // the API-level middleware-utils for full RBAC check
    if (isAdminRoute(pathname)) {
      // Admin API routes are protected by requireAdmin() in the route handlers
      // Admin pages check auth client-side via /api/auth/me
      // We still need to ensure a valid session exists (already verified above)
    }

    // Add user info to headers for downstream use
    const response = NextResponse.next();
    response.headers.set("x-user-id", payload.userId as string);
    response.headers.set("x-session-id", payload.sessionId as string);
    return response;
  } catch {
    // Invalid token
    if (isAdminRoute(pathname)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
