import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

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

type BlogContentBlock =
  | {
      id: string;
      type: "heading" | "paragraph";
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

type BlogPostRecord = {
  id: string;
  title: string;
  slug: string;
  url: string;
  shortDescription: string;
  coverImageUrl: string | null;
  status: "draft" | "published";
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: BlogCategory;
  subcategory: BlogSubcategory | null;
  tags: BlogTag[];
  contentBlocks: BlogContentBlock[];
};

const mockBlogPosts: BlogPostRecord[] = [
  {
    id: "post-acl-rehab-001",
    title: "Phuc hoi sau noi soi khop goi: nhung dieu can luu y trong 6 tuan dau",
    slug: "phuc-hoi-sau-noi-soi-khop-goi",
    url: "https://blogs.chedinhnghia.com/phuc-hoi-sau-noi-soi-khop-goi",
    shortDescription:
      "Mau bai viet SSR duoc render tu mot post object giong du lieu DB, gom metadata, tags va danh sach content blocks theo dung huong editor dang luu.",
    coverImageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1600&q=80",
    status: "published",
    publishedAt: "2026-04-30T09:00:00.000Z",
    createdAt: "2026-04-27T08:00:00.000Z",
    updatedAt: "2026-04-30T09:00:00.000Z",
    category: {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Y khoa",
      slug: "y-khoa",
    },
    subcategory: {
      id: "11111111-1111-1111-1111-111111111112",
      name: "Khop goi",
      slug: "khop-goi",
    },
    tags: [
      { id: "tag-001", name: "Noi soi", slug: "noi-soi" },
      { id: "tag-002", name: "Khop goi", slug: "khop-goi" },
      { id: "tag-003", name: "Phuc hoi chuc nang", slug: "phuc-hoi-chuc-nang" },
    ],
    contentBlocks: [
      {
        id: "block-001",
        type: "paragraph",
        text:
          "Sau noi soi khop goi, giai doan 6 tuan dau thuong quyet dinh toc do giam dau, khoi phuc tam van dong va kha nang quay lai sinh hoat hang ngay. Noi dung mau nay duoc dung de mo phong bai viet cong khai khi render tren server.",
      },
      {
        id: "block-002",
        type: "heading",
        text: "Muc tieu trong 2 tuan dau",
      },
      {
        id: "block-003",
        type: "paragraph",
        text:
          "O giai doan som, uu tien hang dau la kiem soat dau va phu ne, dong thoi tap phuc hoi tam duoi duoi goi, gap goi trong nguong an toan va kich hoat lai nhom co dui truoc. Nguoi benh thuong duoc huong dan di lai voi muc do tai trong phu hop theo chi dinh cu the.",
      },
      {
        id: "block-004",
        type: "image",
        src: "",
        alt: "Mo phong vi tri anh minh hoa phuc hoi sau noi soi khop goi",
        caption: "Cho danh anh dai dien cho block image khi noi du lieu that.",
      },
      {
        id: "block-005",
        type: "heading",
        text: "Dau hieu can lien he bac si som",
      },
      {
        id: "block-006",
        type: "paragraph",
        text:
          "Sot, vet mo do tang, dau tang len dot ngot, chan sung nhieu hoac kho gap duoi goi ro ret la nhung dau hieu can duoc danh gia lai. Bai viet cong khai can giu duoc van phong ro rang, de doc va phan cap thong tin tot cho nhung noi dung nhu the nay.",
      },
      {
        id: "block-007",
        type: "youtube",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        caption: "Video minh hoa bai tap giai doan som sau noi soi khop goi.",
      },
      {
        id: "block-008",
        type: "heading",
        text: "Tai lieu tham khao cho nguoi benh",
      },
      {
        id: "block-009",
        type: "link",
        url: "https://blogs.chedinhnghia.com/huong-dan-tap-som-sau-mo-khop-goi",
        text: "Huong dan tap som sau mo khop goi",
      },
      {
        id: "block-010",
        type: "paragraph",
        text:
          "Khi noi API that, toan bo vung than bai duoi day se duoc sinh tu danh sach blocks nay ma khong can viet tay noi dung trong component. Do la muc tieu chinh cua template SSR nay.",
      },
    ],
  },
];

const relatedPosts = [
  "Phan biet dau goi sau chan thuong va dau do qua tai",
  "Khi nao can tai kham sau mo khop goi",
  "Lich tap phuc hoi giai doan som cho nguoi choi the thao",
];

async function getBlogPostBySlug(slug: string): Promise<BlogPostRecord | null> {
  // Placeholder server-side data fetch. Replace this with the real published
  // post query once the slug detail endpoint is available.
  return mockBlogPosts.find((post) => post.slug === slug) ?? null;
}

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

function estimateReadTime(blocks: BlogContentBlock[]) {
  const totalWords = blocks.reduce((count, block) => {
    if (block.type === "heading" || block.type === "paragraph" || block.type === "link") {
      return count + block.text.trim().split(/\s+/).filter(Boolean).length;
    }

    if (block.type === "image" || block.type === "youtube") {
      return count + block.caption.trim().split(/\s+/).filter(Boolean).length;
    }

    return count;
  }, 0);

  return `${Math.max(1, Math.ceil(totalWords / 180))} phút`;
}

function extractYouTubeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${parsed.pathname.replace("/", "")}`;
    }

    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function renderContentBlock(block: BlogContentBlock) {
  if (block.type === "heading") {
    return (
      <h2 className="font-serif text-2xl font-black tracking-tight text-navy">
        {block.text}
      </h2>
    );
  }

  if (block.type === "paragraph") {
    return (
      <p className="text-[17px] leading-8 text-gray-800">
        {block.text}
      </p>
    );
  }

  if (block.type === "image") {
    return (
      <figure className="overflow-hidden rounded-[12px] border border-gray-200 bg-[#f5f8fc] p-4">
        <div className="flex min-h-72 items-center justify-center rounded-[8px] bg-[linear-gradient(135deg,#153560_0%,#1e4a80_60%,#c4922a_140%)] px-6 text-center text-sm font-semibold tracking-[0.16em] text-white/84">
          {block.src ? block.alt || "Hinh anh bai viet" : "Image block placeholder"}
        </div>
        {block.caption ? (
          <figcaption className="mt-3 text-sm leading-7 text-gray-600">
            {block.caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  if (block.type === "youtube") {
    const embedUrl = extractYouTubeEmbedUrl(block.url);

    return (
      <figure className="overflow-hidden rounded-[12px] border border-gray-200 bg-[#f7f9fd] p-4">
        {embedUrl ? (
          <div className="aspect-video overflow-hidden rounded-[8px] bg-navy">
            <iframe
              src={embedUrl}
              title={block.caption || "YouTube video"}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="flex min-h-56 items-center justify-center rounded-[8px] bg-navy px-6 text-center text-sm font-semibold tracking-[0.16em] text-white/82">
            YouTube block placeholder
          </div>
        )}
        {block.caption ? (
          <figcaption className="mt-3 text-sm leading-7 text-gray-600">
            {block.caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  if (block.type === "link") {
    return (
      <p className="rounded-[10px] border border-gold/25 bg-[#fffaf0] px-5 py-4 text-sm font-semibold text-navy">
        Tai lieu tham khao:{" "}
        <a
          href={block.url}
          className="text-gold underline decoration-gold/50 underline-offset-4"
          target="_blank"
          rel="noreferrer"
        >
          {block.text}
        </a>
      </p>
    );
  }

  return null;
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Bai viet khong ton tai",
    };
  }

  return {
    title: `${post.title} | TS.BS. Chế Đình Nghĩa`,
    description: post.shortDescription,
  };
}

export default async function BlogArticlePage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post || post.status !== "published") {
    notFound();
  }

  const readTime = estimateReadTime(post.contentBlocks);

  return (
    <main className="min-h-screen bg-off-white text-text">
      <section className="overflow-hidden bg-gradient-to-br from-navy-dark via-navy to-navy-light text-white">
        <div className="absolute inset-0 opacity-[0.14] [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.34)_1.2px,transparent_1.2px)] [background-size:26px_26px]" />
        <div className="relative mx-auto max-w-6xl px-6 py-6 sm:px-10 lg:px-16">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-5">
            <Link
              href="/"
              className="font-serif text-base font-bold tracking-tight text-white transition hover:text-gold"
            >
              TS.BS. Chế Đình Nghĩa
            </Link>
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/75">
              <Link href="/" className="transition hover:text-gold">
                Trang chủ
              </Link>
              <span>/</span>
              <Link href="/#blog" className="transition hover:text-gold">
                Bài viết
              </Link>
              <span>/</span>
              
            </div>
          </div>

          <div className="grid gap-4 py-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:py-8">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-gold">
                <span>{post.category.name}</span>
                {post.subcategory ? (
                  <>
                    <span className="h-1 w-1 rounded-full bg-gold/70" />
                    <span>{post.subcategory.name}</span>
                  </>
                ) : null}
              </div>

              <h1 className="font-serif mt-5 text-2xl font-black leading-tight tracking-tight sm:text-4xl">
                {post.title}
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-white/82 sm:text-lg">
                {post.shortDescription}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/15 pt-6 text-sm text-white/78">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/55">Ngày đăng</p>
                  <p className="mt-1 font-semibold text-white">
                    {formatPublishedDate(post.publishedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/55">Cập nhật</p>
                  <p className="mt-1 font-semibold text-white">
                    {formatPublishedDate(post.updatedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/55">Thời gian đọc</p>
                  <p className="mt-1 font-semibold text-white">{readTime}</p>
                </div>
              </div>

              {post.tags.length > 0 ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-semibold text-white/82"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 px-6 pb-16 sm:px-10 lg:px-16 lg:pb-24">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="overflow-hidden rounded-[12px] border border-gray-200 bg-white shadow-[0_10px_30px_rgba(10,35,66,0.08)]">
            <div className="border-b border-gray-200 bg-[linear-gradient(135deg,#f3f6fb_0%,#ffffff_58%,#eef5fc_100%)] px-6 py-8 sm:px-10">
              <div className="rounded-[10px] border border-dashed border-gold/40 bg-white/70 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                  Vi tri anh dai dien
                </p>
                {post.coverImageUrl ? (
                  <div className="mt-4 overflow-hidden rounded-[8px]">
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      className="h-72 w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="mt-4 flex min-h-56 items-center justify-center rounded-[8px] bg-[linear-gradient(135deg,#153560_0%,#1e4a80_60%,#c4922a_140%)] px-6 text-center text-sm font-semibold tracking-[0.16em] text-white/82">
                    Template hero image placeholder
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-10 sm:px-10 sm:py-12">
              <div className="mx-auto max-w-3xl">
                <div className="rounded-r-[10px] border-l-4 border-gold bg-[#fffaf0] px-5 py-4 text-sm leading-7 text-gray-800">
                  Noi dung duoi day duoc render hoan toan tu truong `contentBlocks` cua post mock.
                  Khi noi API that, component nay co the giu nguyen va chi thay data source.
                </div>

                <div className="mt-10 space-y-8">
                  {post.contentBlocks.map((block) => (
                    <section key={block.id}>
                      {renderContentBlock(block)}
                    </section>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <aside className="space-y-6">

            <div className="rounded-[12px] border border-gray-200 bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fd_100%)] p-6 shadow-[0_10px_26px_rgba(10,35,66,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                Bai viet lien quan
              </p>
              <div className="mt-4 space-y-4">
                {relatedPosts.map((item) => (
                  <div key={item} className="rounded-[8px] border border-gray-200 bg-white p-4">
                    <p className="font-serif text-base font-bold leading-6 text-navy">{item}</p>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      Placeholder cho danh sach bai viet lien quan sau nay.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
