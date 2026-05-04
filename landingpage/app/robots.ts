import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/booking",
          "/booking/",
          "/booking/*",
          "/booking-email",
          "/booking-email/*",
          "/confirmation",
          "/confirmation/*",
          "/payment",
          "/payment/*",
        ],
      },
    ],
    sitemap: "https://chedinhnghia.com/sitemap.xml",
  };
}
