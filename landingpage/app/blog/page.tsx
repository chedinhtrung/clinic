import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Blogs from "@/app/Blogs";

export const metadata: Metadata = {
  title: "Bài viết y khoa cơ xương khớp | BS. Chế Đình Nghĩa",
  description:
    "Tổng hợp các bài viết và kiến thức y khoa về cơ xương khớp, chấn thương thể thao và phẫu thuật chỉnh hình từ TS. BS. Chế Đình Nghĩa tại Hà Nội.",
  alternates: {
    canonical: "https://chedinhnghia.com/blog",
  },
  openGraph: {
    title: "Bài viết y khoa cơ xương khớp | BS. Chế Đình Nghĩa",
    description:
      "Kiến thức và bài viết y khoa về cơ xương khớp, chấn thương thể thao từ TS. BS. Chế Đình Nghĩa.",
    url: "https://chedinhnghia.com/blog",
    siteName: "TS. BS. Chế Đình Nghĩa",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: "/images/logo.png",
        width: 512,
        height: 512,
        alt: "Bài viết y khoa cơ xương khớp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bài viết y khoa cơ xương khớp | BS. Chế Đình Nghĩa",
    description:
      "Tổng hợp kiến thức và bài viết y khoa từ TS. BS. Chế Đình Nghĩa.",
    images: ["/images/logo.png"],
  },
};

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <Blogs />
    </>
  );
}
