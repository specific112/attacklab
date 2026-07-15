import { validateSession } from "./auth";
import { db } from "./db";

export async function requireAuth() {
  const session = await validateSession();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: {
      roles: {
        include: { role: true },
      },
    },
  });

  if (!user || !user.isActive || user.isSuspended) return null;

  return { ...user, session };
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (!user) return null;

  const hasAdmin = user.roles.some(
    (r) => r.role.name === "ADMIN" || r.role.name === "SUPER_ADMIN"
  );

  if (!hasAdmin) return null;
  return user;
}

export async function requireSuperAdmin() {
  const user = await requireAuth();
  if (!user) return null;

  const hasSuperAdmin = user.roles.some((r) => r.role.name === "SUPER_ADMIN");
  if (!hasSuperAdmin) return null;
  return user;
}
