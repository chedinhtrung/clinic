"use client";

export type BlogStatus = "draft" | "published";

export type BlogCategory = {
  id: string;
  name: string;
};

export type BlogSubcategory = {
  id: string;
  name: string;
};

export type BlogTag = {
  id: string;
  name: string;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string | null;
  category: BlogCategory;
  subcategory: BlogSubcategory | null;
  tags: BlogTag[];
  status: BlogStatus;
  updatedAt: string;
  shortDescription: string;
  coverImageUrl: string | null;
  contentMarkdown: string;
};

export type BlogPostSummary = Omit<BlogPost, "shortDescription" | "contentMarkdown">;

export type PostLoadStatus = "idle" | "loading" | "error";

export type BlogAutosaveStatus = "idle" | "saving" | "saved" | "error";

export type BlogLookupData = {
  categories: BlogCategory[];
  subcategories: BlogSubcategory[];
  tags: BlogTag[];
};

export type BlogPostPageResponse = {
  posts: BlogPostSummary[];
  page: number;
  pageSize: number;
  totalPosts: number;
  totalPages: number;
};
