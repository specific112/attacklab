import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, createSessionJWT, setSessionCookie } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://attacklab.vercel.app";

  if (error || !code) {
    return NextResponse.redirect(new URL("/login?error=google_auth_failed", appUrl));
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${appUrl}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL("/login?error=google_token_failed", appUrl));
    }

    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userRes.json();
    if (!googleUser.email) {
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
