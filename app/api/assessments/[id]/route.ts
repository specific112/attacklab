import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/middleware-utils";
import { success, unauthorized, notFound } from "@/lib/api-response";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const { id } = await params;
  const assessment = await db.assessment.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { sortOrder: "asc" },
        include: { answerOptions: { orderBy: { sortOrder: "asc" }, select: { id: true, text: true, sortOrder: true } } },
      },
      _count: { select: { questions: true, attempts: true } },
    },
  });

  if (!assessment) return notFound("Assessment not found");

  const attempts = await db.assessmentAttempt.findMany({
    where: { userId: user.id, assessmentId: id },
    orderBy: { startedAt: "desc" },
  });

  const bestScore = attempts.filter((a) => a.score !== null).reduce((max, a) => Math.max(max, a.score || 0), 0);

  return success({
    id: assessment.id,
    title: assessment.title,
    description: assessment.description,
    type: assessment.type,
    passScore: assessment.passScore,
    timeLimit: assessment.timeLimit,
    maxAttempts: assessment.maxAttempts,
    totalQuestions: assessment.questions.length,
    totalPoints: assessment.questions.reduce((sum, q) => sum + q.points, 0),
    attemptsUsed: attempts.length,
    bestScore,
    canAttempt: !assessment.maxAttempts || attempts.length < assessment.maxAttempts,
    questions: assessment.showAnswersAfter ? assessment.questions : undefined,
  });
}
