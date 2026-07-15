import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSession, createSessionJWT, setSessionCookie, checkRateLimit } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { success, error, unauthorized, rateLimited } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rl = checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.allowed) return rateLimited();

  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0].message);

    const { email, password } = parsed.data;
    const rememberMe = body.rememberMe as boolean | undefined;
    const user = await db.user.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } },
    });

    if (!user) {
      await db.authenticationEvent.create({
        data: { email, eventType: "LOGIN", ipAddress: ip, userAgent: req.headers.get("user-agent"), success: false, details: "User not found" },
      });
      return unauthorized("Invalid email or password");
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return error("Account is temporarily locked. Please try again later.", 423);
    }

    if (user.isSuspended) {
      return error("Account has been suspended", 403);
    }

    if (!user.isActive) {
      return error("Account is deactivated", 403);
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      const newCount = user.failedLoginCount + 1;
      const lockUntil = newCount >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await db.user.update({
        where: { id: user.id },
        data: { failedLoginCount: newCount, lockedUntil: lockUntil },
      });
      await db.authenticationEvent.create({
        data: { userId: user.id, email, eventType: "LOGIN", ipAddress: ip, userAgent: req.headers.get("user-agent"), success: false, details: `Failed attempt ${newCount}` },
      });
      return unauthorized("Invalid email or password");
    }

    await db.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    const session = await createSession(user.id, ip, req.headers.get("user-agent") || undefined, body.rememberMe);
    const jwt = await createSessionJWT(session.sessionId, user.id);
    await setSessionCookie(jwt, session.expiresAt);

    await db.authenticationEvent.create({
      data: { userId: user.id, email, eventType: "LOGIN", ipAddress: ip, userAgent: req.headers.get("user-agent"), success: true },
    });

    return success({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        emailVerified: !!user.emailVerified,
        roles: user.roles.map((r) => r.role.name),
      },
    });
  } catch (e) {
    console.error("Login error:", e);
    return error("Login failed", 500);
  }
}
