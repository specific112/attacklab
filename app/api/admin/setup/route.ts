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

    // 3. Create YOUR personal admin account
    const adminEmail = "samadspecific112@gmail.com";
    const adminHash = await hashPassword("ABDULsamad112");
    const superAdminRole = await db.role.findUnique({ where: { name: "SUPER_ADMIN" } });

    const existing = await db.user.findUnique({ where: { email: adminEmail } });
    let adminCreated = false;
    if (!existing) {
      // Find a unique username
      let username = "samadspecific";
      let counter = 1;
      while (await db.user.findUnique({ where: { username } })) {
        username = "samadspecific" + counter;
        counter++;
      }
      const adminUser = await db.user.create({
        data: {
          email: adminEmail,
          username,
          displayName: "ATTACKLAB Owner",
          passwordHash: adminHash,
          emailVerified: new Date(),
        },
      });
      if (superAdminRole) {
        await db.userRole.create({ data: { userId: adminUser.id, roleId: superAdminRole.id } });
      }
      adminCreated = true;
    } else {
      // Update password in case it was changed
      await db.user.update({
        where: { email: adminEmail },
        data: { passwordHash: adminHash, emailVerified: new Date() },
      });
      // Make sure SUPER_ADMIN role exists
      if (superAdminRole) {
        const userRole = await db.userRole.findFirst({ where: { userId: existing.id, roleId: superAdminRole.id } });
        if (!userRole) {
          await db.userRole.create({ data: { userId: existing.id, roleId: superAdminRole.id } });
        }
      }
    }

    // 4. Also create the old admin account as backup
    const oldAdminEmail = "admin@attacklab.com";
    const oldExisting = await db.user.findUnique({ where: { email: oldAdminEmail } });
    if (!oldExisting) {
      const oldHash = await hashPassword("Admin@123");
      const oldAdmin = await db.user.create({
        data: {
          email: oldAdminEmail,
          username: "admin",
          displayName: "ATTACKLAB Admin",
          passwordHash: oldHash,
          emailVerified: new Date(),
        },
      });
      if (superAdminRole) {
        await db.userRole.create({ data: { userId: oldAdmin.id, roleId: superAdminRole.id } });
      }
    }

    // 5. Create courses if none exist
    const courseCount = await db.course.count();
    let coursesCreated = 0;
    if (courseCount === 0) {
      const courses = [
        { title: "Cybersecurity Fundamentals", slug: "cybersecurity-fundamentals", description: "Master core cybersecurity concepts.", shortDescription: "The essential foundation.", difficulty: "BEGINNER", category: "Fundamentals", sortOrder: 1 },
        { title: "Computer Networking", slug: "computer-networking", description: "Build deep networking knowledge.", shortDescription: "Understand networks.", difficulty: "BEGINNER", category: "Networking", sortOrder: 2 },
        { title: "Linux Fundamentals", slug: "linux-fundamentals", description: "Master Linux from the ground up.", shortDescription: "Essential Linux skills.", difficulty: "BEGINNER", category: "Linux", sortOrder: 3 },
        { title: "Web Application Security", slug: "web-application-security", description: "Learn web application vulnerabilities.", shortDescription: "Defend web apps.", difficulty: "INTERMEDIATE", category: "Web Security", sortOrder: 4 },
        { title: "Kali Linux Deep Dive", slug: "kali-linux-deep-dive", description: "Advanced Kali Linux usage.", shortDescription: "Advanced Kali.", difficulty: "INTERMEDIATE", category: "Tools", sortOrder: 5 },
        { title: "Nmap Mastery", slug: "nmap-mastery", description: "Master Nmap network scanner.", shortDescription: "Master Nmap.", difficulty: "INTERMEDIATE", category: "Tools", sortOrder: 6 },
        { title: "Metasploit Framework", slug: "metasploit-framework", description: "Master the exploitation framework.", shortDescription: "Metasploit mastery.", difficulty: "ADVANCED", category: "Tools", sortOrder: 7 },
        { title: "Bug Bounty Hunting", slug: "bug-bounty-hunting", description: "Become an effective bug bounty hunter.", shortDescription: "Earn from bounties.", difficulty: "INTERMEDIATE", category: "Bug Bounty", sortOrder: 8 },
        { title: "OSINT Mastery", slug: "osint-mastery", description: "Master Open Source Intelligence.", shortDescription: "OSINT skills.", difficulty: "INTERMEDIATE", category: "OSINT", sortOrder: 9 },
      ];

      for (const c of courses) {
        const course = await db.course.create({
          data: { ...c, objectives: ["Learn core concepts", "Apply practical skills"], prerequisites: [], estimatedHours: 20, isPublished: true },
        });
        const mod = await db.module.create({
          data: { courseId: course.id, title: "Module 1: Introduction", sortOrder: 0, isPublished: true },
        });
        await db.lesson.create({ data: { moduleId: mod.id, title: "Getting Started", sortOrder: 0, isPublished: true, content: "Welcome to " + c.title + ". This lesson introduces the key concepts." } });
        await db.lesson.create({ data: { moduleId: mod.id, title: "Core Concepts", sortOrder: 1, isPublished: true, content: "Learn the fundamental concepts of " + c.title.toLowerCase() + "." } });
        await db.lesson.create({ data: { moduleId: mod.id, title: "Hands-On Practice", sortOrder: 2, isPublished: true, content: "Apply what you learned with practical exercises." } });
        coursesCreated++;
      }
    }

    // 6. Create labs if none exist
    const labCount = await db.lab.count();
    let labsCreated = 0;
    if (labCount === 0) {
      const labs = [
        { slug: "linux-fundamentals-lab", title: "Linux Fundamentals Lab", description: "Practice Linux commands.", difficulty: "BEGINNER", category: "Linux" },
        { slug: "network-essentials-lab", title: "Network Essentials Lab", description: "Explore networking concepts.", difficulty: "BEGINNER", category: "Network" },
        { slug: "web-security-lab", title: "Web Application Security Lab", description: "Identify web vulnerabilities.", difficulty: "INTERMEDIATE", category: "Web Security" },
        { slug: "nmap-scanning-lab", title: "Nmap Scanning Lab", description: "Master Nmap scanning.", difficulty: "INTERMEDIATE", category: "Tools" },
        { slug: "sql-injection-lab", title: "SQL Injection Lab", description: "Practice SQL injection.", difficulty: "INTERMEDIATE", category: "Web Security" },
        { slug: "xss-lab", title: "Cross-Site Scripting Lab", description: "Practice XSS attacks.", difficulty: "INTERMEDIATE", category: "Web Security" },
      ];
      for (const l of labs) {
        await db.lab.create({
          data: { ...l, instructions: "Complete the exercises.", objectives: ["Learn practical skills"], isPublished: true, hints: ["Start with enumeration"] },
        });
        labsCreated++;
      }
    }

    return success({
      message: "Setup complete!",
      admin: "Admin: samadspecific112@gmail.com / ABDULsamad112",
      courses: coursesCreated > 0 ? coursesCreated + " courses created" : courseCount + " courses exist",
      labs: labsCreated > 0 ? labsCreated + " labs created" : labCount + " labs exist",
    });
  } catch (e) {
    console.error("Setup error:", e);
    return error("Setup failed: " + (e instanceof Error ? e.message : String(e)), 500);
  }
}
