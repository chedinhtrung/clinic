export type BlogCategory = {
  id: string;
  name: string;
  slug: string;
};

export type BlogSubcategory = {
  id: string;
  name: string;
  slug: string;
};

export type BlogTag = {
  id: string;
  name: string;
  slug: string;
};

export type BlogPost = {
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

export type BlogPostRecord = BlogPost & {
  status: "draft" | "published";
  contentMarkdown: string;
};

export type BlogPostResponse = {
  post: BlogPostRecord;
};

export type BlogPostsResponse = {
  posts: BlogPostRecord[];
  page: number;
  pageSize: number;
  totalPosts: number;
  totalPages: number;
};

export type BlogCategoryResponse = {
  categories: BlogCategory[];
};
