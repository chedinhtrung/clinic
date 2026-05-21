"use client";

import type { BlogPost, PostLoadStatus } from "./types";
import { createPaginationItems, formatBlogStatus, formatBlogUpdatedAt, isPublishedStatus } from "./utils";

type BlogPostTableProps = {
  posts: BlogPost[];
  selectedPostId: string | null;
  currentPage: number;
  totalPages: number;
  totalPosts: number;
  postLoadStatus: PostLoadStatus;
  onSelectPost: (postId: string) => void;
  onTitleChange: (postId: string, title: string) => void;
  onPageChange: (page: number) => void;
};

export default function BlogPostTable({
  posts,
  selectedPostId,
  currentPage,
  totalPages,
  totalPosts,
  postLoadStatus,
  onSelectPost,
  onTitleChange,
  onPageChange,
}: BlogPostTableProps) {
  const paginationItems = createPaginationItems(currentPage, totalPages);

  return (
    <div className="mt-6 flex min-h-0 flex-1 flex-col border-y border-[#e3e2df] bg-white">
      <div className="grid grid-cols-[2.4fr_1fr_1fr_1.4fr_0.8fr_0.7fr] border-b border-[#e3e2df] bg-[#f7f6f3] px-3 py-2 text-xs font-medium text-[#787774]">
        <div>Name</div>
        <div>Category</div>
        <div>Subcategory</div>
        <div>Tags</div>
        <div>Status</div>
        <div>Updated</div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {posts.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-[#787774]">
            {postLoadStatus === "loading" && "Loading posts..."}
            {postLoadStatus === "error" && "Could not load posts."}
            {postLoadStatus === "idle" && "No posts match the current query."}
          </div>
        )}

        {posts.map((post) => {
          const isSelected = post.id === selectedPostId;

          return (
            <div
              key={post.id}
              onClick={() => onSelectPost(post.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectPost(post.id);
                }
              }}
              className={`group grid cursor-pointer grid-cols-[2.4fr_1fr_1fr_1.4fr_0.8fr_0.7fr] items-center border-b border-[#efefed] px-3 py-2 text-left text-sm transition hover:bg-[#f7f6f3] focus:outline-none focus-visible:bg-[#f7f6f3] ${
                isSelected ? "bg-[#f1f1ef]" : "bg-white"
              }`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <input
                  value={post.title}
                  onChange={(event) => onTitleChange(post.id, event.target.value)}
                  onFocus={() => onSelectPost(post.id)}
                  placeholder="Untitled"
                  className="min-w-0 flex-1 truncate bg-transparent px-1 py-1 font-medium text-[#37352f] outline-none placeholder:text-[#b9b8b4]"
                />
              </div>
              <div className="truncate text-[#787774]">{post.category.name}</div>
              <div className="truncate text-[#787774]">{post.subcategory?.name ?? ""}</div>
              <div className="flex flex-wrap gap-1">
                {post.tags.slice(0, 3).map((tag) => (
                  <span key={tag.id} className="rounded bg-[#f1f1ef] px-2 py-0.5 text-xs text-[#5f5e5b]">
                    {tag.name}
                  </span>
                ))}
              </div>
              <div>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    isPublishedStatus(post.status) ? "bg-[#e4f4eb] text-[#2f7d54]" : "bg-[#f7ead9] text-[#9b6a1f]"
                  }`}
                >
                  {formatBlogStatus(post.status)}
                </span>
              </div>
              <div className="text-xs text-[#787774]">{formatBlogUpdatedAt(post.updatedAt)}</div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-[#e3e2df] px-3 py-3 text-sm text-[#787774]">
        <div>{totalPosts === 0 ? "0 posts" : `Page ${currentPage} of ${totalPages} - ${totalPosts} posts`}</div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || postLoadStatus === "loading"}
            className="rounded px-2 py-1 transition hover:bg-[#f1f1ef] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Prev
          </button>
          {paginationItems.map((item, index) =>
            item === "..." ? (
              <span key={`ellipsis-${index}`} className="px-2 py-1 text-[#b9b8b4]">
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                disabled={postLoadStatus === "loading"}
                className={`rounded px-2 py-1 transition hover:bg-[#f1f1ef] disabled:cursor-not-allowed disabled:opacity-40 ${
                  item === currentPage ? "bg-[#37352f] text-white hover:bg-[#37352f]" : ""
                }`}
              >
                {item}
              </button>
            )
          )}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || postLoadStatus === "loading"}
            className="rounded px-2 py-1 transition hover:bg-[#f1f1ef] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
