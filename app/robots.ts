import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard/",
          "/login",
          "/register",
          "/verify-email",
          "/forgot-password",
          "/reset-password",
          "/_next/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard/",
          "/login",
          "/register",
          "/verify-email",
          "/forgot-password",
          "/reset-password",
          "/_next/",
        ],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard/",
          "/login",
          "/register",
        ],
      },
    ],
    sitemap: "https://attacklab.vercel.app/sitemap.xml",
    host: "https://attacklab.vercel.app",
  };
}
