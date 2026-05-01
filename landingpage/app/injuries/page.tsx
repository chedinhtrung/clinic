import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Injuries from "@/app/Injuries";

export const metadata: Metadata = {
  title: "Chấn thương chỉnh hình và phương pháp điều trị",
  description: "Thông tin về các nhóm chấn thương xương khớp, dây chằng, sụn khớp và các phương pháp điều trị chuyên khoa.",
};

export default function InjuriesPage() {
  return (
    <>
      <Navbar />
      <Injuries />
    </>
  );
}
