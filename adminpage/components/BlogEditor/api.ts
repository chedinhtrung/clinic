import type { BlogLookupData, BlogPost, BlogPostPageResponse } from "./types";

const categories = [
  { id: "cat-medical", name: "Y khoa" },
  { id: "cat-case", name: "Ca lam sang" },
  { id: "cat-news", name: "Tin tuc" },
  { id: "cat-article", name: "Bai viet" },
];

const subcategories = [
  { id: "sub-sports-injury", name: "Chan thuong the thao" },
  { id: "sub-rehab", name: "Phuc hoi chuc nang" },
  { id: "sub-case-report", name: "Bao cao dieu tri" },
  { id: "sub-announcement", name: "Thong bao" },
];

const tags = [
  { id: "tag-arthroscopy", name: "noi-soi" },
  { id: "tag-knee", name: "dau-goi" },
  { id: "tag-recovery", name: "phuc-hoi" },
  { id: "tag-acl", name: "acl" },
  { id: "tag-sports", name: "the-thao" },
  { id: "tag-pt", name: "vat-ly-tri-lieu" },
  { id: "tag-running", name: "chay-bo" },
  { id: "tag-schedule", name: "lich-kham" },
];

const mockPosts: BlogPost[] = [
  {
    id: "post-1",
    title: "Noi soi khop goi: khi nao nen thuc hien?",
    slug: "noi-soi-khop-goi-khi-nao-nen-thuc-hien",
    category: categories[0],
    subcategory: subcategories[0],
    tags: [tags[0], tags[1], tags[2]],
    status: "Published",
    updatedAt: "2026-04-20",
    shortDescription:
      "Tong quan ngan gon ve chi dinh noi soi khop goi va nhung dau hieu can tham kham som.",
    contentBlocks: [
      { id: "block-1-1", type: "heading", text: "Khi nao can noi soi khop goi?" },
      {
        id: "block-1-2",
        type: "paragraph",
        text: "Noi soi khop goi thuong duoc can nhac khi trieu chung dau, ket khop hoac han che van dong keo dai sau dieu tri bao ton.",
      },
      {
        id: "block-1-3",
        type: "image",
        src: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80",
        alt: "Phong kham chinh hinh",
        caption: "Hinh minh hoa moi truong tham kham va tu van dieu tri.",
      },
    ],
  },
  {
    id: "post-2",
    title: "Phuc hoi sau tai tao day chang cheo truoc",
    slug: null,
    category: categories[1],
    subcategory: subcategories[2],
    tags: [tags[3], tags[4], tags[5]],
    status: "Draft",
    updatedAt: "2026-04-19",
    shortDescription: "Ban nhap ve qua trinh theo doi va phuc hoi van dong sau chan thuong ACL.",
    contentBlocks: [
      {
        id: "block-2-1",
        type: "paragraph",
        text: "Giai doan phuc hoi can duoc theo doi theo muc tieu van dong, suc co va kha nang quay lai the thao.",
      },
    ],
  },
  {
    id: "post-3",
    title: "Dau goi khi chay bo: nhung dieu can luu y",
    slug: "dau-goi-khi-chay-bo-nhung-dieu-can-luu-y",
    category: categories[0],
    subcategory: subcategories[1],
    tags: [tags[1], tags[6]],
    status: "Published",
    updatedAt: "2026-04-18",
    shortDescription: "Cac dau hieu thuong gap, cach giam tai tam thoi va thoi diem nen di kham.",
    contentBlocks: [],
  },
  {
    id: "post-4",
    title: "Cap nhat lich kham va hoat dong chuyen mon thang 4",
    slug: null,
    category: categories[2],
    subcategory: subcategories[3],
    tags: [tags[7]],
    status: "Draft",
    updatedAt: "2026-04-17",
    shortDescription: "Thong bao lich kham, lich nghi va cac chuong trinh chuyen mon trong thang.",
    contentBlocks: [],
  },
];

export async function fetchBlogLookupData(): Promise<BlogLookupData> {
  return { categories, subcategories, tags };
}

export async function autosaveBlogPost(post: BlogPost): Promise<{ savedAt: string }> {
  await new Promise((resolve) => window.setTimeout(resolve, 650));

  console.info("[mock autosave] Blog post saved", {
    id: post.id,
    title: post.title || "Untitled",
    blockCount: post.contentBlocks.length,
  });

  return { savedAt: new Date().toISOString() };
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
  const normalizedSearch = searchText.trim().toLowerCase();
  const filters = filterText
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const filteredPosts = mockPosts
    .filter((post) => {
      if (normalizedSearch && !post.title.toLowerCase().includes(normalizedSearch)) {
        return false;
      }

      if (filters.length === 0) {
        return true;
      }

      const searchableFields = [
        post.category.name,
        post.subcategory?.name,
        ...post.tags.map((tag) => tag.name),
      ]
        .filter((value): value is string => Boolean(value))
        .map((value) => value.toLowerCase());

      return filters.every((filter) => searchableFields.some((field) => field.includes(filter)));
    })
    .sort((firstPost, secondPost) => secondPost.updatedAt.localeCompare(firstPost.updatedAt));
  const totalPosts = filteredPosts.length;
  const totalPages = Math.max(1, Math.ceil(totalPosts / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (safePage - 1) * pageSize;

  return {
    posts: filteredPosts.slice(startIndex, startIndex + pageSize),
    page: safePage,
    pageSize,
    totalPosts,
    totalPages,
  };
}
