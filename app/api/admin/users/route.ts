import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/middleware-utils";
import { db } from "@/lib/db";
import { success, forbidden, error } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return forbidden("Admin access required");

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const role = searchParams.get("role");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { username: { contains: search, mode: "insensitive" } },
      { displayName: { contains: search, mode: "insensitive" } },
    ];
  }
  if (role) {
    where.roles = { some: { role: { name: role } } };
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true, email: true, username: true, displayName: true, emailVerified: true,
        isActive: true, isSuspended: true, lastLoginAt: true, createdAt: true,
        roles: { include: { role: true } },
        _count: { select: { enrollments: true, authenticationEvents: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.user.count({ where }),
  ]);

  return success({ users, total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return forbidden("Admin access required");

  const { userId, action, value, roleName } = await req.json();

  switch (action) {
    case "suspend":
      await db.user.update({ where: { id: userId }, data: { isSuspended: true, suspensionReason: value } });
      break;
    case "unsuspend":
      await db.user.update({ where: { id: userId }, data: { isSuspended: false, suspensionReason: null } });
      break;
    case "deactivate":
      await db.user.update({ where: { id: userId }, data: { isActive: false } });
      break;
    case "activate":
      await db.user.update({ where: { id: userId }, data: { isActive: true } });
      break;
    case "verify-email":
      await db.user.update({ where: { id: userId }, data: { emailVerified: new Date() } });
      break;
    case "assign-role": {
      const role = await db.role.findUnique({ where: { name: roleName } });
      if (!role) return error("Role not found");
      await db.userRole.upsert({
        where: { userId_roleId: { userId, roleId: role.id } },
        update: {},
        create: { userId, roleId: role.id },
      });
      break;
    }
    case "remove-role": {
      const r = await db.role.findUnique({ where: { name: roleName } });
      if (r) {
        await db.userRole.deleteMany({ where: { userId, roleId: r.id } });
      }
      break;
    }
  }

  await db.auditLog.create({
    data: { userId: admin.id, actorEmail: admin.email, action: `USER_${action.toUpperCase()}`, resource: "user", resourceId: userId, details: { value, roleName }, ipAddress: req.headers.get("x-forwarded-for") || undefined },
  });

  return success({ message: `Action ${action} completed` });
}
