import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

const schema = z.object({ message: z.string().min(1).max(600) });

const responses: Record<string, string> = {
  lab: "To start a lab, navigate to the Labs page and select a lab that matches your skill level. Labs are isolated, intentionally vulnerable environments designed for authorized learning. You can start, stop, and restart labs at any time within your session limits.",
  course: "We offer courses across 8 tracks: Cybersecurity Fundamentals, Kali Linux, Web Application Security, Network Security, Active Directory Security, API Security, OSINT, and Bug Bounty. Enroll in any course from the Learn page to start tracking your progress.",
  report: "To submit a vulnerability report, navigate to the Programs page, select an active bug bounty program, and follow the report submission template. Include a clear description, steps to reproduce, and impact assessment.",
  payment: "We accept credit cards and debit cards through our secure payment provider. Visit the Pricing page to view available subscription plans: Free, Beginner, Professional, and Premium.",
  help: "I can help you with: finding courses, starting labs, submitting reports, understanding subscriptions, or navigating the platform. What would you like to know?",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return error("Invalid message");

    const msg = parsed.data.message.toLowerCase();
    let reply = responses.help;

    for (const [key, value] of Object.entries(responses)) {
      if (key !== "help" && msg.includes(key)) {
        reply = value;
        break;
      }
    }

    if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
      reply = "Welcome to ATTACKLAB! I'm ATTACK, your AI security assistant. I can help you navigate courses, labs, programs, and more. What are you interested in?";
    }

    return success({ reply });
  } catch (e) {
    return error("Failed to process message", 500);
  }
}
