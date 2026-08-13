import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/auth", "/forgot-password", "/reset-password", "/easter-egg"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
