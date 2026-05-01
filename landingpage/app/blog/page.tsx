import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Blogs from "@/app/Blogs";

export const metadata: Metadata = {
  title: "Bài viết y khoa về chấn thương chỉnh hình",
  description: "Các bài viết, kiến thức và tư vấn y khoa về cơ xương khớp, chấn thương thể thao và phẫu thuật chỉnh hình.",
};

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <Blogs />
    </>
  );
}
