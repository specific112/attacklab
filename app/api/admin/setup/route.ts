import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { success, error, forbidden } from "@/lib/api-response";

const SETUP_SECRET = "attacklab-setup-2026";

export async function POST(req: NextRequest) {
  try {
    const { secret } = await req.json();
    if (secret !== SETUP_SECRET) return forbidden("Invalid setup key");

    // 1. Create roles
    const roleNames = ["STUDENT", "INSTRUCTOR", "MODERATOR", "ADMIN", "SUPER_ADMIN"];
    for (const name of roleNames) {
      await db.role.upsert({ where: { name }, update: {}, create: { name, description: name + " role" } });
    }

    // 2. Create subscription plans
    const plans = [
      { slug: "free", name: "Free", priceMonthly: 0, priceYearly: 0, features: ["Access to free courses"], maxCourses: 5, maxLabs: 3, sortOrder: 0 },
      { slug: "beginner", name: "Beginner", priceMonthly: 1900, priceYearly: 19000, features: ["All courses", "Labs"], maxCourses: 20, maxLabs: 10, sortOrder: 1 },
      { slug: "professional", name: "Professional", priceMonthly: 4900, priceYearly: 49000, features: ["Everything"], maxCourses: -1, maxLabs: -1, sortOrder: 2 },
      { slug: "premium", name: "Premium", priceMonthly: 9900, priceYearly: 99000, features: ["Everything + mentoring"], maxCourses: -1, maxLabs: -1, sortOrder: 3 },
    ];
    for (const p of plans) {
      await db.subscriptionPlan.upsert({ where: { slug: p.slug }, update: {}, create: { ...p, description: p.name + " plan", currency: "USD", isActive: true } });
    }

    // 3. Create admin user
    const adminEmail = "admin@attacklab.com";
    const adminHash = await hashPassword("Admin@123");
    const superAdminRole = await db.role.findUnique({ where: { name: "SUPER_ADMIN" } });

    const existing = await db.user.findUnique({ where: { email: adminEmail } });
    let adminCreated = false;
    if (!existing) {
      const adminUser = await db.user.create({
        data: {
          email: adminEmail,
          username: "admin",
          displayName: "ATTACKLAB Admin",
          passwordHash: adminHash,
          emailVerified: new Date(),
        },
      });
      if (superAdminRole) {
        await db.userRole.create({ data: { userId: adminUser.id, roleId: superAdminRole.id } });
      }
      adminCreated = true;
    }

    // 4. Create sample course if none exist
    const courseCount = await db.course.count();
    let courseCreated = false;
    if (courseCount === 0) {
      const course = await db.course.create({
        data: {
          title: "Cybersecurity Fundamentals",
          slug: "cybersecurity-fundamentals",
          description: "Master core cybersecurity concepts. The CIA triad, threat modeling, and security principles.",
          shortDescription: "The essential foundation for any cybersecurity career.",
          difficulty: "BEGINNER",
          category: "Fundamentals",
          objectives: ["Understand the CIA Triad", "Identify common threats", "Apply ethical security principles"],
          prerequisites: [],
          estimatedHours: 20,
          sortOrder: 1,
          isPublished: true,
        },
      });
      const mod = await db.module.create({
        data: { courseId: course.id, title: "Introduction to Cybersecurity", sortOrder: 0, isPublished: true },
      });
      await db.lesson.create({ data: { moduleId: mod.id, title: "What is Cybersecurity?", sortOrder: 0, isPublished: true, content: "Cybersecurity is the practice of protecting systems, networks, and programs from digital attacks." } });
      await db.lesson.create({ data: { moduleId: mod.id, title: "The CIA Triad", sortOrder: 1, isPublished: true, content: "Confidentiality, Integrity, and Availability form the foundation of information security." } });
      await db.lesson.create({ data: { moduleId: mod.id, title: "Career Paths in Security", sortOrder: 2, isPublished: true, content: "Explore careers in penetration testing, incident response, security engineering, and more." } });
      courseCreated = true;
    }

    // 5. Create sample lab if none exist
    const labCount = await db.lab.count();
    let labCreated = false;
    if (labCount === 0) {
      await db.lab.create({
        data: {
          slug: "linux-fundamentals-lab",
          title: "Linux Fundamentals Lab",
          description: "Practice basic Linux commands and file permissions.",
          difficulty: "BEGINNER",
          category: "Linux",
          instructions: "Complete the Linux exercises in the lab environment.",
          objectives: ["Navigate filesystem", "Manage permissions"],
          isPublished: true,
          hints: ["Start with ls and cd"],
        },
      });
      labCreated = true;
    }

    return success({
      message: "Setup complete!",
      admin: adminCreated ? "Admin user created (admin@attacklab.com / Admin@123)" : "Admin user already exists",
      courses: courseCreated ? "Sample course created" : courseCount + " courses already exist",
      labs: labCreated ? "Sample lab created" : labCount + " labs already exist",
    });
  } catch (e) {
    console.error("Setup error:", e);
    return error("Setup failed: " + (e instanceof Error ? e.message : String(e)), 500);
  }
}
