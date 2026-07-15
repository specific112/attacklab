import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, generateToken, createSessionJWT, setSessionCookie } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { registerSchema } from "@/lib/validation";
import { success, error, conflict, rateLimited } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rl = checkRateLimit(`register:${ip}`, 15, 15 * 60 * 1000);
  if (!rl.allowed) return rateLimited();

  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0].message);

    const { displayName, username, email, password } = parsed.data;

    const existing = await db.user.findFirst({ where: { OR: [{ email }, { username }] } });
    if (existing) {
      if (existing.email === email) return conflict("Email already registered");
      return conflict("Username already taken");
    }

    const passwordHash = await hashPassword(password);
    const verificationToken = generateToken();

    const user = await db.user.create({
      data: {
        email,
        username,
        displayName,
        passwordHash,
        verificationTokens: {
          create: {
            token: verificationToken,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        },
        roles: {
          create: { roleId: (await db.role.findUnique({ where: { name: "STUDENT" } }))!.id },
        },
      },
    });

    await sendVerificationEmail(email, verificationToken, displayName);

    const session = await db.session.create({
      data: {
        token: require("crypto").createHash("sha256").update(verificationToken).digest("hex"),
        userId: user.id,
        ipAddress: ip,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const jwt = await createSessionJWT(session.id, user.id);
    await setSessionCookie(jwt, session.expiresAt);

    await db.authenticationEvent.create({
      data: { userId: user.id, email, eventType: "REGISTER", ipAddress: ip, success: true },
    });

    return success({
      user: { id: user.id, email: user.email, username: user.username, displayName: user.displayName },
      emailVerified: false,
    }, 201);
  } catch (e) {
    console.error("Register error:", e);
    return error("Registration failed", 500);
  }
}
