import type { Metadata } from "next";
import { db } from "../../../lib/db";

const siteUrl = "https://attacklab.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { slug } = params;
  let title = "Course";
  let description = "Learn cybersecurity with ATTACKLAB.";
  let courseExists = false;

  try {
    const course = await db.course.findUnique({
      where: { slug, isPublished: true, deletedAt: null },
      select: { title: true, description: true, shortDescription: true, difficulty: true, category: true },
    });
    if (course) {
      title = course.title;
      description = course.shortDescription || course.description?.slice(0, 160) || description;
      courseExists = true;
    }
  } catch {}

  if (!courseExists) {
    return { title: "Course Not Found", robots: { index: false } };
  }

  return {
    title,
    description,
    alternates: {
      canonical: `/courses/${slug}`,
    },
    openGraph: {
      title: `${title} | ATTACKLAB`,
      description,
      url: `${siteUrl}/courses/${slug}`,
      siteName: "ATTACKLAB",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ATTACKLAB`,
      description,
    },
  };
}

export default function CourseSlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
