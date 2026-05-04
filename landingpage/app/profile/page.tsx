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
        url: "/images/logo.png",
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
    images: ["/images/logo.png"],
  },
};

export default function ProfilePage() {
  return (
    <>
      <Navbar />
      <Profile />
    </>
  );
}
