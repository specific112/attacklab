const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://attacklab.vercel.app";
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "";

/**
 * Submit URLs to IndexNow for instant indexing by Bing, Yandex, Naver, etc.
 * Google does not support IndexNow but will pick up pages via sitemap.
 * Fire-and-forget — never blocks the caller.
 */
export async function submitToIndexNow(urls: string[]): Promise<void> {
  if (!INDEXNOW_KEY || urls.length === 0) return;

  const validUrls = urls.filter((u) => u.startsWith(SITE_URL));
  if (validUrls.length === 0) return;

  try {
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: "attacklab.vercel.app",
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/api/indexnow`,
        urlList: validUrls,
      }),
    });
  } catch {}
}

/**
 * Submit the homepage and key pages after a deploy or major content change.
 */
export async function submitHomepage(): Promise<void> {
  await submitToIndexNow([
    SITE_URL,
    `${SITE_URL}/courses`,
    `${SITE_URL}/labs`,
    `${SITE_URL}/programs`,
    `${SITE_URL}/about`,
    `${SITE_URL}/pricing`,
    `${SITE_URL}/faq`,
    `${SITE_URL}/features`,
    `${SITE_URL}/challenges`,
  ]);
}

/**
 * Submit a single course page when it's created or updated.
 */
export async function submitCoursePage(slug: string): Promise<void> {
  await submitToIndexNow([`${SITE_URL}/courses/${slug}`]);
}
