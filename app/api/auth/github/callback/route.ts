import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, createSessionJWT, setSessionCookie } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

  if (error || !code) {
    return NextResponse.redirect(new URL(`/login?error=github_auth_failed`, appUrl));
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL("/login?error=github_token_failed", appUrl));
    }

    // Fetch GitHub user info
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: "application/vnd.github.v3+json" },
    });
    const githubUser = await userRes.json();

    // Fetch primary email
    const emailRes = await fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: "application/vnd.github.v3+json" },
    });
    const emails = await emailRes.json();
    const primaryEmail = emails.find((e: { primary: boolean; verified: boolean }) => e.primary && e.verified)?.email || emails[0]?.email;

    if (!primaryEmail) {
      return NextResponse.redirect(new URL("/login?error=no_email", appUrl));
    }

    // Find or create user
    let user = await db.user.findFirst({
      where: { OR: [{ email: primaryEmail }, { username: githubUser.login }] },
      include: { roles: { include: { role: true } } },
    });

    if (user) {
      // Update existing user with GitHub info
      user = await db.user.update({
        where: { id: user.id },
        data: {
          avatarUrl: githubUser.avatar_url,
          emailVerified: user.emailVerified || new Date(),
          lastLoginAt: new Date(),
        },
        include: { roles: { include: { role: true } } },
      });
    } else {
      // Create new user
      const username = githubUser.login || `user_${Date.now()}`;
      user = await db.user.create({
        data: {
          email: primaryEmail,
          username,
          displayName: githubUser.name || githubUser.login || "GitHub User",
          passwordHash: "github-oauth",
          avatarUrl: githubUser.avatar_url,
          emailVerified: new Date(),
          roles: {
            create: { roleId: (await db.role.findUnique({ where: { name: "STUDENT" } }))!.id },
          },
        },
        include: { roles: { include: { role: true } } },
      });
    }

    // Create session
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const session = await createSession(user.id, ip, req.headers.get("user-agent") || undefined, true);
    const jwt = await createSessionJWT(session.sessionId, user.id);
    await setSessionCookie(jwt, session.expiresAt);

    // Log event
    await db.authenticationEvent.create({
      data: { userId: user.id, email: primaryEmail, eventType: "LOGIN", ipAddress: ip, userAgent: req.headers.get("user-agent"), success: true, details: "GitHub OAuth" },
    });

    // Check if admin
    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdmin = adminEmail && primaryEmail === adminEmail;

    return NextResponse.redirect(new URL(isAdmin ? "/admin" : "/dashboard", appUrl));
  } catch (e) {
    console.error("GitHub OAuth error:", e);
    return NextResponse.redirect(new URL("/login?error=github_error", appUrl));
  }
}
