import type { BlogPost } from "./types";

export const BLOG_POST_PAGE_SIZE = 50;
export const FALLBACK_CATEGORY = { id: "cat-medical", name: "Y khoa" };

export function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createUniqueSlug(title: string, existingSlugs: Array<string | null>) {
  const baseSlug = slugify(title) || "untitled";
  const takenSlugs = new Set(existingSlugs.filter((slug): slug is string => Boolean(slug)));

  if (!takenSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  while (takenSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}

export function createPaginationItems(currentPage: number, totalPages: number) {
  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const validPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((firstPage, secondPage) => firstPage - secondPage);
  const items: Array<number | "..."> = [];

  validPages.forEach((page, index) => {
    const previousPage = validPages[index - 1];
    if (previousPage && page - previousPage > 1) {
      items.push("...");
    }
    items.push(page);
  });

  return items;
}

export function getTagNames(posts: BlogPost[]) {
  return Array.from(new Map(posts.flatMap((post) => post.tags).map((tag) => [tag.id, tag])).values()).sort(
    (firstTag, secondTag) => firstTag.name.localeCompare(secondTag.name)
  );
}

export function isPublishedStatus(status: string) {
  return status.trim().toLowerCase() === "published";
}

export function formatBlogStatus(status: BlogPost["status"]) {
  return isPublishedStatus(status) ? "Published" : "Draft";
}

export function formatBlogUpdatedAt(updatedAt: string) {
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) {
    return updatedAt;
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());

  return `${day}/${month}/${year}`;
}
