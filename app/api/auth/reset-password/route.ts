import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validation";
import { success, error } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0].message);

    const resetToken = await db.passwordResetToken.findUnique({ where: { token: parsed.data.token } });
    if (!resetToken) return error("Invalid reset token");
    if (resetToken.usedAt) return error("Token already used");
    if (resetToken.expiresAt < new Date()) return error("Token has expired");

    const passwordHash = await hashPassword(parsed.data.password);

    await db.$transaction([
      db.user.update({ where: { id: resetToken.userId }, data: { passwordHash, failedLoginCount: 0, lockedUntil: null } }),
      db.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
      db.session.updateMany({ where: { userId: resetToken.userId, isActive: true }, data: { isActive: false } }),
    ]);

    return success({ message: "Password reset successfully" });
  } catch (e) {
    console.error("Reset password error:", e);
    return error("Password reset failed", 500);
  }
}
