import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) return error("Token is required");

    const verificationToken = await db.emailVerificationToken.findUnique({ where: { token } });
    if (!verificationToken) return error("Invalid verification token");
    if (verificationToken.usedAt) return error("Token already used");
    if (verificationToken.expiresAt < new Date()) return error("Token has expired");

    await db.$transaction([
      db.user.update({ where: { id: verificationToken.userId }, data: { emailVerified: new Date() } }),
      db.emailVerificationToken.update({ where: { id: verificationToken.id }, data: { usedAt: new Date() } }),
    ]);

    return success({ message: "Email verified successfully" });
  } catch (e) {
    console.error("Verify email error:", e);
    return error("Verification failed", 500);
  }
}
