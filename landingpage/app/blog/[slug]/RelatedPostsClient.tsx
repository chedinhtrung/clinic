"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { BlogPostsResponse } from "../types";

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

type RelatedPostsClientProps = {
  blogApiBaseUrl: string;
  categorySlug: string;
  subcategorySlug?: string;
  excludeSlug: string;
  bookingHref: string;
  initialData: BlogPostsResponse;
};

export default function RelatedPostsClient({
  blogApiBaseUrl,
  categorySlug,
  subcategorySlug,
  excludeSlug,
  bookingHref,
  initialData,
}: RelatedPostsClientProps) {
  const [relatedPosts, setRelatedPosts] = useState<BlogPostsResponse>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPage(page: number) {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        excludeSlug,
        page: String(page),
        pageSize: "4",
      });

      if (subcategorySlug) {
        params.set("subcategory", subcategorySlug);
      } else {
        params.set("category", categorySlug);
      }

      const response = await fetch(`${blogApiBaseUrl}/api/posts?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load related posts");
      }

      const data = (await response.json()) as BlogPostsResponse;
      setRelatedPosts(data);
    } catch {
      setError("Không thể tải bài viết liên quan. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    setRelatedPosts(initialData);
    setError(null);
    setIsLoading(false);
  }, [initialData]);

  return (
    <div className="rounded-[10px] border border-gray-200 bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fd_100%)] p-4 shadow-[0_10px_26px_rgba(10,35,66,0.06)] sm:rounded-[12px] sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Bài viết liên quan</p>
      <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
        {relatedPosts.posts.length === 0 ? (
          <div className="rounded-[6px] border border-gray-200 bg-white p-3 text-sm leading-6 text-gray-600 sm:rounded-[8px] sm:p-4">
            Chưa có bài viết nào khác trong cùng chuyên mục.
          </div>
        ) : (
          relatedPosts.posts.map((relatedPost) => (
            <Link
              key={relatedPost.id}
              href={`/blog/${relatedPost.slug}`}
              className="block rounded-[6px] border border-gray-200 bg-white p-3 transition hover:border-navy/25 hover:shadow-sm sm:rounded-[8px] sm:p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                {relatedPost.subcategory?.name ?? relatedPost.category.name}
              </p>
              <p className="font-serif mt-2 text-base font-bold leading-6 text-navy">{relatedPost.title}</p>
              {relatedPost.publishedAt ? (
                <p className="mt-2 text-xs font-medium text-gray-500">{formatPublishedDate(relatedPost.publishedAt)}</p>
              ) : null}
              {relatedPost.shortDescription ? (
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">{relatedPost.shortDescription}</p>
              ) : null}
            </Link>
          ))
        )}
      </div>

      {error ? <p className="mt-3 text-sm text-[#b94034]">{error}</p> : null}

      {relatedPosts.totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-gray-200 pt-3 text-sm sm:mt-5 sm:gap-3 sm:pt-4">
          <button
            type="button"
            onClick={() => loadPage(relatedPosts.page - 1)}
            disabled={relatedPosts.page === 1 || isLoading}
            className="rounded-[5px] border border-gray-200 bg-white px-2.5 py-2 font-semibold text-gray-700 transition enabled:hover:bg-[#edf3fb] disabled:cursor-not-allowed disabled:bg-[#f7f9fd] disabled:text-gray-400 sm:rounded-[6px] sm:px-3"
          >
            Trang trước
          </button>

          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            {relatedPosts.page}/{relatedPosts.totalPages}
          </span>

          <button
            type="button"
            onClick={() => loadPage(relatedPosts.page + 1)}
            disabled={relatedPosts.page === relatedPosts.totalPages || isLoading}
            className="rounded-[5px] border border-gray-200 bg-white px-2.5 py-2 font-semibold text-gray-700 transition enabled:hover:bg-[#edf3fb] disabled:cursor-not-allowed disabled:bg-[#f7f9fd] disabled:text-gray-400 sm:rounded-[6px] sm:px-3"
          >
            Trang sau
          </button>
        </div>
      ) : null}

      <Link
        href={bookingHref}
        className="mt-4 block rounded-[6px] border border-gold/35 bg-[#fffaf0] p-3 transition hover:border-gold/60 hover:bg-[#fff5df] sm:mt-5 sm:rounded-[8px] sm:p-4"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Đặt lịch khám</p>
        <p className="font-serif mt-2 text-base font-bold leading-6 text-navy">
          Cần tư vấn trực tiếp? Đặt lịch với TS.BS. Chế Đình Nghĩa
        </p>
      </Link>
    </div>
  );
}
