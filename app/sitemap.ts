import type { MetadataRoute } from "next";

const siteUrl = "https://attacklab.vercel.app";

const staticRoutes = [
  "",
  "/learn",
  "/labs",
  "/challenges",
  "/programs",
  "/community",
  "/features",
  "/reports",
  "/certifications",
  "/leaderboard",
  "/pricing",
  "/faq",
  "/blog",
  "/docs",
  "/careers",
  "/about",
  "/contact",
  "/security",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : route === "/contact" ? 0.9 : 0.8,
  }));
}
