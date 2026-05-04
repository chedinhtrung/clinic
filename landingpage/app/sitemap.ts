import type { MetadataRoute } from "next";

const SITE_URL = "https://chedinhnghia.com";
const MAX_BLOG_URLS = 10000;
const BLOG_PAGE_SIZE = 500;
const BLOG_API_BASE_URL =
  process.env.BLOG_API_BASE_URL ??
  process.env.NEXT_PUBLIC_BLOG_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:5002";

type BlogPost = {
  slug: string;
  updatedAt: string;
  status?: "draft" | "published";
};

type PostsResponse = {
  posts: BlogPost[];
  page: number;
  pageSize: number;
  totalPosts: number;
  totalPages: number;
};

function getStaticRoutes(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/profile`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}

async function fetchPublishedBlogUrls(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && routes.length < MAX_BLOG_URLS) {
    const response = await fetch(
      `${BLOG_API_BASE_URL}/api/posts?page=${page}&pageSize=${BLOG_PAGE_SIZE}`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch blog posts for sitemap");
    }

    const data = (await response.json()) as PostsResponse;
    totalPages = Math.max(1, data.totalPages || 1);

    for (const post of data.posts) {
      if (!post?.slug) {
        continue;
      }

      if (post.status && post.status !== "published") {
        continue;
      }

      routes.push({
        url: `${SITE_URL}/blog/${encodeURIComponent(post.slug)}`,
        lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });

      if (routes.length >= MAX_BLOG_URLS) {
        break;
      }
    }

    page += 1;
  }

  return routes;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = getStaticRoutes();

  try {
    const blogRoutes = await fetchPublishedBlogUrls();
    return [...staticRoutes, ...blogRoutes];
  } catch {
    return staticRoutes;
  }
}
