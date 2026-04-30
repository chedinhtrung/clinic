import type { BlogLookupData, BlogPost, BlogPostPageResponse } from "./types";

const ADMIN_API_BASE_URL = "/api/admin";

type ApiErrorResponse = {
  error?: string;
};

type BlogPostResponse = {
  post: BlogPost;
};

type BlogAutosaveResponse = {
  post: BlogPost;
  savedAt: string;
};

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as T & ApiErrorResponse;

  if (!response.ok) {
    throw new Error(data.error || "Khong the thuc hien thao tac bai viet.");
  }

  return data;
}

export async function fetchBlogLookupData(): Promise<BlogLookupData> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/blog/lookup`);
  return readJson<BlogLookupData>(response);
}

export async function fetchBlogPostsPage({
  page,
  pageSize,
  searchText,
  filterText,
}: {
  page: number;
  pageSize: number;
  searchText: string;
  filterText: string;
}): Promise<BlogPostPageResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    searchText,
    filterText,
  });
  const response = await fetch(`${ADMIN_API_BASE_URL}/blog/posts?${params.toString()}`);
  return readJson<BlogPostPageResponse>(response);
}

export async function createDraftBlogPost(): Promise<BlogPost> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/blog/posts`, {
    method: "POST",
  });
  const data = await readJson<BlogPostResponse>(response);
  return data.post;
}

export async function autosaveBlogPost(post: BlogPost): Promise<{ savedAt: string; post: BlogPost }> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/blog/posts/${post.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(post),
  });
  const data = await readJson<BlogAutosaveResponse>(response);
  return { savedAt: data.savedAt, post: data.post };
}

export async function deleteBlogPost(postId: string): Promise<void> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/blog/posts/${postId}`, {
    method: "DELETE",
  });
  await readJson<{ ok: boolean }>(response);
}
