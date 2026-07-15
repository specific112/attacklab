import { requireAuth } from "@/lib/middleware-utils";
import { success, unauthorized } from "@/lib/api-response";

export async function GET() {
  const user = await requireAuth();
  if (!user) return unauthorized();

  return success({
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    emailVerified: !!user.emailVerified,
    isActive: user.isActive,
    createdAt: user.createdAt,
    roles: user.roles.map((r) => r.role.name),
  });
}
