"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { withBlogApiBase } from "@/app/apiBase";

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

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  url: string;
  shortDescription: string | null;
  coverImageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: BlogCategory;
  subcategory: BlogSubcategory | null;
  tags: BlogTag[];
};

type PostsResponse = {
  posts: BlogPost[];
  page: number;
  pageSize: number;
  totalPosts: number;
  totalPages: number;
};

type CategoriesResponse = {
  categories: BlogCategory[];
};

type FilterCategory = {
  id: string;
  label: string;
  slug: string | null;
};

const allCategory: FilterCategory = {
  id: "all",
  label: "Tất cả",
  slug: null,
};

const BLOG_PAGE_SIZE = 10;

function formatPublishedDate(publishedAt: string | null) {
  if (!publishedAt) {
    return null;
  }

  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) {
    return publishedAt;
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());

  return `${day}/${month}/${year}`;
}

async function fetchPosts({
  categorySlug,
  page,
}: {
  categorySlug?: string;
  page: number;
}): Promise<PostsResponse> {
  const params = new URLSearchParams();

  if (categorySlug) {
    params.set("category", categorySlug);
  }

  params.set("page", String(page));
  params.set("pageSize", String(BLOG_PAGE_SIZE));

  const query = params.toString();
  const response = await fetch(
    withBlogApiBase(`/api/posts${query ? `?${query}` : ""}`),
  );

  if (!response.ok) {
    throw new Error("Failed to load blog posts");
  }

  return response.json() as Promise<PostsResponse>;
}

async function fetchCategories(): Promise<BlogCategory[]> {
  const response = await fetch(withBlogApiBase("/api/categories"));

  if (!response.ok) {
    throw new Error("Failed to load blog categories");
  }

  const data: CategoriesResponse = await response.json();
  return data.categories;
}

export default function Blogs() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<FilterCategory[]>([allCategory]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        const categoryData = await fetchCategories();
        setCategories([
          allCategory,
          ...categoryData.map((category) => ({
            id: category.id,
            label: category.name,
            slug: category.slug,
          })),
        ]);
      } catch (error) {
        console.error(error);
        setErrorMessage("Không tải được danh mục bài viết");
      }
    }

    loadCategories();
  }, []);

  useEffect(() => {
    async function loadPosts() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const activeCategory = categories.find((category) => category.id === selectedCategory);
        const postData = await fetchPosts({
          categorySlug: activeCategory?.slug ?? undefined,
          page: currentPage,
        });
        setPosts(postData.posts);
        setCurrentPage(postData.page);
        setTotalPages(postData.totalPages);
      } catch (error) {
        console.error(error);
        setErrorMessage("Không tải được danh sách bài viết.");
      } finally {
        setIsLoading(false);
      }
    }

    loadPosts();
  }, [categories, currentPage, selectedCategory]);

  return (
    <section className="bg-white">
      <div className="relative px-6 py-12 sm:px-20 sm:py-16 overflow-hidden bg-gradient-to-r from-navy-dark via-navy to-[#274d7f]">
        <div className="max-w-7xl mx-auto w-full">
          <div className="absolute inset-0 opacity-[0.14] [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.32)_1.3px,transparent_1.3px)] [background-size:28px_28px]" />
          <div className="relative">
            <div className="max-w-4xl">
              <div className="mb-5 h-1.5 w-20 rounded-full bg-gold" />
              <h2 className="font-serif text-2xl font-black tracking-tight text-white sm:text-4xl">
                Bài viết &amp; Kiến thức Y khoa
              </h2>
              <p className="font-sans mt-3 max-w-3xl text-sm leading-7 text-white/80 sm:text-base">
                Thông tin y tế chuyên sâu, ca lâm sàng và hoạt động chuyên môn
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-12 sm:px-20 sm:py-16">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => {
              const isActive = selectedCategory === category.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setCurrentPage(1);
                  }}
                  className={`rounded-[4px] border px-6 py-3 text-base font-semibold transition ${isActive
                      ? "border-navy bg-navy text-white"
                      : "border-[#d7dfed] bg-white text-[#516384] hover:border-navy/40 hover:text-navy"
                    }`}
                >
                  {category.label}
                </button>
              );
            })}
          </div>

          <div className="mt-8 space-y-4">
            {isLoading && (
              <div className="rounded-lg border border-[#d7dfed] bg-[#f8fafc] px-6 py-5 text-sm text-[#516384]">
                Đang tải bài viết...
              </div>
            )}

            {!isLoading && errorMessage && (
              <div className="rounded-lg border border-[#f1c7c7] bg-[#fff6f6] px-6 py-5 text-sm text-[#9f3a38]">
                {errorMessage}
              </div>
            )}

            {!isLoading && !errorMessage && posts.length === 0 && (
              <div className="rounded-lg border border-[#d7dfed] bg-[#f8fafc] px-6 py-5 text-sm text-[#516384]">
                Chưa có bài viết nào trong chuyên mục này.
              </div>
            )}

            {!isLoading &&
              !errorMessage &&
              posts.map((post) => (
                <Link
                  key={post.id}
                  href={post.url}
                  className="block rounded-lg border border-[#d7dfed] bg-white px-6 py-5 text-left shadow-sm transition hover:border-navy/40 hover:shadow-md"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold uppercase tracking-[0.18em]">
                    <p className="text-gold">{post.subcategory?.name ?? post.category.name}</p>
                    {post.publishedAt && (
                      <p className="text-[#7a8aa7]">{formatPublishedDate(post.publishedAt)}</p>
                    )}
                  </div>
                  <h3 className="font-serif mt-2 text-lg font-bold text-navy sm:text-xl">
                    {post.title}
                  </h3>
                  {post.shortDescription && (
                    <p className="mt-3 text-sm leading-7 text-[#516384] sm:text-base">
                      {post.shortDescription}
                    </p>
                  )}
                  {post.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="rounded-full border border-[#d7dfed] bg-[#f8fafc] px-3 py-1 text-xs font-medium text-[#516384]"
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
          </div>

          {!isLoading && !errorMessage && totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between gap-4 border-t border-[#e3e9f4] pt-6">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="rounded-[4px] border border-[#d7dfed] bg-white px-5 py-3 text-sm font-semibold text-[#516384] transition hover:border-navy/40 hover:text-navy disabled:cursor-not-allowed disabled:opacity-45"
              >
                Trang trước
              </button>

              <p className="text-sm font-semibold text-[#516384]">
                Trang {currentPage} / {totalPages}
              </p>

              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="rounded-[4px] border border-[#d7dfed] bg-white px-5 py-3 text-sm font-semibold text-[#516384] transition hover:border-navy/40 hover:text-navy disabled:cursor-not-allowed disabled:opacity-45"
              >
                Trang sau
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
