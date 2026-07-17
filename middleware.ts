import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

import { jwtVerify, decodeJwt } from "jose";

const SESSION_COOKIE = "attacklab_session";
const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || "fallback-secret-change-me");

// ─── Configuration ──────────────────────────────────────────────────────────
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || "10", 10);
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10);
const BLOCK_THRESHOLD = parseInt(process.env.RATE_LIMIT_BLOCK_THRESHOLD || "3", 10); // violations before auto-block
const BLOCK_DURATION_MS = parseInt(process.env.RATE_LIMIT_BLOCK_DURATION || "3600000", 10); // 1 hour default block
const ALERT_WEBHOOK_URL = process.env.ATTACK_ALERT_WEBHOOK_URL || ""; // optional webhook for alerts
const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || "").split(",").filter(Boolean); // comma-separated user IDs to exempt
const ADMIN_IPS = (process.env.ADMIN_IPS || "").split(",").filter(Boolean); // comma-separated IPs to exempt

// ─── Stores ─────────────────────────────────────────────────────────────────
const rateLimitStore = new Map<string, { count: number; windowStart: number }>();
const blockList = new Map<string, { blockedAt: number; reason: string; expiresAt: number }>();
const violationTracker = new Map<string, { count: number; lastViolation: number }>();

let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

// ─── Blocked User-Agents ───────────────────────────────────────────────────
const BLOCKED_USER_AGENTS = [
  /sqlmap/i,
  /nikto/i,
  /nessus/i,
  /openvas/i,
  /masscan/i,
  /zgrab/i,
  /nmap/i,
  /dirbuster/i,
  /gobuster/i,
  /ffuf/i,
  /wfuzz/i,
  /havij/i,
  /acunetix/i,
  /qualys/i,
  /burpsuite/i,
  /owasp/i,
  /hydra/i,
  /medusa/i,
  /brutus/i,
  /w3af/i,
  /skipfish/i,
  /arachni/i,
  /whatweb/i,
  /hackbar/i,
  /dalfox/i,
  /subfinder/i,
  /httpx/i,
  /nuclei/i,
  /xsstrike/i,
  /commix/i,
  /jSQL/i,
  /sqlninja/i,
  /beEF/i,
  /metasploit/i,
  /cobalt/i,
  /empire/i,
  /sliver/i,
  /havoc/i,
  /brute/i,
  /exploit/i,
  /payload/i,
];

// ─── Suspicious URL Patterns ───────────────────────────────────────────────
const SUSPICIOUS_PATHS = [
  /\/etc\/passwd/i,
  /\/etc\/shadow/i,
  /\/proc\/self/i,
  /\/\.\.\/\.\.\//i, // path traversal
  /\/wp-admin/i,
  /\/wp-login/i,
  /\/xmlrpc\.php/i,
  /\/wp-content/i,
  /\/.env/i,
  /\/.git/i,
  /\/config\.json/i,
  /\/database/i,
  /\/backup/i,
  /\/phpmyadmin/i,
  /\/adminer/i,
  /\/phpinfo/i,
  /\/cgi-bin/i,
  /\/shell/i,
  /\/cmd/i,
  /\/eval/i,
  /\/exec/i,
  /\/system/i,
  /\/\.htaccess/i,
  /\/\.htpasswd/i,
  /\/web\.config/i,
  /\/crossdomain\.xml/i,
  /\/jmx-console/i,
  /\/web-console/i,
  /\/invoker/i,
  /\/solr/i,
  /\/actuator/i,
  /\/swagger/i,
  /\/api-docs/i,
  /\/graphql/i\?.*\b(introspection|query\s*\{)/i,
];

// ─── SQL/XSS Injection Patterns ────────────────────────────────────────────
const INJECTION_PATTERNS = [
  /(\bunion\b.*\bselect\b)/i,
  /(\bselect\b.*\bfrom\b)/i,
  /(\binsert\b.*\binto\b)/i,
  /(\bdrop\b.*\btable\b)/i,
  /(\bdelete\b.*\bfrom\b)/i,
  /(<script[\s>])/i,
  /javascript:/i,
  /on(load|error|click|mouseover)\s*=/i,
  /eval\s*\(/i,
  /document\.(cookie|write|location)/i,
  /window\.(location|open)/i,
  /<iframe/i,
  /expression\s*\(/i,
  /data:text\/html/i,
  /base64,/i,
];

// ─── IP Utilities ──────────────────────────────────────────────────────────
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return req.ip || "unknown";
}

function isAdmin(req: NextRequest): boolean {
  const ip = getClientIp(req);

  // Check exempt IPs first (fastest, no crypto needed)
  if (ADMIN_IPS.includes(ip)) return true;

  // Check JWT user ID (decode without verification — just for exemption check)
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;

  try {
    const payload = decodeJwt(token);
    const userId = payload.userId as string;
    if (userId && ADMIN_USER_IDS.includes(userId)) return true;
  } catch {}

  return false;
}

// ─── Logging ───────────────────────────────────────────────────────────────
interface AttackLog {
  timestamp: string;
  ip: string;
  type: "rate_limit" | "blocked_ua" | "suspicious_path" | "injection" | "auto_blocked";
  path: string;
  userAgent: string;
  method: string;
  details?: string;
  blocked?: boolean;
}

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || process.env.AUTH_SECRET || "";
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://attacklab.vercel.app";

function logAttack(entry: AttackLog): void {
  // Structured JSON log — parses nicely in any log aggregator
  console.log(JSON.stringify({ level: "SECURITY", ...entry }));

  // Persist to database (fire-and-forget)
  try {
    fetch(`${SITE_URL}/api/admin/security/log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${INTERNAL_SECRET}`,
      },
      body: JSON.stringify({
        ip: entry.ip,
        type: entry.type,
        path: entry.path,
        method: entry.method,
        userAgent: entry.userAgent,
        details: entry.details,
        blocked: entry.blocked || false,
      }),
    }).catch(() => {});
  } catch {}

  // Fire-and-forget webhook alert (non-blocking)
  if (ALERT_WEBHOOK_URL) {
    try {
      fetch(ALERT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `[ATTACK ALERT] ${entry.type} from ${entry.ip} — ${entry.method} ${entry.path} — UA: ${entry.userAgent}`,
          ...entry,
        }),
      }).catch(() => {});
    } catch {}
  }
}

// ─── Rate Limiter ──────────────────────────────────────────────────────────
function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();

  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    for (const [key, entry] of rateLimitStore) {
      if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimitStore.delete(key);
      }
    }
    // Cleanup expired blocks
    for (const [key, block] of blockList) {
      if (now > block.expiresAt) {
        blockList.delete(key);
        violationTracker.delete(key);
      }
    }
    lastCleanup = now;
  }

  const entry = rateLimitStore.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, windowStart: now });
    return { allowed: true };
  }

  entry.count++;

  if (entry.count > RATE_LIMIT_MAX) {
    // Track violations
    const tracker = violationTracker.get(ip) || { count: 0, lastViolation: 0 };
    tracker.count++;
    tracker.lastViolation = now;
    violationTracker.set(ip, tracker);

    // Auto-block after repeated violations
    if (tracker.count >= BLOCK_THRESHOLD) {
      blockList.set(ip, {
        blockedAt: now,
        reason: `Exceeded rate limit ${tracker.count} times`,
        expiresAt: now + BLOCK_DURATION_MS,
      });
      logAttack({
        timestamp: new Date(now).toISOString(),
        ip,
        type: "auto_blocked",
        path: "",
        userAgent: "",
        method: "MULTIPLE",
        details: `Auto-blocked for ${BLOCK_DURATION_MS / 1000}s after ${tracker.count} rate limit violations`,
        blocked: true,
      });
    } else {
      logAttack({
        timestamp: new Date(now).toISOString(),
        ip,
        type: "rate_limit",
        path: "",
        userAgent: "",
        method: "MULTIPLE",
        details: `Rate limit hit (count: ${entry.count}/${RATE_LIMIT_MAX}, violation #${tracker.count})`,
      });
    }

    const retryAfter = Math.ceil((entry.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}

// ─── Pattern Checks ────────────────────────────────────────────────────────
function isBlockedUserAgent(ua: string): boolean {
  return BLOCKED_USER_AGENTS.some((pattern) => pattern.test(ua));
}

function isSuspiciousPath(pathname: string): boolean {
  return SUSPICIOUS_PATHS.some((pattern) => pattern.test(pathname));
}

function hasInjectionPattern(req: NextRequest): boolean {
  const url = req.nextUrl.toString();
  const body = req.headers.get("content-type")?.includes("json");
  // Check query params
  for (const [key, value] of req.nextUrl.searchParams) {
    if (INJECTION_PATTERNS.some((p) => p.test(value) || p.test(key))) return true;
  }
  return false;
}

// ─── Block Response ────────────────────────────────────────────────────────
function blockResponse(reason: string, ip: string, req: NextRequest): NextResponse {
  return new NextResponse(
    JSON.stringify({
      error: "Forbidden",
      message: "Your request has been blocked.",
      reason,
    }),
    {
      status: 403,
      headers: {
        "Content-Type": "application/json",
        "X-Blocked-By": "attacklab-waf",
      },
    }
  );
}

// ─── Public Routes ─────────────────────────────────────────────────────────
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

const STATIC_PREFIXES = ["/_next/", "/favicon", "/public/", "/robots", "/sitemap", "/og-image", "/apple-touch", "/google"];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  if (STATIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (pathname.startsWith("/api/auth/")) return true;
  if (pathname === "/api/admin/setup") return true;
  if (pathname === "/") return true;
  return false;
}

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin/");
}

// ─── Middleware ─────────────────────────────────────────────────────────────
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || "unknown";
  const now = Date.now();

  // ─── Admin exemption — skip ALL protection for admin users ────────────────
  if (isAdmin(req)) {
    // Still need to do auth check for protected routes, but skip WAF entirely
    if (isPublicRoute(pathname)) {
      return NextResponse.next();
    }
    // Fall through to auth check below
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      if (isAdminRoute(pathname)) return NextResponse.redirect(new URL("/", req.url));
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    try {
      const { payload } = await jwtVerify(token, SECRET);
      const response = NextResponse.next();
      response.headers.set("x-user-id", payload.userId as string);
      response.headers.set("x-session-id", payload.sessionId as string);
      return response;
    } catch {
      if (isAdminRoute(pathname)) return NextResponse.redirect(new URL("/", req.url));
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 1. Check if IP is auto-blocked
  const block = blockList.get(ip);
  if (block && now < block.expiresAt) {
    logAttack({
      timestamp: new Date(now).toISOString(),
      ip,
      type: "auto_blocked",
      path: pathname,
      userAgent,
      method: req.method,
      details: block.reason,
    });
    return new NextResponse(
      JSON.stringify({
        error: "Forbidden",
        message: "Your IP has been temporarily blocked due to repeated violations.",
        blockedUntil: new Date(block.expiresAt).toISOString(),
      }),
      { status: 403, headers: { "Content-Type": "application/json", "X-Blocked-By": "attacklab-waf" } }
    );
  }

  // 2. Check blocked user-agents
  if (isBlockedUserAgent(userAgent)) {
    logAttack({
      timestamp: new Date(now).toISOString(),
      ip,
      type: "blocked_ua",
      path: pathname,
      userAgent,
      method: req.method,
    });
    return blockResponse("Blocked security scanner user-agent", ip, req);
  }

  // 3. Check suspicious paths
  if (isSuspiciousPath(pathname)) {
    logAttack({
      timestamp: new Date(now).toISOString(),
      ip,
      type: "suspicious_path",
      path: pathname,
      userAgent,
      method: req.method,
    });
    return blockResponse("Blocked suspicious path probe", ip, req);
  }

  // 4. Check for injection patterns in query strings
  if (hasInjectionPattern(req)) {
    logAttack({
      timestamp: new Date(now).toISOString(),
      ip,
      type: "injection",
      path: pathname,
      userAgent,
      method: req.method,
      details: `Query: ${req.nextUrl.search}`,
    });
    return blockResponse("Blocked injection attempt", ip, req);
  }

  // 5. Rate limiting
  const { allowed, retryAfter } = checkRateLimit(ip);

  if (!allowed) {
    return new NextResponse(
      JSON.stringify({
        error: "Too many requests. Please try again later.",
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(Date.now() / 1000 + (retryAfter || 60))),
        },
      }
    );
  }

  // 6. Public routes pass through
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // 7. Session check
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    if (isAdminRoute(pathname)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 8. JWT verification
  try {
    const { payload } = await jwtVerify(token, SECRET);

    if (isAdminRoute(pathname)) {
      // Protected by requireAdmin() in route handlers
    }

    const response = NextResponse.next();
    response.headers.set("x-user-id", payload.userId as string);
    response.headers.set("x-session-id", payload.sessionId as string);
    return response;
  } catch {
    if (isAdminRoute(pathname)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
