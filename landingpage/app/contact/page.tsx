import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const contactLinks = [
  {
    title: "Email",
    description: "Gửi email nếu bạn cần giải đáp thắc mắc chi tiết hoặc hỗ trợ trong quá trình đăng ký tư vấn.",
    href: "mailto:coxuongkhop.bsnghia@gmail.com",
    label: "coxuongkhop.bsnghia@gmail.com",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    ),
  },
  {
    title: "Facebook",
    description: "Theo dõi, cập nhật và gửi tin nhắn qua trang Facebook chính thức.",
    href: "https://web.facebook.com/BSNghiachuyenxuongkhop",
    label: "Mở Facebook",
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
    label: "Mở YouTube",
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
    label: "Mở TikTok",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
        <path d="M15.2 3.5c.28 2.04 1.42 3.25 3.3 3.38v2.5a6.32 6.32 0 0 1-3.3-1.02v5.98c0 3.02-2.04 5.16-5.08 5.16-2.75 0-4.62-1.72-4.62-4.22 0-2.65 2.03-4.52 4.9-4.52.32 0 .62.03.9.1v2.63a3.4 3.4 0 0 0-.92-.13c-1.32 0-2.17.73-2.17 1.82 0 1 .76 1.7 1.83 1.7 1.36 0 2.17-.82 2.17-2.55V3.5h2.99Z" />
      </svg>
    ),
  },
];

export const metadata: Metadata = {
  title: "Liên hệ & đặt lịch TS. BS. Chế Đình Nghĩa",
  description: "Thông tin liên hệ, kênh mạng xã hội chính thức và liên kết đặt lịch tư vấn online với TS. BS. Chế Đình Nghĩa.",
  openGraph: {
    title: "Liên hệ & đặt lịch TS. BS. Chế Đình Nghĩa",
    description:
      "Thông tin liên hệ, kênh mạng xã hội chính thức và liên kết đặt lịch tư vấn online với TS. BS. Chế Đình Nghĩa.",
    url: "https://chedinhnghia.com/contact",
    siteName: "TS. BS. Chế Đình Nghĩa",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Liên hệ & đặt lịch TS. BS. Chế Đình Nghĩa",
    description:
      "Thông tin liên hệ và đặt lịch tư vấn với TS. BS. Chế Đình Nghĩa.",
  },
};

export default function ContactPage() {
  const contactPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Liên hệ & đặt lịch TS. BS. Chế Đình Nghĩa",
    url: "https://chedinhnghia.com/contact",
    inLanguage: "vi-VN",
    mainEntity: {
      "@type": "Person",
      name: "TS.BS. Chế Đình Nghĩa",
      description: "TS.BS. Chế Đình Nghĩa là bác sĩ chuyên khoa chấn thương chỉnh hình, tư vấn và điều trị các bệnh lý cơ xương khớp, chấn thương thể thao và phục hồi sau phẫu thuật.",
      medicalSpecialty: "Orthopedic",
      knowsAbout: [
        "Chấn thương chỉnh hình",
        "Cơ xương khớp",
        "Chấn thương thể thao",
        "Khớp gối",
        "Khớp vai",
        "PRP"
      ],
      alumniOf: [
        {
          "@type": "EducationalOrganization",
          name: "Viện nghiên cứu Khoa học Y Dược Lâm sàng 108"
        },
        {
          "@type": "CollegeOrUniversity",
          name: "Đại học Y Hà Nội"
        }
      ],
      email: "mailto:coxuongkhop.bsnghia@gmail.com",
      sameAs: [
        "https://web.facebook.com/TsNghia.xuongkhop",
        "https://www.youtube.com/@nghiachedinh",
        "https://www.tiktok.com/@tsnghia_xuongkhop",
        "https://vnexpress.net/suc-khoe/cac-benh/bac-si/974-ts-bs-che-dinh-nghia",
        "https://www.benhvien108.vn/thong-tin-bac-si.htm?id=9c878eb1-634d-4cbe-8091-35622470c601",
        "https://tamanhhospital.vn/chuyen-gia/che-dinh-nghia/"
      ],
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: "coxuongkhop.bsnghia@gmail.com",
          availableLanguage: ["vi"]
        }
      ]
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageJsonLd) }}
      />
      <Navbar />
      <main className="bg-[#f7f9fc] px-6 py-14 text-navy-dark sm:px-10 lg:px-20">
        <section className="mx-auto max-w-7xl">
          <div className="max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-gold">
              Liên hệ
            </p>
            <h1 className="mt-4 font-serif text-2xl font-black tracking-tight sm:text-4xl">
              Kết nối với TS. BS. Chế Đình Nghĩa
            </h1>
            <p className="mt-5 text-lg leading-8 text-[#52627e]">
              Bạn có thể theo dõi các kênh chính thức, gửi email hoặc đặt lịch tư vấn online trên hệ thống để được giải đáp cụ thể.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {contactLinks.map((link) => (
              <a
                key={link.title}
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                className="flex min-h-40 flex-col rounded-[8px] border border-[#d7dfed] bg-white p-5 shadow-[0_14px_28px_rgba(10,35,66,0.06)] transition hover:border-navy/40 hover:shadow-[0_18px_34px_rgba(10,35,66,0.09)]"
              >
                <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
                  <span className="text-gold">{link.icon}</span>
                  <span>{link.title}</span>
                </h2>
                <p className="mt-3 flex-1 text-sm leading-6 text-[#5a6d8f]">
                  {link.description}
                </p>
                <span className="mt-5 break-words text-sm font-bold text-gold">
                  {link.label} →
                </span>
              </a>
            ))}
          </div>

          <div className="mt-10 rounded-[8px] bg-navy px-6 py-8 text-white shadow-[0_20px_55px_rgba(9,36,82,0.16)] sm:px-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div>
                <h2 className="font-serif text-2xl font-bold">
                  Cần tư vấn chuyên sâu?
                </h2>
                <p className="mt-2 max-w-3xl leading-7 text-white/75">
                  Chọn ngày và khung giờ phù hợp trên hệ thống đặt lịch. BS. Chế Đình Nghĩa sẽ tư vấn trực tiếp qua video call, giúp bạn giải đáp thắc mắc và đưa ra hướng điều trị phù hợp.
                </p>
              </div>
              <Link
                href="/#booking"
                className="inline-flex shrink-0 items-center justify-center rounded-sm bg-gold px-5 py-3 font-bold uppercase text-white transition hover:bg-gold-light mx-auto"
              >
                Đặt lịch khám →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
