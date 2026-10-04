import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

/** Crawler rules. The authenticated app is not indexed. */
export default function robots(): MetadataRoute.Robots {
  const base = siteConfig.url;
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/tutor", "/tutorials", "/quiz", "/solve", "/exam-prep", "/flashcards", "/progress", "/profile", "/onboarding", "/checkout", "/admin", "/auth/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
