import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/middleware-utils";
import { success, unauthorized, notFound, error } from "@/lib/api-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const { id } = await params;
  const { attemptId, answers } = await req.json();

  if (!attemptId || !answers) return error("attemptId and answers are required");

  const attempt = await db.assessmentAttempt.findFirst({
    where: { id: attemptId, userId: user.id, assessmentId: id, status: "IN_PROGRESS" },
  });
  if (!attempt) return notFound("Attempt not found or already completed");

  const questions = await db.question.findMany({
    where: { assessmentId: id },
    include: { answerOptions: true },
  });

  let earnedPoints = 0;
  let totalPoints = 0;

  const answerPromises = [];
  for (const question of questions) {
    totalPoints += question.points;
    const userAnswer = answers.find((a: { questionId: string }) => a.questionId === question.id);

    if (userAnswer) {
      let isCorrect = false;

      if (question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") {
        const correctOption = question.answerOptions.find((o) => o.isCorrect);
        isCorrect = correctOption?.id === userAnswer.answerOptionId;
      } else if (question.type === "MULTIPLE_ANSWER") {
        const correctIds = question.answerOptions.filter((o) => o.isCorrect).map((o) => o.id).sort();
        const selectedIds = (userAnswer.selectedOptionIds || []).sort();
        isCorrect = JSON.stringify(correctIds) === JSON.stringify(selectedIds);
      } else if (question.type === "SHORT_ANSWER") {
        isCorrect = false;
      }

      if (isCorrect) earnedPoints += question.points;

      answerPromises.push(
        db.assessmentAnswer.create({
          data: {
            attemptId: attempt.id,
            questionId: question.id,
            answerOptionId: userAnswer.answerOptionId,
            textAnswer: userAnswer.textAnswer,
            isCorrect,
            points: isCorrect ? question.points : 0,
          },
        })
      );
    }
  }

  await Promise.all(answerPromises);

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const assessment = await db.assessment.findUnique({ where: { id } });
  const passed = assessment ? score >= assessment.passScore : false;

  const updatedAttempt = await db.assessmentAttempt.update({
    where: { id: attempt.id },
    data: { score, totalPoints, earnedPoints, status: "COMPLETED", completedAt: new Date() },
  });

  if (passed) {
    await db.activityLog.create({
      data: { userId: user.id, action: "ASSESSMENT_PASSED", details: { assessmentId: id, score } },
    });
  }

  return success({ ...updatedAttempt, passed });
}
