import { requireAdmin } from "@/lib/middleware-utils";
import { db } from "@/lib/db";
import { success, forbidden } from "@/lib/api-response";

export async function GET() {
  const user = await requireAdmin();
  if (!user) return forbidden("Admin access required");

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalUsers, verifiedUsers, unverifiedUsers, activeUsers, suspendedUsers,
    totalEnrollments, totalCourses, totalLabs, totalAssessments,
    recentLogins, failedLogins, recentPayments, totalRevenue,
    recentUsers, todayActivity, totalActivity,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { emailVerified: { not: null } } }),
    db.user.count({ where: { emailVerified: null } }),
    db.user.count({ where: { isActive: true, isSuspended: false } }),
    db.user.count({ where: { isSuspended: true } }),
    db.enrollment.count(),
    db.course.count({ where: { deletedAt: null } }),
    db.lab.count(),
    db.assessment.count(),
    db.authenticationEvent.count({ where: { eventType: "LOGIN", success: true, createdAt: { gte: thirtyDaysAgo } } }),
    db.authenticationEvent.count({ where: { success: false, createdAt: { gte: thirtyDaysAgo } } }),
    db.payment.count({ where: { status: "COMPLETED" } }),
    db.payment.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true, email: true, displayName: true, username: true,
        createdAt: true, lastLoginAt: true, emailVerified: true,
        isSuspended: true, isActive: true,
        _count: { select: { enrollments: true, lessonProgress: true, assessmentAttempts: true } },
      },
    }),
    db.activityLog.count({ where: { createdAt: { gte: todayStart } } }),
    db.activityLog.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
  ]);

  const usersByDay = await db.user.groupBy({
    by: ["createdAt"],
    _count: true,
    where: { createdAt: { gte: thirtyDaysAgo } },
    orderBy: { createdAt: "asc" },
  });

  return success({
    users: {
      total: totalUsers, verified: verifiedUsers, unverified: unverifiedUsers,
      active: activeUsers, suspended: suspendedUsers,
      recent: recentUsers,
    },
    platform: { courses: totalCourses, enrollments: totalEnrollments, labs: totalLabs, assessments: totalAssessments },
    auth: { recentLogins, failedLogins },
    payments: { total: recentPayments, revenue: totalRevenue._sum.amount || 0 },
    guests: { totalVisits: totalActivity, todayVisits: todayActivity, uniqueVisitors: totalUsers },
    registrationsByDay: usersByDay,
  });
}
