import { NextRequest } from "next/server";
import { success, error } from "@/lib/api-response";

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

// POST /api/indexnow — submit URLs for instant indexing
// GET /api/indexnow — verify ownership (returns key file)
export async function GET(req: NextRequest) {
  if (!INDEXNOW_KEY) {
    return error("IndexNow not configured", 503);
  }

  // Return the verification key file
  return new Response(INDEXNOW_KEY, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

export async function POST(req: NextRequest) {
  if (!INDEXNOW_KEY) {
    return error("IndexNow not configured. Set INDEXNOW_KEY in .env", 503);
  }

  const body = await req.json();
  const { url, urls } = body;

  const urlList = urls || (url ? [url] : []);
  if (urlList.length === 0) {
    return error("Provide url or urls array");
  }

  // Validate URLs are from our domain
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://attacklab.vercel.app";
  const validUrls = urlList.filter((u: string) => u.startsWith(siteUrl));

  if (validUrls.length === 0) {
    return error("All URLs must be from attacklab.vercel.app");
  }

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: "attacklab.vercel.app",
        key: INDEXNOW_KEY,
        keyLocation: `${siteUrl}/api/indexnow`,
        urlList: validUrls,
      }),
    });

    return success({
      submitted: validUrls.length,
      status: response.status,
    });
  } catch (err) {
    return error("Failed to submit to IndexNow");
  }
}
