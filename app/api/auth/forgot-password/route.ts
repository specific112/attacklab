import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { generateToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { forgotPasswordSchema } from "@/lib/validation";
import { success, error, rateLimited } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rl = checkRateLimit(`forgot-pw:${ip}`, 3, 60 * 60 * 1000);
  if (!rl.allowed) return rateLimited();

  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0].message);

    const user = await db.user.findUnique({ where: { email: parsed.data.email } });

    // Always return success to prevent email enumeration
    if (!user) return success({ message: "If an account exists, a reset link has been sent" });

    const token = generateToken();
    await db.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });

    await sendPasswordResetEmail(user.email, token, user.displayName);
    return success({ message: "If an account exists, a reset link has been sent" });
  } catch (e) {
    console.error("Forgot password error:", e);
    return error("Failed to process request", 500);
  }
}
