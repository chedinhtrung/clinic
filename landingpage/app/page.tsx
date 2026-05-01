import Navbar from "@/components/Navbar";
import Intro from "@/app/Intro";
import Booking from "@/app/Booking";

const socialPages = [
  {
    title: "Facebook",
    description: "Theo dõi cập nhật và gửi tin nhắn qua trang Facebook chính thức.",
    href: "https://web.facebook.com/BSNghiachuyenxuongkhop",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
        <path d="M14 8.5V6.75c0-.58.39-.75.67-.75H16V3.8c-.23-.03-1.02-.1-1.94-.1-1.92 0-3.23 1.17-3.23 3.32V8.5H8.75V11h2.08v7.2H13.4V11h2.13l.34-2.5H14Z" />
      </svg>
    ),
  },
  {
    title: "YouTube",
    description: "Xem các nội dung chia sẻ kiến thức cơ xương khớp và chấn thương chỉnh hình.",
    href: "https://www.youtube.com/@nghiachedinh",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
        <path d="M20.15 7.2a2.5 2.5 0 0 0-1.76-1.77C16.84 5 12 5 12 5s-4.84 0-6.39.43A2.5 2.5 0 0 0 3.85 7.2 26 26 0 0 0 3.43 12a26 26 0 0 0 .42 4.8 2.5 2.5 0 0 0 1.76 1.77C7.16 19 12 19 12 19s4.84 0 6.39-.43a2.5 2.5 0 0 0 1.76-1.77 26 26 0 0 0 .42-4.8 26 26 0 0 0-.42-4.8ZM10.3 15V9l5.2 3-5.2 3Z" />
      </svg>
    ),
  },
  {
    title: "TikTok",
    description: "Theo dõi các video ngắn về chăm sóc, phục hồi và phòng tránh chấn thương.",
    href: "https://www.tiktok.com/@tsnghia_xuongkhop",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
        <path d="M15.2 3.5c.28 2.04 1.42 3.25 3.3 3.38v2.5a6.32 6.32 0 0 1-3.3-1.02v5.98c0 3.02-2.04 5.16-5.08 5.16-2.75 0-4.62-1.72-4.62-4.22 0-2.65 2.03-4.52 4.9-4.52.32 0 .62.03.9.1v2.63a3.4 3.4 0 0 0-.92-.13c-1.32 0-2.17.73-2.17 1.82 0 1 .76 1.7 1.83 1.7 1.36 0 2.17-.82 2.17-2.55V3.5h2.99Z" />
      </svg>
    ),
  },
];

function SocialPages() {
  return (
    <section className="bg-white px-6 py-14 text-navy-dark sm:px-10 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-gold">
            Kênh chính thức
          </p>
          <h2 className="mt-4 font-serif text-2xl font-black tracking-tight sm:text-3xl">
            Theo dõi TS. BS. Chế Đình Nghĩa
          </h2>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {socialPages.map((page) => (
            <a
              key={page.title}
              href={page.href}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-36 flex-col rounded-[8px] border border-[#d7dfed] bg-[#f7f9fc] p-5 transition hover:border-navy/40 hover:shadow-[0_18px_34px_rgba(10,35,66,0.08)]"
            >
              <h3 className="flex items-center gap-2 text-2xl font-bold text-navy">
                <span className="text-gold">{page.icon}</span>
                <span className="">{page.title}</span>
              </h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-[#5a6d8f]">
                {page.description}
              </p>
              <span className="mt-5 text-sm font-bold text-gold">
                Mở {page.title} →
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div>
      <Navbar />
      <Intro />
      <Booking />
      <SocialPages />
    </div>
  );
}
