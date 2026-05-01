import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type BlogCategory = {
  id: string;
  name: string;
  slug: string;
};

type BlogSubcategory = {
  id: string;
  name: string;
  slug: string;
};

type BlogTag = {
  id: string;
  name: string;
  slug: string;
};

type BlogContentBlock =
  | {
      id: string;
      type: "heading" | "paragraph";
      text: string;
    }
  | {
      id: string;
      type: "image";
      src: string;
      alt: string;
      caption: string;
    }
  | {
      id: string;
      type: "youtube";
      url: string;
      caption: string;
    }
  | {
      id: string;
      type: "link";
      url: string;
      text: string;
    };

type BlogPostRecord = {
  id: string;
  title: string;
  slug: string;
  url: string;
  shortDescription: string;
  coverImageUrl: string | null;
  status: "draft" | "published";
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: BlogCategory;
  subcategory: BlogSubcategory | null;
  tags: BlogTag[];
  contentBlocks: BlogContentBlock[];
};

const BLOG_API_BASE_URL =
  process.env.BLOG_API_BASE_URL ??
  process.env.NEXT_PUBLIC_BLOG_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:5002";

const DEFAULT_BLOG_COVER_IMAGE =
  "https://t4.ftcdn.net/jpg/16/79/44/21/360_F_1679442196_OEsi0AFKie6hYMBpvmXwwRgRYGV4U6Lz.jpg";

type BlogPostResponse = {
  post: BlogPostRecord;
};

type BlogPostsResponse = {
  posts: BlogPostRecord[];
  page: number;
  pageSize: number;
  totalPosts: number;
  totalPages: number;
};

async function getBlogPostBySlug(slug: string): Promise<BlogPostRecord | null> {
  const response = await fetch(
    `${BLOG_API_BASE_URL}/api/posts/${encodeURIComponent(slug)}`,
    {
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load published blog post");
  }

  const data: BlogPostResponse = await response.json();
  return data.post;
}

async function getRelatedPosts({
  categorySlug,
  excludeSlug,
  page,
}: {
  categorySlug: string;
  excludeSlug: string;
  page: number;
}): Promise<BlogPostsResponse> {
  const params = new URLSearchParams({
    category: categorySlug,
    excludeSlug,
    page: String(page),
    pageSize: "4",
  });

  const response = await fetch(`${BLOG_API_BASE_URL}/api/posts?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load related blog posts");
  }

  return response.json() as Promise<BlogPostsResponse>;
}

function formatPublishedDate(value: string | null) {
  if (!value) {
    return "Chua cong bo";
  }

  const date = new Date(value);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function estimateReadTime(blocks: BlogContentBlock[]) {
  const totalWords = blocks.reduce((count, block) => {
    if (block.type === "heading" || block.type === "paragraph" || block.type === "link") {
      return count + block.text.trim().split(/\s+/).filter(Boolean).length;
    }

    if (block.type === "image" || block.type === "youtube") {
      return count + block.caption.trim().split(/\s+/).filter(Boolean).length;
    }

    return count;
  }, 0);

  return `${Math.max(1, Math.ceil(totalWords / 180))} phút`;
}

function extractYouTubeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${parsed.pathname.replace("/", "")}`;
    }

    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function renderContentBlock(block: BlogContentBlock) {
  if (block.type === "heading") {
    return (
      <h2 className="font-serif text-2xl font-black tracking-tight text-navy">
        {block.text}
      </h2>
    );
  }

  if (block.type === "paragraph") {
    return (
      <p className="text-[17px] leading-8 text-gray-800">
        {block.text}
      </p>
    );
  }

  if (block.type === "image") {
    return (
      <figure className="overflow-hidden rounded-[8px] border border-gray-200 bg-[#f5f8fc] p-3 sm:rounded-[12px] sm:p-4">
        {block.src ? (
          <div className="overflow-hidden rounded-[6px] bg-white sm:rounded-[8px]">
            <img
              src={block.src}
              alt={block.alt || ""}
              className="mx-auto max-h-[34rem] w-full object-contain"
            />
          </div>
        ) : (
          <div className="flex min-h-56 items-center justify-center rounded-[6px] bg-[linear-gradient(135deg,#153560_0%,#1e4a80_60%,#c4922a_140%)] px-4 text-center text-sm font-semibold tracking-[0.16em] text-white/84 sm:min-h-72 sm:rounded-[8px] sm:px-6">
            Image block placeholder
          </div>
        )}
        {block.caption ? (
          <figcaption className="mt-3 text-sm leading-7 text-gray-600">
            {block.caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  if (block.type === "youtube") {
    const embedUrl = extractYouTubeEmbedUrl(block.url);

    return (
      <figure className="overflow-hidden rounded-[8px] border border-gray-200 bg-[#f7f9fd] p-3 sm:rounded-[12px] sm:p-4">
        {embedUrl ? (
          <div className="aspect-video overflow-hidden rounded-[6px] bg-navy sm:rounded-[8px]">
            <iframe
              src={embedUrl}
              title={block.caption || "YouTube video"}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="flex min-h-48 items-center justify-center rounded-[6px] bg-navy px-4 text-center text-sm font-semibold tracking-[0.16em] text-white/82 sm:min-h-56 sm:rounded-[8px] sm:px-6">
            YouTube block placeholder
          </div>
        )}
        {block.caption ? (
          <figcaption className="mt-3 text-sm leading-7 text-gray-600">
            {block.caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  if (block.type === "link") {
    return (
      <p className="rounded-[8px] border border-gold/25 bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-navy sm:rounded-[10px] sm:px-5 sm:py-4">
        Tai lieu tham khao:{" "}
        <a
          href={block.url}
          className="text-gold underline decoration-gold/50 underline-offset-4"
          target="_blank"
          rel="noreferrer"
        >
          {block.text}
        </a>
      </p>
    );
  }

  return null;
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Bai viet khong ton tai",
    };
  }

  return {
    title: `${post.title} | TS.BS. Chế Đình Nghĩa`,
    description: post.shortDescription,
  };
}

export default async function BlogArticlePage(
  {
    params,
    searchParams,
  }: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ relatedPage?: string }>;
  },
) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const post = await getBlogPostBySlug(slug);

  if (!post || post.status !== "published") {
    notFound();
  }

  const relatedPageValue = Number(resolvedSearchParams.relatedPage ?? "1");
  const relatedPage = Number.isFinite(relatedPageValue) ? Math.max(1, Math.floor(relatedPageValue)) : 1;
  const relatedPosts = await getRelatedPosts({
    categorySlug: post.category.slug,
    excludeSlug: post.slug,
    page: relatedPage,
  });
  const readTime = estimateReadTime(post.contentBlocks);
  const coverImageUrl = post.coverImageUrl || DEFAULT_BLOG_COVER_IMAGE;

  return (
    <main className="min-h-screen bg-off-white text-text">
      <section className="overflow-hidden bg-gradient-to-br from-navy-dark via-navy to-navy-light text-white">
        <div className="absolute inset-0 opacity-[0.14] [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.34)_1.2px,transparent_1.2px)] [background-size:26px_26px]" />
        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-10 lg:px-16">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-5">
            <Link
              href="/"
              className="font-serif text-base font-bold tracking-tight text-white transition hover:text-gold"
            >
              TS.BS. Chế Đình Nghĩa
            </Link>
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/75">
              <Link href="/" className="transition hover:text-gold">
                Trang chủ
              </Link>
              <span>/</span>
              <Link href="/#blog" className="transition hover:text-gold">
                Bài viết
              </Link>
              <span>/</span>
              
            </div>
          </div>

          <div className="grid gap-4 py-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:py-8">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-gold">
                <span>{post.category.name}</span>
                {post.subcategory ? (
                  <>
                    <span className="h-1 w-1 rounded-full bg-gold/70" />
                    <span>{post.subcategory.name}</span>
                  </>
                ) : null}
              </div>

              <h1 className="font-serif mt-5 text-2xl font-black leading-tight tracking-tight sm:text-4xl">
                {post.title}
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-white/82 sm:text-lg">
                {post.shortDescription}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/15 pt-6 text-sm text-white/78">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/55">Ngày đăng</p>
                  <p className="mt-1 font-semibold text-white">
                    {formatPublishedDate(post.publishedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/55">Cập nhật</p>
                  <p className="mt-1 font-semibold text-white">
                    {formatPublishedDate(post.updatedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/55">Thời gian đọc</p>
                  <p className="mt-1 font-semibold text-white">{readTime}</p>
                </div>
              </div>

              {post.tags.length > 0 ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-semibold text-white/82"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 pb-14 sm:mt-8 sm:pb-16 lg:pb-24">
        <div className="mx-auto grid max-w-7xl gap-5 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_320px] px-4 sm:px-10 lg:px-16">
          <article className="overflow-hidden rounded-[10px] border border-gray-200 bg-white shadow-[0_10px_30px_rgba(10,35,66,0.08)] sm:rounded-[12px]">
            <div className="border-b border-gray-200 bg-[linear-gradient(135deg,#f3f6fb_0%,#ffffff_58%,#eef5fc_100%)]">
              <div className="overflow-hidden rounded-[8px] sm:rounded-[10px]">
                <img
                  src={coverImageUrl}
                  alt={post.title}
                  className="h-56 w-full object-cover sm:h-72"
                />
              </div>
            </div>

            <div className="px-4 py-7 sm:px-10 sm:py-12">
              <div className="mx-auto max-w-3xl">
                <div className="mt-6 space-y-6 sm:mt-10 sm:space-y-8">
                  {post.contentBlocks.map((block) => (
                    <section key={block.id}>
                      {renderContentBlock(block)}
                    </section>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <aside className="space-y-4 sm:space-y-6">

            <div className="rounded-[10px] border border-gray-200 bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fd_100%)] p-4 shadow-[0_10px_26px_rgba(10,35,66,0.06)] sm:rounded-[12px] sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                Bài viết liên quan
              </p>
              <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
                {relatedPosts.posts.length === 0 ? (
                  <div className="rounded-[6px] border border-gray-200 bg-white p-3 text-sm leading-6 text-gray-600 sm:rounded-[8px] sm:p-4">
                    Chưa có bài viết nào khác trong cùng chuyên mục.
                  </div>
                ) : (
                  relatedPosts.posts.map((relatedPost) => (
                    <Link
                      key={relatedPost.id}
                      href={relatedPost.url}
                      className="block rounded-[6px] border border-gray-200 bg-white p-3 transition hover:border-navy/25 hover:shadow-sm sm:rounded-[8px] sm:p-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                        {relatedPost.subcategory?.name ?? relatedPost.category.name}
                      </p>
                      <p className="font-serif mt-2 text-base font-bold leading-6 text-navy">
                        {relatedPost.title}
                      </p>
                      {relatedPost.publishedAt ? (
                        <p className="mt-2 text-xs font-medium text-gray-500">
                          {formatPublishedDate(relatedPost.publishedAt)}
                        </p>
                      ) : null}
                      {relatedPost.shortDescription ? (
                        <p className="mt-2 text-sm leading-6 text-gray-600">
                          {relatedPost.shortDescription}
                        </p>
                      ) : null}
                    </Link>
                  ))
                )}
              </div>

              {relatedPosts.totalPages > 1 ? (
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-gray-200 pt-3 text-sm sm:mt-5 sm:gap-3 sm:pt-4">
                  {relatedPosts.page > 1 ? (
                    <Link
                      href={`/blog/${post.slug}?relatedPage=${relatedPosts.page - 1}`}
                      className="rounded-[5px] border border-gray-200 bg-white px-2.5 py-2 font-semibold text-gray-700 transition hover:bg-[#edf3fb] sm:rounded-[6px] sm:px-3"
                    >
                      Trang trước
                    </Link>
                  ) : (
                    <span className="rounded-[5px] border border-gray-200 bg-[#f7f9fd] px-2.5 py-2 font-semibold text-gray-400 sm:rounded-[6px] sm:px-3">
                      Trang trước
                    </span>
                  )}

                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    {relatedPosts.page}/{relatedPosts.totalPages}
                  </span>

                  {relatedPosts.page < relatedPosts.totalPages ? (
                    <Link
                      href={`/blog/${post.slug}?relatedPage=${relatedPosts.page + 1}`}
                      className="rounded-[5px] border border-gray-200 bg-white px-2.5 py-2 font-semibold text-gray-700 transition hover:bg-[#edf3fb] sm:rounded-[6px] sm:px-3"
                    >
                      Trang sau
                    </Link>
                  ) : (
                    <span className="rounded-[5px] border border-gray-200 bg-[#f7f9fd] px-2.5 py-2 font-semibold text-gray-400 sm:rounded-[6px] sm:px-3">
                      Trang sau
                    </span>
                  )}
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
