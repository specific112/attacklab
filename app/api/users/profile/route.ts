import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/middleware-utils";
import { db } from "@/lib/db";
import { success, unauthorized, error } from "@/lib/api-response";

export async function GET() {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const profile = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true, email: true, username: true, displayName: true, avatarUrl: true, bio: true,
      emailVerified: true, createdAt: true, lastLoginAt: true,
      roles: { include: { role: true } },
      _count: { select: { enrollments: true, certificates: true } },
    },
  });

  return success(profile);
}

export async function PUT(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const { displayName, bio, avatarUrl } = await req.json();

  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      ...(displayName && { displayName }),
      ...(bio !== undefined && { bio }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    },
    select: { id: true, displayName: true, bio: true, avatarUrl: true },
  });

  return success(updated);
}
