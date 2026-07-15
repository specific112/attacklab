import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ─── Roles ───
  const student = await prisma.role.upsert({ where: { name: "STUDENT" }, update: {}, create: { name: "STUDENT", description: "Regular student" } });
  const instructor = await prisma.role.upsert({ where: { name: "INSTRUCTOR" }, update: {}, create: { name: "INSTRUCTOR", description: "Course instructor" } });
  const moderator = await prisma.role.upsert({ where: { name: "MODERATOR" }, update: {}, create: { name: "MODERATOR", description: "Community moderator" } });
  const admin = await prisma.role.upsert({ where: { name: "ADMIN" }, update: {}, create: { name: "ADMIN", description: "Administrator" } });
  const superAdmin = await prisma.role.upsert({ where: { name: "SUPER_ADMIN" }, update: {}, create: { name: "SUPER_ADMIN", description: "Super administrator" } });

  // ─── Permissions ───
  const perms = [
    ["courses", "create"], ["courses", "read"], ["courses", "update"], ["courses", "delete"],
    ["users", "read"], ["users", "update"], ["users", "suspend"],
    ["assessments", "create"], ["assessments", "read"],
    ["labs", "create"], ["labs", "read"], ["labs", "manage"],
    ["payments", "read"], ["payments", "manage"],
    ["audit", "read"],
    ["admin", "access"],
  ];
  for (const [resource, action] of perms) {
    await prisma.permission.upsert({
      where: { resource_action: { resource, action } },
      update: {},
      create: { resource, action },
    });
  }

  // Assign admin permissions
  const allPerms = await prisma.permission.findMany();
  await prisma.role.update({
    where: { name: "SUPER_ADMIN" },
    data: { permissions: { connect: allPerms.map((p) => ({ id: p.id })) } },
  });
  const adminPerms = allPerms.filter((p) => p.resource !== "audit" || p.action !== "read");
  await prisma.role.update({
    where: { name: "ADMIN" },
    data: { permissions: { connect: adminPerms.map((p) => ({ id: p.id })) } },
  });

  // ─── Subscription Plans ───
  await prisma.subscriptionPlan.upsert({
    where: { slug: "free" },
    update: {},
    create: { name: "Free", slug: "free", description: "Get started with basic courses", priceMonthly: 0, priceYearly: 0, features: ["Access to free courses", "Community access", "Basic labs"], maxCourses: 5, maxLabs: 3, sortOrder: 0 },
  });
  await prisma.subscriptionPlan.upsert({
    where: { slug: "beginner" },
    update: {},
    create: { name: "Beginner", slug: "beginner", description: "Unlock more learning content", priceMonthly: 1900, priceYearly: 19000, features: ["All free courses", "Beginner labs", "Progress tracking", "Certificates"], maxCourses: 20, maxLabs: 10, sortOrder: 1 },
  });
  await prisma.subscriptionPlan.upsert({
    where: { slug: "professional" },
    update: {},
    create: { name: "Professional", slug: "professional", description: "Full platform access", priceMonthly: 4900, priceYearly: 49000, features: ["All courses", "All labs", "Advanced assessments", "Priority support", "API access"], maxCourses: -1, maxLabs: -1, sortOrder: 2 },
  });
  await prisma.subscriptionPlan.upsert({
    where: { slug: "premium" },
    update: {},
    create: { name: "Premium", slug: "premium", description: "Enterprise-grade access", priceMonthly: 9900, priceYearly: 99000, features: ["Everything in Professional", "One-on-one mentoring", "Custom lab environments", "Team management", "SSO integration"], maxCourses: -1, maxLabs: -1, sortOrder: 3 },
  });

  // ─── Admin User ───
  const adminHash = await bcrypt.hash("Admin@123", 12);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@attacklab.com" },
    update: {},
    create: {
      email: "admin@attacklab.com",
      username: "admin",
      displayName: "ATTACKLAB Admin",
      passwordHash: adminHash,
      emailVerified: new Date(),
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: superAdmin.id } },
    update: {},
    create: { userId: adminUser.id, roleId: superAdmin.id },
  });

  // ─── Courses ───
  const courses = [
    {
      title: "Cybersecurity Fundamentals",
      slug: "cybersecurity-fundamentals",
      description: "Master the core concepts of cybersecurity. From the CIA triad to threat modeling, build a solid foundation for your security career.",
      shortDescription: "The essential foundation for any cybersecurity career.",
      difficulty: "BEGINNER",
      category: "Fundamentals",
      objectives: ["Understand the CIA Triad", "Identify common threats and vulnerabilities", "Explain basic networking concepts", "Apply ethical security principles"],
      prerequisites: [],
      estimatedHours: 20,
      modules: [
        { title: "Introduction to Cybersecurity", sortOrder: 0, lessons: ["What is Cybersecurity?", "The Evolving Threat Landscape", "Career Paths in Security"] },
        { title: "Ethics and Authorization", sortOrder: 1, lessons: ["Ethical Hacking Principles", "Authorization and Scope", "Legal Frameworks"] },
        { title: "CIA Triad", sortOrder: 2, lessons: ["Confidentiality", "Integrity", "Availability"] },
        { title: "Threats and Vulnerabilities", sortOrder: 3, lessons: ["Threat Categories", "Vulnerability Types", "Risk Assessment Basics"] },
        { title: "Networking Fundamentals", sortOrder: 4, lessons: ["OSI Model", "TCP/IP Protocol Suite", "Ports and Protocols", "Network Devices"] },
        { title: "Linux Fundamentals", sortOrder: 5, lessons: ["Linux Overview", "File System Navigation", "Basic Commands", "File Permissions"] },
      ],
    },
    {
      title: "Kali Linux",
      slug: "kali-linux",
      description: "Master Kali Linux — the industry-standard penetration testing distribution. Learn installation, navigation, and essential security tools.",
      shortDescription: "Master the industry-standard penetration testing platform.",
      difficulty: "BEGINNER",
      category: "Tools",
      objectives: ["Install and configure Kali Linux", "Navigate the Linux filesystem", "Use essential terminal commands", "Identify key security tools"],
      prerequisites: ["cybersecurity-fundamentals"],
      estimatedHours: 15,
      modules: [
        { title: "Kali Linux Introduction", sortOrder: 0, lessons: ["What is Kali Linux?", "Choosing the Right Version", "Installation Methods"] },
        { title: "Installation and Setup", sortOrder: 1, lessons: ["Virtual Machine Setup", "Dual Boot Installation", "Post-Installation Configuration"] },
        { title: "Linux Filesystem", sortOrder: 2, lessons: ["Directory Structure", "File Types", "Navigating the System"] },
        { title: "Terminal Navigation", sortOrder: 3, lessons: ["Shell Basics", "Working with Directories", "File Operations", "Pipes and Redirection"] },
        { title: "File Permissions", sortOrder: 4, lessons: ["Understanding Permissions", "Changing Permissions", "Ownership and Groups"] },
        { title: "Package Management", sortOrder: 5, lessons: ["APT Package Manager", "Installing Tools", "Updating the System"] },
        { title: "Networking Commands", sortOrder: 6, lessons: ["ip and ifconfig", "netstat and ss", "ping and traceroute", "DNS Tools"] },
      ],
    },
    {
      title: "Web Application Security",
      slug: "web-application-security",
      description: "Learn to identify and prevent web application vulnerabilities. Covers OWASP Top 10, SQL injection, XSS, CSRF, and secure development practices.",
      shortDescription: "Defend web applications against modern attacks.",
      difficulty: "INTERMEDIATE",
      category: "Web Security",
      objectives: ["Understand HTTP/HTTPS fundamentals", "Identify OWASP Top 10 vulnerabilities", "Perform authorized security testing", "Implement secure coding practices"],
      prerequisites: ["cybersecurity-fundamentals", "kali-linux"],
      estimatedHours: 30,
      modules: [
        { title: "HTTP and HTTPS", sortOrder: 0, lessons: ["HTTP Protocol Deep Dive", "HTTPS and TLS", "Request and Response Anatomy"] },
        { title: "Authentication Security", sortOrder: 1, lessons: ["Session Management", "Cookie Security", "Authentication Bypass Concepts"] },
        { title: "OWASP Top 10", sortOrder: 2, lessons: ["Injection Attacks", "Broken Authentication", "Sensitive Data Exposure", "XXE", "Broken Access Control", "Security Misconfiguration", "XSS", "Insecure Deserialization", "Using Components with Known Vulnerabilities", "Insufficient Logging"] },
        { title: "SQL Injection", sortOrder: 3, lessons: ["How SQL Injection Works", "Types of SQLi", "Prevention Techniques"] },
        { title: "Cross-Site Scripting", sortOrder: 4, lessons: ["XSS Types", "Stored vs Reflected XSS", "Content Security Policy"] },
        { title: "API Security", sortOrder: 5, lessons: ["REST API Security", "Authentication Tokens", "Input Validation", "Rate Limiting"] },
      ],
    },
    {
      title: "Network Security",
      slug: "network-security",
      description: "Protect networks from attacks. Learn network discovery, port scanning, traffic analysis, firewalls, and intrusion detection systems.",
      shortDescription: "Secure network infrastructure and detect threats.",
      difficulty: "INTERMEDIATE",
      category: "Network Security",
      objectives: ["Perform network discovery", "Analyze network traffic", "Configure firewalls", "Deploy IDS/IPS systems"],
      prerequisites: ["cybersecurity-fundamentals"],
      estimatedHours: 25,
      modules: [
        { title: "Network Discovery", sortOrder: 0, lessons: ["Host Discovery Techniques", "Network Mapping", "Service Discovery"] },
        { title: "Port Scanning", sortOrder: 1, lessons: ["TCP Scan Types", "UDP Scanning", "Stealth Scanning Techniques"] },
        { title: "Traffic Analysis", sortOrder: 2, lessons: ["Wireshark Basics", "Packet Analysis", "Protocol Dissection"] },
        { title: "Firewalls", sortOrder: 3, lessons: ["Firewall Types", "Rule Configuration", "Network Segmentation"] },
        { title: "IDS and IPS", sortOrder: 4, lessons: ["Detection Methods", "Signature vs Anomaly", "Deployment Strategies"] },
      ],
    },
    {
      title: "API Security",
      slug: "api-security",
      description: "Secure APIs against modern attacks. Learn JWT security, authentication, authorization, input validation, and the OWASP API Security Top 10.",
      shortDescription: "Protect APIs from the OWASP API Security Top 10.",
      difficulty: "ADVANCED",
      category: "API Security",
      objectives: ["Understand REST API architecture", "Implement secure authentication", "Apply input validation", "Master the OWASP API Security Top 10"],
      prerequisites: ["web-application-security"],
      estimatedHours: 20,
      modules: [
        { title: "REST API Fundamentals", sortOrder: 0, lessons: ["REST Architecture", "HTTP Methods", "Status Codes", "Content Types"] },
        { title: "API Authentication", sortOrder: 1, lessons: ["API Keys", "OAuth 2.0", "JWT Deep Dive", "Token Security"] },
        { title: "API Authorization", sortOrder: 2, lessons: ["Role-Based Access", "Scope-Based Access", "Object-Level Permissions"] },
        { title: "OWASP API Top 10", sortOrder: 3, lessons: ["BOLA", "Broken Authentication", "Excessive Data Exposure", "Lack of Resources and Rate Limiting"] },
        { title: "Secure Testing", sortOrder: 4, lessons: ["API Testing Tools", "Fuzzing Techniques", "Automated Security Scanning"] },
      ],
    },
    {
      title: "Bug Bounty Fundamentals",
      slug: "bug-bounty-fundamentals",
      description: "Learn the art of bug bounty hunting. From responsible disclosure to writing professional reports, become an effective security researcher.",
      shortDescription: "Become an effective bug bounty hunter.",
      difficulty: "BEGINNER",
      category: "Bug Bounty",
      objectives: ["Understand responsible disclosure", "Master reconnaissance methodology", "Write professional vulnerability reports", "Navigate bug bounty platforms"],
      prerequisites: ["cybersecurity-fundamentals"],
      estimatedHours: 18,
      modules: [
        { title: "Responsible Disclosure", sortOrder: 0, lessons: ["What is Responsible Disclosure?", "Legal Considerations", "Communication Best Practices"] },
        { title: "Bug Bounty Platforms", sortOrder: 1, lessons: ["Platform Overview", "Program Rules", "Scope and Exclusions"] },
        { title: "Reconnaissance", sortOrder: 2, lessons: ["Passive Reconnaissance", "Active Reconnaissance", "Tooling and Automation"] },
        { title: "Vulnerability Reporting", sortOrder: 3, lessons: ["Report Structure", "Writing Clear Descriptions", "Proof of Concept Development"] },
        { title: "Severity and Impact", sortOrder: 4, lessons: ["CVSS Scoring", "Impact Assessment", "Remediation Recommendations"] },
      ],
    },
    {
      title: "OSINT Fundamentals",
      slug: "osint-fundamentals",
      description: "Master Open Source Intelligence gathering. Learn search techniques, metadata analysis, domain research, and ethical OSINT practices.",
      shortDescription: "Gather intelligence from open sources ethically.",
      difficulty: "BEGINNER",
      category: "OSINT",
      objectives: ["Apply OSINT methodologies", "Use advanced search techniques", "Analyze publicly available data", "Understand legal boundaries"],
      prerequisites: [],
      estimatedHours: 12,
      modules: [
        { title: "OSINT Introduction", sortOrder: 0, lessons: ["What is OSINT?", "OSINT Methodology", "Ethical Considerations"] },
        { title: "Search Techniques", sortOrder: 1, lessons: ["Advanced Google Dorks", "Search Engine Alternatives", "Social Media Search"] },
        { title: "Domain Research", sortOrder: 2, lessons: ["WHOIS Lookup", "DNS Enumeration", "Subdomain Discovery"] },
        { title: "Metadata Analysis", sortOrder: 3, lessons: ["Image Metadata", "Document Metadata", "File Analysis"] },
      ],
    },
  ];

  for (const courseData of courses) {
    const { modules: moduleData, ...courseFields } = courseData;
    const course = await prisma.course.upsert({
      where: { slug: courseFields.slug },
      update: {},
      create: { ...courseFields, isPublished: true, objectives: courseData.objectives || [], prerequisites: courseData.prerequisites || [] },
    });

    for (const modData of moduleData) {
      const { lessons: lessonTitles, ...modFields } = modData;
      const mod = await prisma.module.create({
        data: { ...modFields, courseId: course.id, isPublished: true },
      });

      for (let i = 0; i < lessonTitles.length; i++) {
        await prisma.lesson.create({
          data: { moduleId: mod.id, title: lessonTitles[i], sortOrder: i, isPublished: true, content: `Content for "${lessonTitles[i]}" lesson. This lesson covers the essential concepts and practical applications.` },
        });
      }
    }
  }

  // ─── Labs ───
  const labs = [
    { slug: "linux-fundamentals", title: "Linux Fundamentals Lab", description: "Practice basic Linux commands, file navigation, and permissions in an isolated environment.", difficulty: "BEGINNER", category: "Linux", instructions: "Complete the following tasks:\n1. Navigate to /home/user\n2. Create a directory called 'lab1'\n3. Create 5 files with different permissions\n4. Find all files owned by root\n5. Read the flag file", objectives: ["Navigate Linux filesystem", "Manage file permissions", "Use find and grep commands"], timeoutMinutes: 30 },
    { slug: "network-essentials", title: "Network Essentials Lab", description: "Explore networking concepts in a safe, isolated virtual network environment.", difficulty: "BEGINNER", category: "Network", instructions: "Complete the following:\n1. Identify your IP address\n2. Scan the local network for hosts\n3. Identify running services\n4. Capture and analyze network traffic\n5. Find the hidden service", objectives: ["Configure network interfaces", "Scan network hosts", "Analyze network traffic"], timeoutMinutes: 45 },
    { slug: "web-security-lab", title: "Web Application Security Lab", description: "Practice identifying and understanding web vulnerabilities in a controlled environment.", difficulty: "INTERMEDIATE", category: "Web Security", instructions: "Analyze the target web application:\n1. Identify all input fields\n2. Test for injection vulnerabilities\n3. Analyze authentication mechanisms\n4. Find access control weaknesses\n5. Document all findings", objectives: ["Identify common web vulnerabilities", "Test authentication security", "Document security findings"], timeoutMinutes: 60 },
    { slug: "api-testing-lab", title: "API Security Testing Lab", description: "Test API endpoints for security vulnerabilities in an authorized lab environment.", difficulty: "ADVANCED", category: "API Security", instructions: "Test the API endpoints:\n1. Enumerate all API endpoints\n2. Test authentication mechanisms\n3. Check for authorization bypass\n4. Test input validation\n5. Identify data exposure risks", objectives: ["Enumerate API endpoints", "Test authentication and authorization", "Identify data exposure"], timeoutMinutes: 60 },
  ];

  for (const labData of labs) {
    await prisma.lab.upsert({
      where: { slug: labData.slug },
      update: {},
      create: { ...labData, isPublished: true, hints: ["Start with enumeration", "Look for hidden parameters", "Check for common misconfigurations"] },
    });
  }

  // ─── Assessments for first course ───
  const fundCourse = await prisma.course.findUnique({ where: { slug: "cybersecurity-fundamentals" }, include: { modules: true } });
  if (fundCourse) {
    for (const mod of fundCourse.modules) {
      const assessment = await prisma.assessment.create({
        data: { courseId: fundCourse.id, moduleId: mod.id, title: `${mod.title} Assessment`, description: `Test your knowledge of ${mod.title}`, passScore: 70, timeLimit: 600, maxAttempts: 3, isPublished: true, showAnswersAfter: true },
      });

      const q1 = await prisma.question.create({
        data: { assessmentId: assessment.id, type: "MULTIPLE_CHOICE", question: `Which of the following best describes ${mod.title.toLowerCase()}?`, explanation: "Understanding core concepts is essential for cybersecurity.", points: 1, sortOrder: 0 },
      });
      await prisma.answerOption.createMany({
        data: [
          { questionId: q1.id, text: "A critical component of security", isCorrect: true, sortOrder: 0 },
          { questionId: q1.id, text: "Not relevant to security", isCorrect: false, sortOrder: 1 },
          { questionId: q1.id, text: "Only for advanced users", isCorrect: false, sortOrder: 2 },
          { questionId: q1.id, text: "Optional knowledge", isCorrect: false, sortOrder: 3 },
        ],
      });

      const q2 = await prisma.question.create({
        data: { assessmentId: assessment.id, type: "TRUE_FALSE", question: `Security is everyone's responsibility.`, explanation: "Security is a shared responsibility across all roles.", points: 1, sortOrder: 1 },
      });
      await prisma.answerOption.createMany({
        data: [
          { questionId: q2.id, text: "True", isCorrect: true, sortOrder: 0 },
          { questionId: q2.id, text: "False", isCorrect: false, sortOrder: 1 },
        ],
      });
    }
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
