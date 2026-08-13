import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/home",
    "/blocks",
    "/modules/sub-anatomy",
    "/modules/sub-physiology",
    "/modules/sub-biochemistry",
    "/modules/sub-minor",
    "/topics/sub-anatomy",
    "/topics/sub-physiology",
    "/topics/sub-biochemistry",
    "/topics/sub-minor",
    "/exam",
    "/leaderboard",
    "/account",
    "/onboarding",
    "/privacy",
    "/terms",
  ];

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
