import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Helper to create course with modules, lessons, and assessments
async function createCourse(data: {
  title: string; slug: string; description: string; shortDescription: string;
  difficulty: string; category: string; objectives: string[]; prerequisites: string[];
  estimatedHours: number; sortOrder: number;
  modules: { title: string; sortOrder: number; lessons: string[] }[];
  assessments?: { moduleTitle: string; questions: { q: string; options: string[]; correct: number; explanation: string }[] }[];
}) {
  const existing = await prisma.course.findUnique({ where: { slug: data.slug } });
  if (existing) { console.log(`  Skip ${data.title} (exists)`); return; }

  const course = await prisma.course.create({
    data: {
      title: data.title, slug: data.slug, description: data.description,
      shortDescription: data.shortDescription, difficulty: data.difficulty,
      category: data.category, objectives: data.objectives, prerequisites: data.prerequisites,
      estimatedHours: data.estimatedHours, sortOrder: data.sortOrder, isPublished: true,
    },
  });

  for (const modData of data.modules) {
    const mod = await prisma.module.create({
      data: { courseId: course.id, title: modData.title, sortOrder: modData.sortOrder, isPublished: true },
    });
    for (let i = 0; i < modData.lessons.length; i++) {
      const lessonTitle = modData.lessons[i];
      const lessonContent = [
        "## " + lessonTitle,
        "",
        "This lesson covers the essential concepts and practical applications of " + lessonTitle.toLowerCase() + ".",
        "",
        "### Objectives",
        "- Understand core concepts",
        "- Apply practical techniques",
        "- Complete hands-on exercises",
        "",
        "### Reading Material",
        "Detailed explanation of " + lessonTitle.toLowerCase() + " with real-world examples and scenarios.",
        "",
        "### Key Takeaways",
        "- Master the fundamentals",
        "- Practice regularly",
        "- Apply to real scenarios",
      ].join("\n");

      await prisma.lesson.create({
        data: {
          moduleId: mod.id, title: lessonTitle, sortOrder: i, isPublished: true,
          content: lessonContent,
        },
      });
    }

    // Create assessment for each module
    const assessment = await prisma.assessment.create({
      data: {
        courseId: course.id, moduleId: mod.id,
        title: `${modData.title} Assessment`,
        description: `Test your knowledge of ${modData.title}`,
        passScore: 70, timeLimit: 600, maxAttempts: 3, isPublished: true, showAnswersAfter: true,
      },
    });

    const questions = [
      { q: `What is the primary purpose of ${modData.title.toLowerCase()}?`, options: ["To enhance security posture", "To make systems slower", "To reduce functionality", "Optional knowledge"], correct: 0, explanation: `Understanding the purpose of ${modData.title.toLowerCase()} is fundamental.` },
      { q: `Which of the following is a best practice in ${modData.title.toLowerCase()}?`, options: ["Following established guidelines", "Ignoring security warnings", "Using default configurations", "Skipping updates"], correct: 0, explanation: "Following best practices ensures optimal security." },
      { q: `${modData.title} is essential for cybersecurity professionals.`, options: ["True", "False"], correct: 0, explanation: "Security professionals need comprehensive knowledge." },
    ];

    for (let qi = 0; qi < questions.length; qi++) {
      const question = await prisma.question.create({
        data: {
          assessmentId: assessment.id, type: questions[qi].options.length === 2 ? "TRUE_FALSE" : "MULTIPLE_CHOICE",
          question: questions[qi].q, explanation: questions[qi].explanation, points: 1, sortOrder: qi,
        },
      });
      await prisma.answerOption.createMany({
        data: questions[qi].options.map((text, oi) => ({
          questionId: question.id, text, isCorrect: oi === questions[qi].correct, sortOrder: oi,
        })),
      });
    }
  }
  console.log(`  Created ${data.title}`);
}

async function main() {
  console.log("Seeding ATTACKLAB database...\n");

  // ─── Roles ───
  console.log("Creating roles...");
  await prisma.role.upsert({ where: { name: "STUDENT" }, update: {}, create: { name: "STUDENT", description: "Regular student" } });
  await prisma.role.upsert({ where: { name: "INSTRUCTOR" }, update: {}, create: { name: "INSTRUCTOR", description: "Course instructor" } });
  await prisma.role.upsert({ where: { name: "MODERATOR" }, update: {}, create: { name: "MODERATOR", description: "Community moderator" } });
  await prisma.role.upsert({ where: { name: "ADMIN" }, update: {}, create: { name: "ADMIN", description: "Administrator" } });
  await prisma.role.upsert({ where: { name: "SUPER_ADMIN" }, update: {}, create: { name: "SUPER_ADMIN", description: "Super administrator" } });

  // ─── Permissions ───
  const perms = [
    ["courses", "create"], ["courses", "read"], ["courses", "update"], ["courses", "delete"],
    ["users", "read"], ["users", "update"], ["users", "suspend"],
    ["assessments", "create"], ["assessments", "read"],
    ["labs", "create"], ["labs", "read"], ["labs", "manage"],
    ["payments", "read"], ["payments", "manage"],
    ["audit", "read"], ["admin", "access"],
  ];
  for (const [resource, action] of perms) {
    await prisma.permission.upsert({
      where: { resource_action: { resource, action } }, update: {},
      create: { resource, action },
    });
  }

  const allPerms = await prisma.permission.findMany();
  await prisma.role.update({ where: { name: "SUPER_ADMIN" }, data: { permissions: { connect: allPerms.map(p => ({ id: p.id })) } } });
  const adminPerms = allPerms.filter(p => p.resource !== "audit" || p.action !== "read");
  await prisma.role.update({ where: { name: "ADMIN" }, data: { permissions: { connect: adminPerms.map(p => ({ id: p.id })) } } });

  // ─── Subscription Plans ───
  console.log("Creating subscription plans...");
  const plans = [
    { slug: "free", name: "Free", priceMonthly: 0, priceYearly: 0, features: ["Access to free courses", "Community access", "Basic labs"], maxCourses: 5, maxLabs: 3, sortOrder: 0 },
    { slug: "beginner", name: "Beginner", priceMonthly: 1900, priceYearly: 19000, features: ["All free courses", "Beginner labs", "Progress tracking", "Certificates"], maxCourses: 20, maxLabs: 10, sortOrder: 1 },
    { slug: "professional", name: "Professional", priceMonthly: 4900, priceYearly: 49000, features: ["All courses", "All labs", "Advanced assessments", "Priority support"], maxCourses: -1, maxLabs: -1, sortOrder: 2 },
    { slug: "premium", name: "Premium", priceMonthly: 9900, priceYearly: 99000, features: ["Everything in Professional", "1-on-1 mentoring", "Custom labs", "Team management"], maxCourses: -1, maxLabs: -1, sortOrder: 3 },
  ];
  for (const p of plans) {
    await prisma.subscriptionPlan.upsert({ where: { slug: p.slug }, update: {}, create: { ...p, description: `${p.name} plan`, currency: "USD", isActive: true } });
  }

  // ─── Admin User ───
  console.log("Creating admin user...");
  const adminHash = await bcrypt.hash("Admin@123", 12);
  const superAdminRole = await prisma.role.findUnique({ where: { name: "SUPER_ADMIN" } });
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@attacklab.com" }, update: {},
    create: { email: "admin@attacklab.com", username: "admin", displayName: "ATTACKLAB Admin", passwordHash: adminHash, emailVerified: new Date() },
  });
  if (superAdminRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: superAdminRole.id } }, update: {},
      create: { userId: adminUser.id, roleId: superAdminRole.id },
    });
  }

  // ─── 30 Levels of Courses ───
  console.log("\nCreating courses (30 levels)...");

  await createCourse({
    title: "Cybersecurity Fundamentals", slug: "cybersecurity-fundamentals", sortOrder: 1,
    description: "Master core cybersecurity concepts. The CIA triad, threat modeling, risk assessment, and security principles form the foundation of your career.",
    shortDescription: "The essential foundation for any cybersecurity career.", difficulty: "BEGINNER", category: "Fundamentals",
    objectives: ["Understand the CIA Triad", "Identify common threats", "Apply ethical security principles", "Perform basic risk assessment"],
    prerequisites: [], estimatedHours: 20,
    modules: [
      { title: "Introduction to Cybersecurity", sortOrder: 0, lessons: ["What is Cybersecurity?", "The Evolving Threat Landscape", "Security Career Paths"] },
      { title: "Ethics and Authorization", sortOrder: 1, lessons: ["Ethical Hacking Principles", "Authorization and Scope", "Legal Frameworks and Compliance"] },
      { title: "CIA Triad Deep Dive", sortOrder: 2, lessons: ["Confidentiality", "Integrity", "Availability", "Non-repudiation"] },
      { title: "Threat Landscape", sortOrder: 3, lessons: ["Threat Actors and Motivations", "Attack Vectors", "Threat Intelligence Basics"] },
      { title: "Risk Assessment", sortOrder: 4, lessons: ["Risk Identification", "Risk Analysis Methods", "Risk Treatment Options", "Security Frameworks (NIST, ISO)"] },
    ],
  });

  await createCourse({
    title: "Computer Networking", slug: "computer-networking", sortOrder: 2,
    description: "Build deep networking knowledge. OSI model, TCP/IP, routing, switching, and network protocols form the backbone of all security work.",
    shortDescription: "Understand networks to understand attacks.", difficulty: "BEGINNER", category: "Networking",
    objectives: ["Master the OSI model", "Understand TCP/IP protocols", "Configure network devices", "Analyze network traffic"],
    prerequisites: [], estimatedHours: 25,
    modules: [
      { title: "Networking Basics", sortOrder: 0, lessons: ["What is a Network?", "Network Types (LAN, WAN, MAN)", "Network Topologies"] },
      { title: "OSI Model", sortOrder: 1, lessons: ["Physical Layer", "Data Link Layer", "Network Layer", "Transport Layer", "Session, Presentation, Application Layers"] },
      { title: "TCP/IP Protocol Suite", sortOrder: 2, lessons: ["IP Addressing and Subnetting", "TCP vs UDP", "DNS Protocol", "DHCP", "ARP and ICMP"] },
      { title: "Network Devices", sortOrder: 3, lessons: ["Routers and Switches", "Firewalls and Proxies", "Load Balancers", "Network Address Translation"] },
      { title: "Wireless Networking", sortOrder: 4, lessons: ["WiFi Standards", "Wireless Security (WPA2, WPA3)", "Bluetooth and NFC"] },
    ],
  });

  await createCourse({
    title: "Linux Fundamentals", slug: "linux-fundamentals", sortOrder: 3,
    description: "Master Linux from the ground up. File systems, commands, shell scripting, and permissions — essential for every security professional.",
    shortDescription: "Essential Linux skills for security professionals.", difficulty: "BEGINNER", category: "Linux",
    objectives: ["Navigate the Linux filesystem", "Use essential commands", "Understand file permissions", "Write basic shell scripts"],
    prerequisites: [], estimatedHours: 20,
    modules: [
      { title: "Linux Introduction", sortOrder: 0, lessons: ["Linux Distributions", "Installation Basics", "Desktop vs Server"] },
      { title: "Filesystem Navigation", sortOrder: 1, lessons: ["Directory Structure", "Absolute vs Relative Paths", "cd, ls, pwd, find, locate"] },
      { title: "File Operations", sortOrder: 2, lessons: ["Creating and Removing Files", "Copying and Moving", "File Types and Extensions", "Compression and Archives"] },
      { title: "User and Group Management", sortOrder: 3, lessons: ["User Accounts", "Groups and Membership", "sudo and Root Access", "User Switching"] },
      { title: "File Permissions", sortOrder: 4, lessons: ["Reading Permissions", "chmod, chown, chgrp", "Special Permissions (SUID, SGID, Sticky)"] },
      { title: "Process Management", sortOrder: 5, lessons: ["ps, top, htop", "Background Processes", "Signals and Kill", "System Services"] },
    ],
  });

  await createCourse({
    title: "Git & GitHub", slug: "git-github", sortOrder: 4,
    description: "Version control is essential for security tooling and collaboration. Master Git workflows, branching, and GitHub collaboration.",
    shortDescription: "Version control for security professionals.", difficulty: "BEGINNER", category: "DevTools",
    objectives: ["Initialize and manage Git repos", "Use branching and merging", "Collaborate via GitHub", "Write effective commit messages"],
    prerequisites: [], estimatedHours: 10,
    modules: [
      { title: "Git Basics", sortOrder: 0, lessons: ["What is Version Control?", "Installing Git", "git init, add, commit"] },
      { title: "Branching and Merging", sortOrder: 1, lessons: ["Creating Branches", "Switching and Merging", "Merge Conflicts", "Rebase"] },
      { title: "Remote Repositories", sortOrder: 2, lessons: ["GitHub Setup", "Clone and Push", "Pull Requests", "Forking"] },
      { title: "Advanced Git", sortOrder: 3, lessons: ["Stashing Changes", "Cherry-Picking", "Git Log and Diff", "Tags and Releases"] },
    ],
  });

  await createCourse({
    title: "Programming Fundamentals", slug: "programming-fundamentals", sortOrder: 5,
    description: "Learn to code in Python, JavaScript, Bash, and SQL. Programming is the key to building security tools and understanding vulnerabilities.",
    shortDescription: "Code your way to better security.", difficulty: "BEGINNER", category: "Programming",
    objectives: ["Write scripts in Python", "Automate tasks with Bash", "Query databases with SQL", "Build tools with JavaScript"],
    prerequisites: [], estimatedHours: 40,
    modules: [
      { title: "Python Basics", sortOrder: 0, lessons: ["Variables and Data Types", "Control Flow", "Functions", "File I/O", "Libraries and Imports"] },
      { title: "Python for Security", sortOrder: 1, lessons: ["Network Programming", "Web Scraping", "Automating Tasks", "Building Security Tools"] },
      { title: "Bash Scripting", sortOrder: 2, lessons: ["Shell Variables", "Conditional Statements", "Loops", "Functions", "Automation Scripts"] },
      { title: "SQL Fundamentals", sortOrder: 3, lessons: ["SELECT Queries", "JOINs", "INSERT and UPDATE", "Aggregation", "Subqueries"] },
      { title: "JavaScript Basics", sortOrder: 4, lessons: ["Variables and Functions", "DOM Manipulation", "Fetch API", "Node.js Introduction"] },
    ],
  });

  await createCourse({
    title: "Web Technologies", slug: "web-technologies", sortOrder: 6,
    description: "Understand how the web works. HTML, CSS, JavaScript, HTTP, cookies, sessions, and APIs — the technology stack behind every web attack.",
    shortDescription: "How the web works — essential for web security.", difficulty: "BEGINNER", category: "Web Security",
    objectives: ["Understand HTTP protocol", "Work with HTML/CSS/JS", "Master cookies and sessions", "Build and test REST APIs"],
    prerequisites: ["computer-networking"], estimatedHours: 30,
    modules: [
      { title: "HTML and CSS Fundamentals", sortOrder: 0, lessons: ["HTML Document Structure", "Forms and Input Types", "CSS Selectors", "Responsive Design Basics"] },
      { title: "JavaScript for the Web", sortOrder: 1, lessons: ["JavaScript Basics", "Event Handling", "AJAX and Fetch", "Local Storage"] },
      { title: "HTTP Protocol", sortOrder: 2, lessons: ["HTTP Methods", "Status Codes", "Headers", "HTTPS and TLS", "HTTP/2 and HTTP/3"] },
      { title: "Cookies and Sessions", sortOrder: 3, lessons: ["Cookie Types and Attributes", "Session Management", "Token-Based Auth", "Security Best Practices"] },
      { title: "REST APIs", sortOrder: 4, lessons: ["REST Architecture", "API Design Patterns", "Authentication Methods", "Testing APIs"] },
    ],
  });

  await createCourse({
    title: "Linux Administration", slug: "linux-administration", sortOrder: 7,
    description: "Master Linux system administration. User management, services, networking, package management, and security hardening.",
    shortDescription: "Administer and harden Linux systems.", difficulty: "INTERMEDIATE", category: "Linux",
    objectives: ["Manage users and services", "Configure networking", "Harden Linux systems", "Monitor system performance"],
    prerequisites: ["linux-fundamentals"], estimatedHours: 25,
    modules: [
      { title: "System Administration", sortOrder: 0, lessons: ["Service Management (systemd)", "Cron Jobs", "Log Management", "System Monitoring"] },
      { title: "Network Configuration", sortOrder: 1, lessons: ["Static and Dynamic IP", "DNS Configuration", "Firewall (iptables, ufw)", "SSH Hardening"] },
      { title: "Package Management", sortOrder: 2, lessons: ["APT and YUM", "Building from Source", "Repository Management"] },
      { title: "Security Hardening", sortOrder: 3, lessons: ["SELinux and AppArmor", "File System Security", "Audit Logging", "Disabling Services"] },
    ],
  });

  await createCourse({
    title: "Windows Security", slug: "windows-security", sortOrder: 8,
    description: "Understand Windows security internals. Active Directory, Group Policy, Windows Firewall, and common Windows attack surfaces.",
    shortDescription: "Master Windows security architecture.", difficulty: "INTERMEDIATE", category: "Windows",
    objectives: ["Understand Windows security model", "Configure Group Policy", "Analyze Windows event logs", "Harden Windows systems"],
    prerequisites: ["cybersecurity-fundamentals"], estimatedHours: 20,
    modules: [
      { title: "Windows Security Architecture", sortOrder: 0, lessons: ["Windows Kernel", "Access Tokens", "Registry Security", "UAC"] },
      { title: "Active Directory Basics", sortOrder: 1, lessons: ["AD Architecture", "Domain Controllers", "Group Policy Objects", "Kerberos Authentication"] },
      { title: "Windows Hardening", sortOrder: 2, lessons: ["Windows Firewall", "BitLocker", "Windows Defender", "PowerShell Security"] },
      { title: "Windows Forensics", sortOrder: 3, lessons: ["Event Logs", "Registry Analysis", "Memory Forensics", "Disk Forensics"] },
    ],
  });

  await createCourse({
    title: "Networking Security", slug: "networking-security", sortOrder: 9,
    description: "Advanced network security concepts. Firewalls, IDS/IPS, VPNs, network segmentation, and traffic analysis.",
    shortDescription: "Defend and analyze network infrastructure.", difficulty: "INTERMEDIATE", category: "Networking",
    objectives: ["Configure firewalls and IDS/IPS", "Analyze network traffic", "Implement VPNs", "Design network segmentation"],
    prerequisites: ["computer-networking"], estimatedHours: 25,
    modules: [
      { title: "Firewall Architecture", sortOrder: 0, lessons: ["Packet Filtering", "Stateful Inspection", "Next-Gen Firewalls", "Rule Configuration"] },
      { title: "IDS and IPS", sortOrder: 1, lessons: ["Signature-Based Detection", "Anomaly-Based Detection", "Snort and Suricata", "Deployment Strategies"] },
      { title: "VPN Technologies", sortOrder: 2, lessons: ["IPsec", "OpenVPN", "WireGuard", "SSL/TLS VPNs"] },
      { title: "Network Segmentation", sortOrder: 3, lessons: ["VLANs", "Zero Trust Architecture", "Micro-Segmentation", "DMZ Design"] },
    ],
  });

  await createCourse({
    title: "OWASP Top 10", slug: "owasp-top-10", sortOrder: 10,
    description: "Master the OWASP Top 10 web vulnerabilities. Injection, XSS, CSRF, broken access control, and more — the most critical web security risks.",
    shortDescription: "The 10 most critical web security risks.", difficulty: "INTERMEDIATE", category: "Web Security",
    objectives: ["Identify all OWASP Top 10 risks", "Understand exploitation techniques", "Implement prevention measures", "Test for vulnerabilities"],
    prerequisites: ["web-technologies"], estimatedHours: 25,
    modules: [
      { title: "Injection Attacks", sortOrder: 0, lessons: ["SQL Injection", "NoSQL Injection", "Command Injection", "LDAP Injection"] },
      { title: "Broken Authentication", sortOrder: 1, lessons: ["Session Fixation", "Credential Stuffing", "Weak Password Policies", "MFA Bypass"] },
      { title: "Sensitive Data Exposure", sortOrder: 2, lessons: ["Data Encryption", "TLS Configuration", "Key Management", "Data Classification"] },
      { title: "XSS and CSRF", sortOrder: 3, lessons: ["Reflected XSS", "Stored XSS", "DOM-Based XSS", "Cross-Site Request Forgery"] },
      { title: "Broken Access Control", sortOrder: 4, lessons: ["IDOR", "Privilege Escalation", "Forceful Browsing", "Missing Function-Level Access"] },
      { title: "Security Misconfiguration", sortOrder: 5, lessons: ["Default Configurations", "Unnecessary Features", "Error Handling", "Cloud Security Config"] },
    ],
  });

  await createCourse({
    title: "Web Application Security", slug: "web-application-security", sortOrder: 11,
    description: "Deep dive into web application security. Authentication, authorization, file uploads, error handling, and secure development practices.",
    shortDescription: "Advanced web application security techniques.", difficulty: "INTERMEDIATE", category: "Web Security",
    objectives: ["Test authentication mechanisms", "Identify authorization flaws", "Secure file uploads", "Implement security headers"],
    prerequisites: ["owasp-top-10"], estimatedHours: 30,
    modules: [
      { title: "Authentication Testing", sortOrder: 0, lessons: ["Login Bruteforce", "Password Reset Flaws", "Remember Me Tokens", "OAuth Vulnerabilities"] },
      { title: "File Upload Security", sortOrder: 1, lessons: ["Upload Restrictions Bypass", "Malicious File Types", "Content-Type Validation", "Path Traversal"] },
      { title: "Error Handling", sortOrder: 2, lessons: ["Information Leakage", "Stack Traces", "Custom Error Pages", "Debug Mode"] },
      { title: "Security Headers", sortOrder: 3, lessons: ["Content Security Policy", "X-Frame-Options", "HSTS", "CORS Configuration"] },
    ],
  });

  await createCourse({
    title: "Burp Suite Mastery", slug: "burp-suite", sortOrder: 12,
    description: "Master Burp Suite — the industry-standard web security testing tool. Proxy, scanner, intruder, repeater, and advanced techniques.",
    shortDescription: "Master the #1 web security testing tool.", difficulty: "INTERMEDIATE", category: "Tools",
    objectives: ["Configure Burp Proxy", "Use Intruder for testing", "Master Repeater", "Analyze web traffic"],
    prerequisites: ["web-application-security"], estimatedHours: 20,
    modules: [
      { title: "Burp Suite Setup", sortOrder: 0, lessons: ["Installation and Configuration", "Browser Proxy Setup", "CA Certificate Installation", "Target Configuration"] },
      { title: "Proxy Tool", sortOrder: 1, lessons: ["Intercepting Requests", "Modifying Traffic", "WebSockets", "Session Handling"] },
      { title: "Scanner and Intruder", sortOrder: 2, lessons: ["Active Scanning", "Intruder Attack Types", "Payload Positions", "Payload Sets"] },
      { title: "Repeater and Comparer", sortOrder: 3, lessons: ["Manual Testing", "Request Comparison", "Finding Differences", "Automating Tests"] },
      { title: "Extensions and Advanced", sortOrder: 4, lessons: ["BApp Store", "Custom Extensions", "API Testing", "Collaborator"] },
    ],
  });

  await createCourse({
    title: "Kali Linux Deep Dive", slug: "kali-linux-deep-dive", sortOrder: 13,
    description: "Advanced Kali Linux usage. Custom tool development, live boot creation, headless testing, and the complete tool ecosystem.",
    shortDescription: "Advanced Kali Linux for security professionals.", difficulty: "INTERMEDIATE", category: "Tools",
    objectives: ["Build custom Kali images", "Master the tool ecosystem", "Automate testing workflows", "Use Kali for headless testing"],
    prerequisites: ["linux-fundamentals"], estimatedHours: 20,
    modules: [
      { title: "Advanced Kali Setup", sortOrder: 0, lessons: ["Custom ISO Building", "Live USB Creation", "VM Optimization", "Network Configuration"] },
      { title: "Tool Categories", sortOrder: 1, lessons: ["Information Gathering Tools", "Vulnerability Analysis", "Exploitation Tools", "Post-Exploitation"] },
      { title: "Custom Tool Development", sortOrder: 2, lessons: ["Python in Kali", "Custom Scripts", "Automation Frameworks", "Tool Integration"] },
      { title: "Advanced Usage", sortOrder: 3, lessons: ["Headless Mode", "Remote Testing", "Parallel Testing", "Results Management"] },
    ],
  });

  await createCourse({
    title: "Nmap Mastery", slug: "nmap-mastery", sortOrder: 14,
    description: "Master Nmap — the most powerful network scanner. Port scanning, service detection, OS fingerprinting, and NSE scripting.",
    shortDescription: "Master the most powerful network scanner.", difficulty: "INTERMEDIATE", category: "Tools",
    objectives: ["Perform advanced port scans", "Detect services and OS", "Write NSE scripts", "Parse scan results"],
    prerequisites: ["computer-networking"], estimatedHours: 15,
    modules: [
      { title: "Nmap Fundamentals", sortOrder: 0, lessons: ["Scan Types (SYN, Connect, UDP)", "Port Specification", "Timing Templates", "Output Formats"] },
      { title: "Service Detection", sortOrder: 1, lessons: ["Version Detection", "OS Fingerprinting", "Banner Grabbing", "Script Scanning"] },
      { title: "NSE Scripting", sortOrder: 2, lessons: ["Script Categories", "Running Scripts", "Writing Custom Scripts", "Script Arguments"] },
      { title: "Advanced Scanning", sortOrder: 3, lessons: ["Decoy Scans", "Fragmentation", "Idle Scans", "Bypassing Firewalls"] },
    ],
  });

  await createCourse({
    title: "Metasploit Framework", slug: "metasploit-framework", sortOrder: 15,
    description: "Master the Metasploit Framework. Exploitation, payload generation, post-exploitation, and meterpreter sessions.",
    shortDescription: "Master the world's most used exploitation framework.", difficulty: "ADVANCED", category: "Tools",
    objectives: ["Find and use exploits", "Generate payloads", "Establish sessions", "Perform post-exploitation"],
    prerequisites: ["kali-linux-deep-dive", "nmap-mastery"], estimatedHours: 25,
    modules: [
      { title: "Metasploit Architecture", sortOrder: 0, lessons: ["Framework Components", "Modules and Payloads", "Database Setup", "Working with Workspaces"] },
      { title: "Exploitation", sortOrder: 1, lessons: ["Finding Exploits", "Configuring Exploits", "Payload Selection", "Target Selection"] },
      { title: "Meterpreter", sortOrder: 2, lessons: ["Session Management", "File System Navigation", "Privilege Escalation", "Pivoting"] },
      { title: "Post Exploitation", sortOrder: 3, lessons: ["Persistence", "Credential Harvesting", "Pivoting and Tunneling", "Covering Tracks"] },
    ],
  });

  await createCourse({
    title: "Wireshark Mastery", slug: "wireshark-mastery", sortOrder: 16,
    description: "Master Wireshark for deep packet analysis. Capture, filter, dissect, and analyze network traffic like a professional.",
    shortDescription: "Deep packet analysis with Wireshark.", difficulty: "INTERMEDIATE", category: "Tools",
    objectives: ["Capture and filter packets", "Analyze protocols", "Detect malicious traffic", "Create custom filters"],
    prerequisites: ["computer-networking"], estimatedHours: 15,
    modules: [
      { title: "Wireshark Basics", sortOrder: 0, lessons: ["Installation", "Capture Interfaces", "Display Filters", "Color Rules"] },
      { title: "Protocol Analysis", sortOrder: 1, lessons: ["HTTP Analysis", "DNS Analysis", "TCP Stream Analysis", "TLS Decryption"] },
      { title: "Traffic Analysis", sortOrder: 2, lessons: ["Malware Traffic Patterns", "Network Forensics", "Performance Analysis", "VoIP Analysis"] },
      { title: "Advanced Features", sortOrder: 3, lessons: ["IO Graphs", "Statistics", "Custom Profiles", "tshark Command Line"] },
    ],
  });

  await createCourse({
    title: "Active Directory Security", slug: "active-directory-security", sortOrder: 17,
    description: "Master Active Directory security. Attacks, defenses, Kerberoasting, Golden Ticket, DCSync, and AD hardening.",
    shortDescription: "Attack and defend Active Directory.", difficulty: "ADVANCED", category: "Windows",
    objectives: ["Understand AD architecture", "Perform AD attacks", "Detect and prevent attacks", "Harden AD environments"],
    prerequisites: ["windows-security"], estimatedHours: 25,
    modules: [
      { title: "AD Architecture", sortOrder: 0, lessons: ["Domain Controllers", "Group Policy", "Trust Relationships", "Kerberos in Detail"] },
      { title: "AD Attacks", sortOrder: 1, lessons: ["Kerberoasting", "Golden and Silver Tickets", "DCSync", "Pass-the-Hash", "Password Spraying"] },
      { title: "Enumeration and Recon", sortOrder: 2, lessons: ["BloodHound", "ADRecon", "PowerView", "LDAP Enumeration"] },
      { title: "AD Hardening", sortOrder: 3, lessons: ["Privileged Access Management", "Monitoring and Detection", "Tiered Admin Model", "LAPS Deployment"] },
    ],
  });

  await createCourse({
    title: "Privilege Escalation", slug: "privilege-escalation", sortOrder: 18,
    description: "Master privilege escalation on Linux and Windows. SUID binaries, kernel exploits, misconfigurations, and token impersonation.",
    shortDescription: "Escalate from user to admin on any system.", difficulty: "ADVANCED", category: "Exploitation",
    objectives: ["Identify escalation vectors", "Exploit SUID binaries", "Use kernel exploits", "Escalate on Windows"],
    prerequisites: ["linux-fundamentals", "windows-security"], estimatedHours: 30,
    modules: [
      { title: "Linux Privilege Escalation", sortOrder: 0, lessons: ["SUID/SGID Binaries", "Kernel Exploits", "Cron Jobs", "Sudo Misconfigurations", "Capabilities"] },
      { title: "Linux Enumeration Tools", sortOrder: 1, lessons: ["LinPEAS", "LinEnum", "Linux Exploit Suggester", "Manual Enumeration"] },
      { title: "Windows Privilege Escalation", sortOrder: 2, lessons: ["Token Impersonation", "Unquoted Service Paths", "DLL Hijacking", "Registry Misconfigurations"] },
      { title: "Windows Enumeration Tools", sortOrder: 3, lessons: ["WinPEAS", "PowerUp", "Seatbelt", "System Information Gathering"] },
    ],
  });

  await createCourse({
    title: "Password Attacks", slug: "password-attacks", sortOrder: 19,
    description: "Master password attack techniques. Brute force, dictionary attacks, rainbow tables, hash cracking, and password policy analysis.",
    shortDescription: "Break passwords ethically and understand defenses.", difficulty: "ADVANCED", category: "Exploitation",
    objectives: ["Perform brute force attacks", "Crack password hashes", "Use rainbow tables", "Analyze password strength"],
    prerequisites: ["cybersecurity-fundamentals"], estimatedHours: 15,
    modules: [
      { title: "Password Attack Fundamentals", sortOrder: 0, lessons: ["Authentication Types", "Password Storage", "Hash Functions", "Salting"] },
      { title: "Online Attacks", sortOrder: 1, lessons: ["Brute Force", "Dictionary Attacks", "Credential Stuffing", "Password Spraying"] },
      { title: "Offline Attacks", sortOrder: 2, lessons: ["Hash Cracking (Hashcat, John)", "Rainbow Tables", "GPU Acceleration", "Rule-Based Attacks"] },
      { title: "Password Defense", sortOrder: 3, lessons: ["Password Policies", "MFA Implementation", "Account Lockout", "Password Managers"] },
    ],
  });

  await createCourse({
    title: "Wireless Security", slug: "wireless-security", sortOrder: 20,
    description: "Master wireless network security. WiFi protocols, WPA2/WPA3 attacks, Bluetooth hacking, and wireless network hardening.",
    shortDescription: "Attack and defend wireless networks.", difficulty: "ADVANCED", category: "Network Security",
    objectives: ["Capture wireless traffic", "Perform WiFi attacks", "Harden wireless networks", "Test Bluetooth security"],
    prerequisites: ["networking-security"], estimatedHours: 20,
    modules: [
      { title: "Wireless Fundamentals", sortOrder: 0, lessons: ["WiFi Standards (802.11)", "Wireless Channels", "Signal Analysis", "Antenna Types"] },
      { title: "WiFi Attacks", sortOrder: 1, lessons: ["Evil Twin Attacks", "Deauthentication", "WPA2 Handshake Capture", "PMKID Attacks"] },
      { title: "WPA3 and Modern Security", sortOrder: 2, lessons: ["WPA3 Enhancements", "Protected Management Frames", "OWASP WPA3 Testing"] },
      { title: "Wireless Hardening", sortOrder: 3, lessons: ["Network Segmentation", "RADIUS Authentication", "WIDS/WIPS", "Guest Network Isolation"] },
    ],
  });

  await createCourse({
    title: "Cloud Security", slug: "cloud-security", sortOrder: 21,
    description: "Secure cloud environments. AWS, Azure, GCP security fundamentals, container security, and cloud-native threat detection.",
    shortDescription: "Secure cloud infrastructure and services.", difficulty: "ADVANCED", category: "Cloud",
    objectives: ["Understand cloud security models", "Secure cloud deployments", "Detect cloud threats", "Implement cloud compliance"],
    prerequisites: ["cybersecurity-fundamentals"], estimatedHours: 25,
    modules: [
      { title: "Cloud Security Fundamentals", sortOrder: 0, lessons: ["Shared Responsibility Model", "Cloud Service Models", "Cloud Security Architecture"] },
      { title: "AWS Security", sortOrder: 1, lessons: ["IAM Policies", "S3 Security", "VPC Security", "CloudTrail Monitoring"] },
      { title: "Container Security", sortOrder: 2, lessons: ["Docker Security", "Kubernetes Security", "Image Scanning", "Runtime Protection"] },
      { title: "Cloud Threat Detection", sortOrder: 3, lessons: ["Cloud Security Posture", "Anomaly Detection", "Compliance Monitoring", "Incident Response"] },
    ],
  });

  await createCourse({
    title: "Mobile Security", slug: "mobile-security", sortOrder: 22,
    description: "Master mobile application security. Android and iOS security architecture, reverse engineering, and mobile threat analysis.",
    shortDescription: "Secure and test mobile applications.", difficulty: "ADVANCED", category: "Mobile",
    objectives: ["Test Android and iOS apps", "Perform mobile reverse engineering", "Identify mobile vulnerabilities", "Secure mobile applications"],
    prerequisites: ["web-application-security"], estimatedHours: 20,
    modules: [
      { title: "Mobile Security Overview", sortOrder: 0, lessons: ["Android vs iOS Architecture", "Mobile Threat Landscape", "OWASP Mobile Top 10"] },
      { title: "Android Security", sortOrder: 1, lessons: ["APK Analysis", "Frida and Objection", "Root Detection Bypass", "Certificate Pinning Bypass"] },
      { title: "iOS Security", sortOrder: 2, lessons: ["IPA Analysis", "Jailbreak Detection", "Keychain Security", "URL Scheme Testing"] },
      { title: "Mobile API Testing", sortOrder: 3, lessons: ["API Communication Analysis", "Token Handling", "Data Storage Issues", "Insecure Network Communication"] },
    ],
  });

  await createCourse({
    title: "API Security", slug: "api-security", sortOrder: 23,
    description: "Master API security. JWT attacks, OAuth vulnerabilities, BOLA, rate limiting, and the OWASP API Security Top 10.",
    shortDescription: "Secure APIs against modern attacks.", difficulty: "ADVANCED", category: "API Security",
    objectives: ["Test API authentication", "Identify authorization flaws", "Prevent data exposure", "Master API Security Top 10"],
    prerequisites: ["web-technologies", "owasp-top-10"], estimatedHours: 20,
    modules: [
      { title: "API Security Fundamentals", sortOrder: 0, lessons: ["REST vs GraphQL Security", "Authentication Methods", "Authorization Patterns"] },
      { title: "JWT Security", sortOrder: 1, lessons: ["JWT Structure", "Algorithm Confusion", "Token Theft", "Refresh Token Security"] },
      { title: "OWASP API Top 10", sortOrder: 2, lessons: ["BOLA/IDOR", "Broken Authentication", "Excessive Data Exposure", "Lack of Rate Limiting"] },
      { title: "API Testing Tools", sortOrder: 3, lessons: ["Postman Security Testing", "Burp Suite API", "OWASP ZAP", "Custom Scripts"] },
    ],
  });

  await createCourse({
    title: "OSINT Mastery", slug: "osint-mastery", sortOrder: 24,
    description: "Master Open Source Intelligence. Advanced Google dorking, social media analysis, domain intelligence, and OSINT frameworks.",
    shortDescription: "Advanced intelligence gathering techniques.", difficulty: "INTERMEDIATE", category: "OSINT",
    objectives: ["Master Google dorking", "Analyze social media", "Perform domain intelligence", "Use OSINT frameworks"],
    prerequisites: [], estimatedHours: 18,
    modules: [
      { title: "OSINT Methodology", sortOrder: 0, lessons: ["PTES Framework", "Recon-ng Framework", "Maltego", "OSINT Dojo Methodology"] },
      { title: "Advanced Search Techniques", sortOrder: 1, lessons: ["Google Dorking Masterclass", "Bing and Yandex", "Archive.org", "Cached Content"] },
      { title: "Social Media Intelligence", sortOrder: 2, lessons: ["Facebook Intelligence", "Twitter/X Analysis", "LinkedIn Recon", "Instagram and TikTok"] },
      { title: "Domain Intelligence", sortOrder: 3, lessons: ["Subdomain Enumeration", "Certificate Transparency", "Wayback Machine", "Technology Fingerprinting"] },
    ],
  });

  await createCourse({
    title: "Reconnaissance", slug: "reconnaissance", sortOrder: 25,
    description: "Master the art of reconnaissance. Passive and active enumeration, OSINT, network scanning, and service fingerprinting.",
    shortDescription: "Gather intelligence before you attack.", difficulty: "INTERMEDIATE", category: "Reconnaissance",
    objectives: ["Perform passive reconnaissance", "Conduct active enumeration", "Map attack surfaces", "Document findings"],
    prerequisites: ["cybersecurity-fundamentals", "computer-networking"], estimatedHours: 20,
    modules: [
      { title: "Passive Reconnaissance", sortOrder: 0, lessons: ["OSINT Sources", "WHOIS and DNS", "Search Engine Dorking", "Social Media Intelligence"] },
      { title: "Active Reconnaissance", sortOrder: 1, lessons: ["Network Scanning", "Port Scanning", "Service Enumeration", "OS Detection"] },
      { title: "Web Reconnaissance", sortOrder: 2, lessons: ["Spidering and Crawling", "Technology Detection", "Directory Brute Forcing", "Virtual Host Discovery"] },
      { title: "Recon Tools", sortOrder: 3, lessons: ["Recon-ng", "theHarvester", "Sublist3r", "Amass"] },
    ],
  });

  await createCourse({
    title: "Exploitation", slug: "exploitation", sortOrder: 26,
    description: "Master exploitation techniques. Vulnerability analysis, exploit development, payload crafting, and safe exploitation practices.",
    shortDescription: "Exploit vulnerabilities ethically and safely.", difficulty: "ADVANCED", category: "Exploitation",
    objectives: ["Analyze vulnerabilities", "Develop exploits", "Craft payloads", "Perform safe exploitation"],
    prerequisites: ["metasploit-framework", "privilege-escalation"], estimatedHours: 25,
    modules: [
      { title: "Vulnerability Analysis", sortOrder: 0, lessons: ["CVE Database", "Nessus Scanning", "OpenVAS", "Vulnerability Prioritization"] },
      { title: "Exploit Development Basics", sortOrder: 1, lessons: ["Buffer Overflows", "Shellcode", "NOP Sleds", "Return Oriented Programming"] },
      { title: "Web Exploitation", sortOrder: 2, lessons: ["SQL Injection Exploitation", "XSS Exploitation", "File Inclusion", "Deserialization Attacks"] },
      { title: "Safe Exploitation", sortOrder: 3, lessons: ["Scope Management", "Evidence Collection", "Risk Mitigation", "Communication During Testing"] },
    ],
  });

  await createCourse({
    title: "Post Exploitation", slug: "post-exploitation", sortOrder: 27,
    description: "Master post-exploitation techniques. Persistence, lateral movement, data exfiltration, and evidence cleanup.",
    shortDescription: "What to do after you get access.", difficulty: "ADVANCED", category: "Post-Exploitation",
    objectives: ["Establish persistence", "Perform lateral movement", "Exfiltrate data safely", "Clean up evidence"],
    prerequisites: ["exploitation"], estimatedHours: 20,
    modules: [
      { title: "Persistence Mechanisms", sortOrder: 0, lessons: ["Backdoors", "Scheduled Tasks", "Registry Modifications", "Startup Scripts"] },
      { title: "Lateral Movement", sortOrder: 1, lessons: ["Pass-the-Hash", "Pass-the-Ticket", "PsExec", "SSH Tunneling", "Proxy Chains"] },
      { title: "Data Exfiltration", sortOrder: 2, lessons: ["Data Staging", "Covert Channels", "DNS Tunneling", "Encrypted Exfiltration"] },
      { title: "Covering Tracks", sortOrder: 3, lessons: ["Log Manipulation", "Timestamp Changes", "Artifact Removal", "Evidence Documentation"] },
    ],
  });

  await createCourse({
    title: "Bug Bounty Hunting", slug: "bug-bounty-hunting", sortOrder: 28,
    description: "Become an effective bug bounty hunter. Methodology, tooling, report writing, and platform strategies.",
    shortDescription: "Earn money finding real vulnerabilities.", difficulty: "INTERMEDIATE", category: "Bug Bounty",
    objectives: ["Develop a hunting methodology", "Master bounty platforms", "Write compelling reports", "Maximize earnings"],
    prerequisites: ["web-application-security", "reconnaissance"], estimatedHours: 25,
    modules: [
      { title: "Bug Bounty Methodology", sortOrder: 0, lessons: ["Program Selection", "Scope Analysis", "Testing Workflow", "Time Management"] },
      { title: "Platform Strategies", sortOrder: 1, lessons: ["HackerOne Workflow", "Bugcrowd Strategy", "Intigriti Tips", "Program Communication"] },
      { title: "Advanced Techniques", sortOrder: 2, lessons: ["Subdomain Takeovers", "Race Conditions", "Mass Assignment", "GraphQL Attacks"] },
      { title: "Report Writing", sortOrder: 3, lessons: ["Report Structure", "Impact Demonstration", "Remediation Advice", "Follow-Up Communication"] },
    ],
  });

  await createCourse({
    title: "Responsible Disclosure", slug: "responsible-disclosure", sortOrder: 29,
    description: "Master responsible disclosure practices. Coordinated vulnerability disclosure, legal considerations, and professional communication.",
    shortDescription: "Disclose vulnerabilities professionally.", difficulty: "INTERMEDIATE", category: "Professional",
    objectives: ["Understand disclosure policies", "Write disclosure reports", "Communicate with vendors", "Navigate legal requirements"],
    prerequisites: ["bug-bounty-hunting"], estimatedHours: 12,
    modules: [
      { title: "Disclosure Framework", sortOrder: 0, lessons: ["Coordinated Disclosure", "Full vs Responsible Disclosure", "Disclosure Timelines"] },
      { title: "Legal Considerations", sortOrder: 1, lessons: ["Computer Fraud Laws", "Safe Harbor Provisions", "International Regulations", "Bug Bounty Legal Terms"] },
      { title: "Communication", sortOrder: 2, lessons: ["Vendor Contact", "Professional Reports", "Negotiation Skills", "Public Disclosure"] },
      { title: "Case Studies", sortOrder: 3, lessons: ["Famous Disclosures", "Disclosure Failures", "Best Practices from Experts", "Building Reputation"] },
    ],
  });

  await createCourse({
    title: "Professional Penetration Testing", slug: "professional-pentesting", sortOrder: 30,
    description: "The complete penetration testing methodology. From scoping to reporting, master the professional pentest lifecycle.",
    shortDescription: "The complete professional pentesting course.", difficulty: "ADVANCED", category: "Professional",
    objectives: ["Plan and scope engagements", "Execute professional pentests", "Write executive reports", "Manage client relationships"],
    prerequisites: ["exploitation", "post-exploitation", "report-writing"], estimatedHours: 35,
    modules: [
      { title: "Engagement Planning", sortOrder: 0, lessons: ["Scoping and Rules of Engagement", "Legal Agreements", "Testing Methodologies (PTES, OWASP)", "Time Estimation"] },
      { title: "Execution", sortOrder: 1, lessons: ["Reconnaissance Phase", "Scanning and Enumeration", "Exploitation Phase", "Post-Exploitation Phase"] },
      { title: "Reporting", sortOrder: 2, lessons: ["Executive Summary", "Technical Findings", "Risk Ratings", "Remediation Roadmap"] },
      { title: "Professional Skills", sortOrder: 3, lessons: ["Client Communication", "Team Management", "Quality Assurance", "Continuous Improvement"] },
      { title: "Certifications", sortOrder: 4, lessons: ["OSCP Preparation", "CEH Overview", "GPEN Path", "Career Development"] },
    ],
  });

  // ─── Labs ───
  console.log("\nCreating labs...");
  const labs = [
    { slug: "linux-fundamentals-lab", title: "Linux Fundamentals Lab", description: "Practice Linux commands, file navigation, permissions, and basic system administration.", difficulty: "BEGINNER", category: "Linux", objectives: ["Navigate Linux filesystem", "Manage file permissions", "Use find and grep"], timeoutMinutes: 30 },
    { slug: "network-essentials-lab", title: "Network Essentials Lab", description: "Explore networking concepts in a safe, isolated virtual environment.", difficulty: "BEGINNER", category: "Network", objectives: ["Identify network interfaces", "Scan hosts", "Analyze traffic"], timeoutMinutes: 45 },
    { slug: "web-security-lab", title: "Web Application Security Lab", description: "Practice identifying web vulnerabilities in a controlled environment.", difficulty: "INTERMEDIATE", category: "Web Security", objectives: ["Identify input fields", "Test for injections", "Analyze auth mechanisms"], timeoutMinutes: 60 },
    { slug: "api-testing-lab", title: "API Security Testing Lab", description: "Test API endpoints for security vulnerabilities.", difficulty: "ADVANCED", category: "API Security", objectives: ["Enumerate endpoints", "Test authentication", "Identify data exposure"], timeoutMinutes: 60 },
    { slug: "privilege-escalation-lab", title: "Privilege Escalation Lab", description: "Practice escalating privileges on Linux and Windows systems.", difficulty: "ADVANCED", category: "Exploitation", objectives: ["Find SUID binaries", "Exploit misconfigurations", "Escalate to root"], timeoutMinutes: 45 },
    { slug: "sql-injection-lab", title: "SQL Injection Lab", description: "Practice various SQL injection techniques in a safe environment.", difficulty: "INTERMEDIATE", category: "Web Security", objectives: ["Perform UNION injection", "Blind SQLi techniques", "Extract data"], timeoutMinutes: 45 },
    { slug: "xss-lab", title: "Cross-Site Scripting Lab", description: "Practice XSS attacks in different contexts.", difficulty: "INTERMEDIATE", category: "Web Security", objectives: ["Reflected XSS", "Stored XSS", "DOM-based XSS"], timeoutMinutes: 30 },
    { slug: "burp-suite-lab", title: "Burp Suite Lab", description: "Master Burp Suite with hands-on web application testing.", difficulty: "INTERMEDIATE", category: "Tools", objectives: ["Configure proxy", "Use Intruder", "Master Repeater"], timeoutMinutes: 60 },
    { slug: "nmap-lab", title: "Nmap Scanning Lab", description: "Master Nmap with real scanning scenarios.", difficulty: "INTERMEDIATE", category: "Tools", objectives: ["SYN scans", "Service detection", "NSE scripts"], timeoutMinutes: 30 },
    { slug: "active-directory-lab", title: "Active Directory Lab", description: "Practice AD enumeration and attacks in a lab environment.", difficulty: "ADVANCED", category: "Windows", objectives: ["Enumerate AD", "Kerberoasting", "Lateral movement"], timeoutMinutes: 60 },
  ];

  for (const lab of labs) {
    await prisma.lab.upsert({
      where: { slug: lab.slug }, update: {},
      create: {
        ...lab, isPublished: true, instructions: `Complete the lab exercises:\n${lab.objectives.map((o, i) => `${i + 1}. ${o}`).join("\n")}`,
        hints: ["Start with enumeration", "Look for misconfigurations", "Check for common vulnerabilities"],
      },
    });
  }

  console.log("\nDatabase seeded successfully!");
  console.log("Total: 30 courses, 10 labs, roles, permissions, plans, admin user");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
