import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success } from "@/lib/api-response";

// POST /api/admin/security/log — write attack log entry (called by middleware)
export async function POST(req: NextRequest) {
  // Verify the request comes from our middleware (internal only)
  const authHeader = req.headers.get("authorization");
  const internalSecret = process.env.INTERNAL_API_SECRET || process.env.AUTH_SECRET;
  if (authHeader !== `Bearer ${internalSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { ip, type, path, method, userAgent, details, blocked } = body;

  if (!ip || !type) {
    return new Response("Missing required fields", { status: 400 });
  }

  try {
    await db.attackLog.create({
      data: {
        ip,
        type,
        path: path || "",
        method: method || "UNKNOWN",
        userAgent: userAgent?.slice(0, 500) || null,
        details: details?.slice(0, 1000) || null,
        blocked: blocked || false,
      },
    });
  } catch {
    // Don't let logging failures break anything
  }

  return success({ logged: true });
}
