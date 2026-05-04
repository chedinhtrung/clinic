import Navbar from "@/components/Navbar";
import Intro from "@/app/Intro";
import Booking from "@/app/Booking";
import Image from "next/image";
import { ReactNode } from "react";

const physicianSchema = {
  "@context": "https://schema.org",
  "@type": ["Physician", "Person"],
  "@id": "https://chedinhnghia.com/#physician",
  mainEntityOfPage: "https://chedinhnghia.com",
  inLanguage: "vi-VN",
  name: "TS.BS. Chế Đình Nghĩa",
  url: "https://chedinhnghia.com",
  image: "https://chedinhnghia.com/images/bsnghia.jpeg",
  medicalSpecialty: "Orthopedic",
  description:
    "TS.BS. Chế Đình Nghĩa là bác sĩ chuyên khoa chấn thương chỉnh hình, tư vấn và điều trị các bệnh lý cơ xương khớp, đặc biệt là khớp gối và thoái hóa khớp.",
  jobTitle: "Bác sĩ Chấn thương Chỉnh hình",
  worksFor: {
    "@type": "Hospital",
    name: "Bệnh viện Đa khoa Tâm Anh",
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Hà Nội",
    addressCountry: "VN",
  },
  knowsAbout: [
    "Chấn thương chỉnh hình",
    "Cơ xương khớp",
    "Thoái hóa khớp gối",
    "Thay khớp gối",
    "Chấn thương thể thao",
  ],
  availableService: {
    "@type": "MedicalProcedure",
    name: "Tư vấn chấn thương chỉnh hình online",
    areaServed: "Vietnam",
  },
  areaServed: {
    "@type": "Country",
    name: "Vietnam",
  },
  sameAs: [
    "https://tamanhhospital.vn/chuyen-gia/che-dinh-nghia/",
  ],
};

const socialPages = [
  {
    title: "Facebook",
    description: "Cập nhật tin tức và gửi tin nhắn qua trang Facebook chính thức.",
    href: "https://web.facebook.com/BSNghiachuyenxuongkhop",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
        <path d="M14 8.5V6.75c0-.58.39-.75.67-.75H16V3.8c-.23-.03-1.02-.1-1.94-.1-1.92 0-3.23 1.17-3.23 3.32V8.5H8.75V11h2.08v7.2H13.4V11h2.13l.34-2.5H14Z" />
      </svg>
    ),
  },
  {
    title: "YouTube",
    description: "Chia sẻ kiến thức cơ xương khớp và chấn thương chỉnh hình.",
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
  {
    title: "Blog",
    description: "Các bài viết về  bệnh lý cơ xương khớp và các phương pháp điều trị tiên tiến từ TS. BS. Chế Đình Nghĩa.",
    href: "https://chedinhnghia.com/blog/",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
        <path d="M6.25 4h8.5l3 3v12.25a.75.75 0 0 1-.75.75H7a.75.75 0 0 1-.75-.75V4.75A.75.75 0 0 1 7 4h-.75Zm8.25 1.81V8h2.19L14.5 5.81ZM8.5 10.25h7v1.5h-7v-1.5Zm0 3.5h7v1.5h-7v-1.5Zm0 3.5h5v1.5h-5v-1.5Z" />
      </svg>
    ),
  },
];

const faqItems: { question: string; answer: ReactNode }[] = [
  {
    question: "Tư vấn online là gì?",
    answer: (
      <div className="text leading-7 text-navy-mid sm:text-base">
        <p className="font-semibold">Tư vấn online giúp bạn tiết kiệm thời gian, không phải tới trực tiếp phòng khám khi chưa thực sự cần thiết. <br /><br /></p>
        <p>Các bước thực hiện tư vấn online:</p>
        <div className="flex items-start gap-2">
          <span>•</span><p>Đăng ký tư vấn online qua <a href="/#booking" className="text-navy-600 underline">cổng đăng ký</a></p>
        </div>
        <div className="flex items-start gap-2">
          <span>•</span><p>Trợ lý của BS. Nghĩa ghi nhận triệu chứng và bệnh sử của bạn</p>
        </div>
        <div className="flex items-start gap-2">
          <span>•</span><p>BS. Nghĩa tư vấn qua video call, chỉ định xét nghiệm/chụp chiếu cần thiết hoặc kê đơn thuốc nếu phù hợp và hẹn ngày tái khám</p>
        </div>
        <div className="flex items-start gap-2">
          <span>•</span><p>Bạn làm các xét nghiệm và chụp chiếu tại bệnh viện gần nhất, tiết kiệm thời gian di chuyển</p>
        </div>
        <div className="flex items-start gap-2">
          <span>•</span><p>Trong trường hợp cần thiết, bạn sẽ được hẹn đến khám, tư vấn và điều trị trực tiếp tại phòng khám</p>
        </div>
      </div>
    ),
  },
  {
    question: "Tư vấn online có chính xác không?",
    answer: (
      <div className="text leading-7 text-navy-mid sm:text-base">
        <p>Tư vấn online giúp bác sĩ đánh giá ban đầu dựa trên thông tin bạn cung cấp và trao đổi trực tiếp qua video call.</p>
        <p>Trong nhiều trường hợp, bác sĩ có thể đưa ra hướng xử lý phù hợp mà không cần khám trực tiếp.</p>
        <p>Nếu cần thiết, bạn sẽ được hướng dẫn chụp phim hoặc đến khám trực tiếp để đảm bảo chẩn đoán chính xác.</p>
      </div>
    ),
  },
  {
    question: "Liên hệ trực tiếp với BS.Nghĩa như thế nào?",
    answer: (
      <div className="text leading-7 text-navy-mid sm:text-base">
        <p className="font-semibold">Bạn có thể liên hệ với BS. Nghĩa qua các kênh sau:</p>
        <div className="flex items-start gap-2">
          <span>•</span><p>Đăng ký tư vấn online qua <a href="/#booking" className="text-navy-600 underline">cổng đăng ký</a></p>
        </div>
        <div className="flex items-start gap-2">
          <span>•</span><p>Gửi email tới phòng khám qua <a href="mailto:coxuongkhop.bsnghia@gmail.com" className="text-navy-600 underline">coxuongkhop.bsnghia@gmail.com</a></p>
        </div>
        <div className="flex items-start gap-2">
          <span>•</span><p>Nhắn tin qua <a href="https://web.facebook.com/BSNghiachuyenxuongkhop" className="text-navy-600 underline">trang Facebook chính thức</a></p>
        </div>
      </div>
    ),
  },
  {
    question: "Tôi có cần chụp X-quang / MRI trước không?",
    answer: (
      <div className="text leading-7 text-navy-mid sm:text-base">
        <p className="font-semibold">Bạn không cần phải chụp X-quang hoặc MRI trước khi tư vấn online.</p>
        <p>Trong quá trình tư vấn, bác sĩ sẽ đánh giá tình trạng của bạn và chỉ định các xét nghiệm/chụp chiếu cần thiết.</p>
        <p>Nếu đã có kết quả xét nghiệm/chụp chiếu trước đó, bạn có thể cung cấp cho bác sĩ trước buổi hẹn để hỗ trợ quá trình tư vấn.</p>
      </div>
    ),
  },
];

const commonSymptoms = [
  {
    title: "Đau khớp gối khi đi lại, leo cầu thang",
    description: "Đau tăng khi vận động, ảnh hưởng sinh hoạt hằng ngày",
    icon: "/images/kneepain.png",
    href: "#",
  },
  {
    title: "Đau vai, khó nâng tay hoặc ngủ nghiêng bị đau",
    description: "Tầm vận động giảm, đau về đêm hoặc khi cử động vai",
    icon: "/images/shoulderpain.png",
    href: "#",
  },
  {
    title: "Đau lưng, thoát vị đĩa đệm",
    description: "Đau âm ỉ hoặc lan xuống chân, cúi xoay người khó chịu",
    icon: "/images/backpain.png",
    href: "#",
  },
  {
    title: "Chấn thương khi chơi thể thao",
    description: "Lật cổ chân, căng cơ, đau dây chằng",
    icon: "/images/sportinjury.png",
    href: "#",
  },
];

function SymptomSearchSection() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(physicianSchema),
        }}
      />
      <section className="bg-[#eef2f7] px-6 py-14 text-navy-dark sm:px-10 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#f8fbff] to-white p-7 shadow-[0_20px_45px_rgba(10,35,66,0.08)] sm:p-10">
              <div className="h-1 w-16 rounded-full bg-gold" />
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.28em] text-gold sm:text-sm">
                Bạn đang gặp vấn đề gì?
              </p>
              <h2 className="mt-5 font-serif text-2xl font-black leading-tight text-navy sm:text-3xl">
                Tư vấn chuyên sâu các vấn đề cơ xương khớp thường gặp
              </h2>
              <div className="mt-6 h-1 w-20 rounded-full bg-gold/70" />
              <p className="mt-7 max-w-xl text-base leading-8 text-[#4f6386]">
                BS. Nghĩa giúp bạn hiểu rõ nguyên nhân và lựa chọn phương pháp điều trị
                phù hợp, hiệu quả và an toàn.
              </p>
              <a
                href="#booking"
                className="mt-8 inline-flex items-center gap-3 rounded-xl bg-navy px-6 py-4 text-base font-bold text-white shadow-[0_12px_24px_rgba(11,39,75,0.22)] transition hover:-translate-y-0.5 hover:bg-[#133765]"
              >
                <span>📅</span>
                Đặt lịch tư vấn
              </a>

              <div className="pointer-events-none absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-gold/10 blur-2xl" />
            </div>

            <ul className="grid gap-5" aria-label="Danh sách triệu chứng thường được tìm kiếm">
              {commonSymptoms.map((symptom, index) => (
                <li key={symptom.title}>
                  <a
                    href={symptom.href}
                    className="group block rounded-2xl border border-white/90 bg-white p-2 shadow-[0_10px_30px_rgba(10,35,66,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(10,35,66,0.12)] sm:p-3"
                  >
                    <div className="flex items-center gap-4 sm:gap-5">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full sm:h-20 sm:w-20">
                        <Image
                          src={symptom.icon}
                          alt={symptom.title}
                          width={80}
                          height={80}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-black text-sm font-serif leading-tight text-navy sm:text-md">
                          {symptom.title}
                        </h3>
                        <p className="mt-1 text-sm leading-7 text-[#566b8f] sm:text-base">
                          {symptom.description}
                        </p>
                      </div>
                      <div className="ml-1 text-3xl font-light text-gold transition group-hover:translate-x-1 sm:block">
                        ›
                      </div>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

function SocialPages() {
  return (
    <section className="bg-white px-6 py-14 text-navy-dark sm:px-10 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <h2 className="mt-2 font-serif text-2xl font-black tracking-tight sm:text-3xl">
            Theo dõi TS. BS. Chế Đình Nghĩa
          </h2>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
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

function FAQSection() {
  return (
    <section className="bg-[#f7f9fc] px-6 py-14 text-navy-dark sm:px-10 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <h2 className="font-serif text-2xl font-black tracking-tight sm:text-3xl">
          Câu hỏi thường gặp
        </h2>

        <div className="mt-8 space-y-4">
          {faqItems.map((item) => (
            <details
              key={item.question}
              className="group rounded-xl border border-[#d7dfed] bg-white p-5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-navy">
                <span>{item.question}</span>
                <span className="text-xl leading-none text-gold transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-4 text-sm leading-7 text-[#5a6d8f] whitespace-pre-line">{item.answer}</p>
            </details>
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
      <SymptomSearchSection />
      <Booking />
      <FAQSection />
      <SocialPages />
    </div>
  );
}
