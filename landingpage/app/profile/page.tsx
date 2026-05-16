import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Profile from "@/app/Profile";

export const metadata: Metadata = {
  title: "Giới thiệu BS. Chế Đình Nghĩa | Chuyên gia chấn thương chỉnh hình tại Hà Nội",
  description:
    "Hồ sơ chuyên môn và kinh nghiệm của TS. BS. Chế Đình Nghĩa – chuyên gia chấn thương chỉnh hình tại Hà Nội.",
  alternates: {
    canonical: "https://chedinhnghia.com/profile",
  },
  openGraph: {
    title: "Giới thiệu BS. Chế Đình Nghĩa | Chuyên gia chấn thương chỉnh hình tại Hà Nội",
    description:
      "Hồ sơ chuyên môn và kinh nghiệm của TS. BS. Chế Đình Nghĩa – chuyên gia chấn thương chỉnh hình tại Hà Nội.",
    url: "https://chedinhnghia.com/profile",
    siteName: "TS. BS. Chế Đình Nghĩa",
    locale: "vi_VN",
    type: "profile",
    images: [
      {
        url: "/images/bsnghia.png",
        width: 512,
        height: 512,
        alt: "TS. BS. Chế Đình Nghĩa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Giới thiệu BS. Chế Đình Nghĩa | Chuyên gia chấn thương chỉnh hình tại Hà Nội",
    description:
      "Hồ sơ chuyên môn và kinh nghiệm của TS. BS. Chế Đình Nghĩa – chuyên gia chấn thương chỉnh hình tại Hà Nội.",
    images: ["/images/bsnghia.png"],
  },
};

export default function ProfilePage() {
  const profileJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: "Giới thiệu BS. Chế Đình Nghĩa",
    url: "https://chedinhnghia.com/profile",
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
      image: "https://chedinhnghia.com/images/bsnghia.png",
      jobTitle: "Bác sĩ chấn thương chỉnh hình",
      worksFor: {
        "@type": "Organization",
        name: "TS.BS. Chế Đình Nghĩa"
      },
      sameAs: [
        "https://web.facebook.com/TsNghia.xuongkhop",
        "https://www.youtube.com/@nghiachedinh",
        "https://www.tiktok.com/@tsnghia_xuongkhop",
        "https://vnexpress.net/suc-khoe/cac-benh/bac-si/974-ts-bs-che-dinh-nghia",
        "https://www.benhvien108.vn/thong-tin-bac-si.htm?id=9c878eb1-634d-4cbe-8091-35622470c601",
        "https://tamanhhospital.vn/chuyen-gia/che-dinh-nghia/"
      ]
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd) }}
      />
      <Navbar />
      <Profile />
    </>
  );
}
