export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
export const BLOG_API_BASE_URL = process.env.NEXT_PUBLIC_BLOG_API_BASE_URL ?? API_BASE_URL;

export function withApiBase(path: string) {
  return `${API_BASE_URL}${path}`;
}

export function withBlogApiBase(path: string) {
  return `${BLOG_API_BASE_URL}${path}`;
}
