"use client";

import { useEffect, useState } from "react";
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
  label: "Tat ca",
  slug: null,
};

async function fetchPosts(categorySlug?: string): Promise<BlogPost[]> {
  const params = new URLSearchParams();

  if (categorySlug) {
    params.set("category", categorySlug);
  }

  const query = params.toString();
  const response = await fetch(
    withBlogApiBase(`/api/posts${query ? `?${query}` : ""}`),
  );

  if (!response.ok) {
    throw new Error("Failed to load blog posts");
  }

  const data: PostsResponse = await response.json();
  return data.posts;
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
        const postData = await fetchPosts(activeCategory?.slug ?? undefined);
        setPosts(postData);
      } catch (error) {
        console.error(error);
        setErrorMessage("Khong tai duoc danh sach bai viet luc nay.");
      } finally {
        setIsLoading(false);
      }
    }

    loadPosts();
  }, [categories, selectedCategory]);

  return (
    <section className="bg-white">
      <div className="relative overflow-hidden bg-gradient-to-r from-navy-dark via-navy to-[#274d7f]">
        <div className="absolute inset-0 opacity-[0.14] [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.32)_1.3px,transparent_1.3px)] [background-size:28px_28px]" />
        <div className="relative px-6 py-12 sm:px-20 sm:py-16">
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

      <div className="px-6 py-12 sm:px-20 sm:py-16">
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => {
            const isActive = selectedCategory === category.id;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`rounded-[4px] border px-6 py-3 text-base font-semibold transition ${
                  isActive
                    ? "border-navy bg-navy text-white"
                    : "border-[#d7dfed] bg-white text-[#516384] hover:border-navy/40 hover:text-navy"
                }`}
              >
                {category.label}
              </button>
            );
          })}
        </div>

        <div className="mt-8 max-h-[28rem] space-y-4 overflow-y-auto pr-2">
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
              <a
                key={post.id}
                href={post.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg border border-[#d7dfed] bg-white px-6 py-5 text-left shadow-sm transition hover:border-navy/40 hover:shadow-md"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                  {post.subcategory?.name ?? post.category.name}
                </p>
                <h3 className="font-serif mt-2 text-lg font-bold text-navy sm:text-xl">
                  {post.title}
                </h3>
                {post.shortDescription && (
                  <p className="mt-3 text-sm leading-7 text-[#516384] sm:text-base">
                    {post.shortDescription}
                  </p>
                )}
              </a>
            ))}
        </div>
      </div>
    </section>
  );
}
