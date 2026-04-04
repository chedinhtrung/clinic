"use client";

import { useEffect, useMemo, useState } from "react";

type Category = "all" | "medical" | "clinical" | "news";

type BlogPost = {
  id: number;
  title: string;
  href: string;
  category: Exclude<Category, "all">;
};

const categories: { id: Category; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "medical", label: "Y khoa" },
  { id: "clinical", label: "Ca lâm sàng" },
  { id: "news", label: "Tin tức" },
];

const mockPosts: BlogPost[] = [
  {
    id: 1,
    title: "Nội soi khớp gối: khi nào nên thực hiện?",
    href: "/blog/noi-soi-khop-goi",
    category: "medical",
  },
  {
    id: 2,
    title: "Ca lâm sàng phục hồi sau chấn thương dây chằng",
    href: "/blog/ca-lam-sang-day-chang",
    category: "clinical",
  },
  {
    id: 3,
    title: "Cập nhật lịch khám và hoạt động chuyên môn tháng này",
    href: "/blog/tin-tuc-thang-nay",
    category: "news",
  },
  {
    id: 3,
    title: "Cập nhật lịch khám và hoạt động chuyên môn tháng này",
    href: "/blog/tin-tuc-thang-nay",
    category: "news",
  },
  {
    id: 3,
    title: "Cập nhật lịch khám và hoạt động chuyên môn tháng này",
    href: "/blog/tin-tuc-thang-nay",
    category: "news",
  },
  {
    id: 3,
    title: "Cập nhật lịch khám và hoạt động chuyên môn tháng này",
    href: "/blog/tin-tuc-thang-nay",
    category: "news",
  },
  {
    id: 3,
    title: "Cập nhật lịch khám và hoạt động chuyên môn tháng này",
    href: "/blog/tin-tuc-thang-nay",
    category: "news",
  },
];

async function fetchPosts(): Promise<BlogPost[]> {
  // TODO: Replace this mock return with a real backend fetch when the API is ready.
  return mockPosts;
}

export default function Blogs() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [posts, setPosts] = useState<BlogPost[]>(mockPosts);

  useEffect(() => {
    async function loadPosts() {
      const data = await fetchPosts();
      setPosts(data);
    }

    loadPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    if (selectedCategory === "all") {
      return posts;
    }

    return posts.filter((post) => post.category === selectedCategory);
  }, [posts, selectedCategory]);

  return (
    <section className="bg-white">
      <div className="relative overflow-hidden bg-gradient-to-r from-navy-dark via-navy to-[#274d7f]">
        <div className="absolute inset-0 opacity-[0.14] [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.32)_1.3px,transparent_1.3px)] [background-size:28px_28px]" />
        <div className="relative px-6 py-12 sm:px-20 sm:py-16">
          <div className="max-w-4xl">
            <div className="mb-5 h-1.5 w-20 rounded-full bg-gold" />
            <h2 className=" text-2xl font-black tracking-tight text-white sm:text-4xl">
              Bài viết &amp; Kiến thức Y khoa
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/80 sm:text-base">
              Thông tin y tế chuyên sâu, ca lâm sàng và hoạt động chuyên môn
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-12 sm:px-20 sm:py-16">
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => {
            const isActive = selectedCategory === category.id;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`rounded-[4px] border px-6 py-3 text-base font-semibold transition ${
                  isActive
                    ? "border-navy bg-navy text-white"
                    : "border-[#d7dfed] bg-white text-[#516384] hover:border-navy/40 hover:text-navy"
                }`}
              >
                {category.label}
              </button>
            );
          })}
        </div>

        <div className="mt-8 max-h-[28rem] space-y-4 overflow-y-auto pr-2">
          {filteredPosts.map((post) => (
            <a
              key={post.id}
              href={post.href}
              className="block rounded-lg border border-[#d7dfed] bg-white px-6 py-5 text-left shadow-sm transition hover:border-navy/40 hover:shadow-md"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                {categories.find((category) => category.id === post.category)?.label}
              </p>
              <h3 className="mt-2 text-lg font-bold text-navy sm:text-xl">
                {post.title}
              </h3>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
