import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { TOOLS } from "@/lib/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPages = ["", "/tools", "/about", "/faq", "/contact", "/privacy", "/terms"].map(
    (path) => ({
      url: `${siteConfig.url}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
    })
  );

  const toolPages = TOOLS.map((tool) => ({
    url: `${siteConfig.url}/tools/${tool.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: tool.popular ? 0.9 : 0.6,
  }));

  return [...staticPages, ...toolPages];
}
