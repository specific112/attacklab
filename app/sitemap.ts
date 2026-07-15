import type { MetadataRoute } from "next";
import { db } from "../lib/db";

const siteUrl = "https://attacklab.vercel.app";

const staticRoutes = [
  { path: "", priority: 1.0, changeFrequency: "daily" as const },
  { path: "/courses", priority: 0.95, changeFrequency: "daily" as const },
  { path: "/learn", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/labs", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/programs", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/about", priority: 0.85, changeFrequency: "monthly" as const },
  { path: "/pricing", priority: 0.85, changeFrequency: "monthly" as const },
  { path: "/challenges", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/community", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/features", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/certifications", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/blog", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/leaderboard", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/reports", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/docs", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/careers", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/faq", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/security", priority: 0.6, changeFrequency: "monthly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = staticRoutes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Dynamically include published course pages
  let courseEntries: MetadataRoute.Sitemap = [];
  try {
    const courses = await db.course.findMany({
      where: { isPublished: true, deletedAt: null },
      select: { slug: true, updatedAt: true },
      orderBy: { sortOrder: "asc" },
    });
    courseEntries = courses.map((course) => ({
      url: `${siteUrl}/courses/${course.slug}`,
      lastModified: course.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }));
  } catch {
    // Database may not be available during build
  }

  return [...staticEntries, ...courseEntries];
}
