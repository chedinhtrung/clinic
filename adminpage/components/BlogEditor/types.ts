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

export type BlogContentBlock =
  | {
      id: string;
      type: "heading";
      text: string;
    }
  | {
      id: string;
      type: "paragraph";
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
  contentBlocks: BlogContentBlock[];
};

export type PostLoadStatus = "idle" | "loading" | "error";

export type BlogAutosaveStatus = "idle" | "saving" | "saved" | "error";

export type BlogLookupData = {
  categories: BlogCategory[];
  subcategories: BlogSubcategory[];
  tags: BlogTag[];
};

export type BlogPostPageResponse = {
  posts: BlogPost[];
  page: number;
  pageSize: number;
  totalPosts: number;
  totalPages: number;
};
