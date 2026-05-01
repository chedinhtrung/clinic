import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Profile from "@/app/Profile";

export const metadata: Metadata = {
  title: "Giới thiệu TS. BS. Chế Đình Nghĩa",
  description: "Hồ sơ chuyên môn, kinh nghiệm và quá trình công tác của TS. BS. Chế Đình Nghĩa trong lĩnh vực chấn thương chỉnh hình.",
};

export default function ProfilePage() {
  return (
    <>
      <Navbar />
      <Profile />
    </>
  );
}
