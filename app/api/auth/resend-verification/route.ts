import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { generateToken } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { success, error, rateLimited, notFound } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rl = checkRateLimit(`resend-verify:${ip}`, 3, 60 * 60 * 1000);
  if (!rl.allowed) return rateLimited();

  try {
    const { email } = await req.json();
    if (!email) return error("Email is required");

    const user = await db.user.findUnique({ where: { email } });
    if (!user) return notFound("User not found");
    if (user.emailVerified) return error("Email already verified");

    const token = generateToken();
    await db.emailVerificationToken.create({
      data: { token, userId: user.id, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    });

    await sendVerificationEmail(email, token, user.displayName);
    return success({ message: "Verification email sent" });
  } catch (e) {
    console.error("Resend verification error:", e);
    return error("Failed to resend verification", 500);
  }
}
