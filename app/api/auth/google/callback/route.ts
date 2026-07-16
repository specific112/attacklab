import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, createSessionJWT, setSessionCookie } from "@/lib/auth";

function getAppUrl(req: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured;
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest) {
  const appUrl = getAppUrl(req);
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    console.error("Google OAuth error:", error, errorDescription);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, appUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code_from_google", appUrl));
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL("/login?error=google_not_configured", appUrl));
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${appUrl}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errorBody = await tokenRes.text();
      console.error("Google token exchange failed:", tokenRes.status, errorBody);
      return NextResponse.redirect(new URL("/login?error=google_token_failed", appUrl));
    }

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("No access_token in Google response:", tokenData);
      return NextResponse.redirect(new URL("/login?error=google_token_failed", appUrl));
    }

    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      console.error("Google userinfo request failed:", userRes.status);
      return NextResponse.redirect(new URL("/login?error=google_userinfo_failed", appUrl));
    }

    const googleUser = await userRes.json();
    if (!googleUser.email) {
      console.error("No email in Google user response:", googleUser);
      return NextResponse.redirect(new URL("/login?error=no_email", appUrl));
    }

    let user = await db.user.findFirst({
      where: { OR: [{ email: googleUser.email }, { username: googleUser.email.split("@")[0] }] },
      include: { roles: { include: { role: true } } },
    });

    if (user) {
      user = await db.user.update({
        where: { id: user.id },
        data: {
          avatarUrl: googleUser.picture || user.avatarUrl,
          emailVerified: user.emailVerified || new Date(),
          lastLoginAt: new Date(),
        },
        include: { roles: { include: { role: true } } },
      });
    } else {
      const username = googleUser.email.split("@")[0] + "_" + Date.now().toString(36);
      user = await db.user.create({
        data: {
          email: googleUser.email,
          username,
          displayName: googleUser.name || "Google User",
          passwordHash: "google-oauth",
          avatarUrl: googleUser.picture,
          emailVerified: new Date(),
          roles: {
            create: { roleId: (await db.role.findUnique({ where: { name: "STUDENT" } }))!.id },
          },
        },
        include: { roles: { include: { role: true } } },
      });
    }

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const session = await createSession(user.id, ip, req.headers.get("user-agent") || undefined, true);
    const jwt = await createSessionJWT(session.sessionId, user.id);
    await setSessionCookie(jwt, session.expiresAt);

    await db.authenticationEvent.create({
      data: { userId: user.id, email: googleUser.email, eventType: "LOGIN", ipAddress: ip, userAgent: req.headers.get("user-agent"), success: true, details: "Google OAuth" },
    });

    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdmin = adminEmail && googleUser.email === adminEmail;

    return NextResponse.redirect(new URL(isAdmin ? "/admin" : "/dashboard", appUrl));
  } catch (e) {
    console.error("Google OAuth error:", e);
    return NextResponse.redirect(new URL("/login?error=google_error", appUrl));
  }
}
