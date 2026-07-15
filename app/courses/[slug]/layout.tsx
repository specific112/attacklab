import type { Metadata } from "next";
import { db } from "../../../lib/db";

const siteUrl = "https://attacklab.vercel.app";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const course = await db.course.findUnique({
      where: { slug: params.slug },
      select: { title: true, description: true, shortDescription: true, category: true, difficulty: true },
    });

    if (!course) {
      return { title: "Course Not Found", description: "This course could not be found on ATTACKLAB." };
    }

    const title = `${course.title} — ${course.difficulty} Cybersecurity Course`;
    const desc = course.shortDescription || course.description;

    return {
      title,
      description: desc,
      alternates: { canonical: `/courses/${params.slug}` },
      openGraph: {
        title: `${course.title} | ATTACKLAB`,
        description: desc,
        url: `${siteUrl}/courses/${params.slug}`,
        type: "article",
      },
    };
  } catch {
    return { title: "ATTACKLAB Course", description: "Cybersecurity course on ATTACKLAB." };
  }
}

export default function CourseSlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
