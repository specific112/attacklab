import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "./db";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "crypto";

const SESSION_COOKIE = "attacklab_session";
const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || "fallback-secret-change-me");

export interface SessionPayload {
  userId: string;
  sessionId: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string, ipAddress?: string, userAgent?: string, rememberMe = false) {
  const days = rememberMe
    ? parseInt(process.env.REMEMBER_ME_EXPIRY_DAYS || "30")
    : parseInt(process.env.SESSION_EXPIRY_DAYS || "7");
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const token = generateToken();

  const session = await db.session.create({
    data: {
      token: createHash("sha256").update(token).digest("hex"),
      userId,
      ipAddress,
      userAgent,
      expiresAt,
    },
  });

  return { token, sessionId: session.id, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSessionJWT(sessionId: string, userId: string) {
  const token = await new SignJWT({ userId, sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.SESSION_EXPIRY_DAYS + "d" || "7d")
    .sign(SECRET);
  return token;
}

export async function validateSession(): Promise<{ userId: string; sessionId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const userId = payload.userId as string;
    const sessionId = payload.sessionId as string;

    const session = await db.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || !session.isActive || session.expiresAt < new Date()) {
      return null;
    }

    await db.session.update({
      where: { id: sessionId },
      data: { lastActiveAt: new Date() },
    });

    return { userId, sessionId };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    await db.session.updateMany({
      where: { id: payload.sessionId as string },
      data: { isActive: false },
    });
  } catch {}

  cookieStore.delete(SESSION_COOKIE);
}

export async function destroyAllSessions(userId: string) {
  await db.session.updateMany({
    where: { userId },
    data: { isActive: false },
  });
}

export function checkRateLimit(key: string, maxAttempts: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const store = globalThis as unknown as { rateLimits?: Map<string, { count: number; resetAt: number }> };
  if (!store.rateLimits) store.rateLimits = new Map();

  const entry = store.rateLimits.get(key);
  if (!entry || now > entry.resetAt) {
    store.rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  entry.count++;
  if (entry.count > maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: maxAttempts - entry.count };
}

export function isAdmin(roles: { role: { name: string }[] }, email?: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && email === adminEmail) return true;
  return roles.role?.some((r) => r.name === "ADMIN" || r.name === "SUPER_ADMIN") ?? false;
}
