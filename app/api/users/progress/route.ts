import { requireAuth } from "@/lib/middleware-utils";
import { db } from "@/lib/db";
import { success, unauthorized } from "@/lib/api-response";

export async function GET() {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const [enrollments, lessonProgress, assessmentAttempts, labProgress, streaks, certificates] = await Promise.all([
    db.enrollment.findMany({
      where: { userId: user.id },
      include: {
        course: {
          select: { id: true, title: true, slug: true, thumbnailUrl: true, category: true, difficulty: true },
        },
      },
    }),
    db.lessonProgress.findMany({
      where: { userId: user.id },
      include: { lesson: { select: { id: true, title: true, moduleId: true } } },
    }),
    db.assessmentAttempt.findMany({
      where: { userId: user.id, status: "COMPLETED" },
      include: { assessment: { select: { id: true, title: true, passScore: true } } },
      orderBy: { completedAt: "desc" },
      take: 10,
    }),
    db.labProgress.findMany({
      where: { userId: user.id },
      include: { lab: { select: { id: true, title: true, category: true } } },
    }),
    db.learningStreak.findUnique({ where: { userId: user.id } }),
    db.certificate.findMany({
      where: { userId: user.id },
      include: { course: { select: { title: true } } },
    }),
  ]);

  const totalLessons = lessonProgress.length;
  const completedLessons = lessonProgress.filter((lp) => lp.status === "COMPLETED").length;

  return success({
    enrollments,
    lessonProgress,
    assessmentAttempts,
    labProgress,
    streak: streaks || { currentStreak: 0, longestStreak: 0 },
    certificates,
    stats: {
      totalEnrollments: enrollments.length,
      completedLessons,
      totalLessons,
      completionRate: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      certificatesEarned: certificates.length,
    },
  });
}
