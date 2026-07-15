import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/middleware-utils";
import { success, unauthorized, notFound, error } from "@/lib/api-response";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const { id } = await params;
  const assessment = await db.assessment.findUnique({ where: { id } });
  if (!assessment) return notFound("Assessment not found");

  const attempts = await db.assessmentAttempt.count({ where: { userId: user.id, assessmentId: id } });
  if (assessment.maxAttempts && attempts >= assessment.maxAttempts) {
    return error("Maximum attempts reached");
  }

  const inProgress = await db.assessmentAttempt.findFirst({
    where: { userId: user.id, assessmentId: id, status: "IN_PROGRESS" },
  });
  if (inProgress) return success(inProgress);

  const attempt = await db.assessmentAttempt.create({
    data: { userId: user.id, assessmentId: id },
  });

  return success(attempt, 201);
}
