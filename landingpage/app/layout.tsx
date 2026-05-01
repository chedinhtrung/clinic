import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "react-day-picker/dist/style.css";
import "./globals_v1.css";
import Footer from "@/components/Footer";

import { Source_Sans_3, Merriweather } from "next/font/google";
import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
  fallback: ["Arial", "Helvetica", "sans-serif"],
  variable: "--font-source-sans",
});

const merriweather = Merriweather({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "700", "900"],
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
  variable: "--font-merriweather",
});

export const metadata: Metadata = {
  title: "TS. BS. Chế Đình Nghĩa — Chuyên khoa Cơ Xuơng Khớp và Chấn thương Chỉnh hình",
  description: "Website của bác sỹ Chế Đình Nghĩa, chuyên khoa Cơ Xuơng Khớp và Chấn thương Chỉnh hình tại Hà Nội. Cung cấp thông tin về  dịch vụ khám chữa bệnh, đặt lịch hẹn và kiến thức y khoa.",
  icons: {
    icon: "/images/logo.png",
    shortcut: "/images/logo.png",
    apple: "/images/logo.png",
  },
};

export default function RootLayout(
  {children}: Readonly<{children: React.ReactNode;}>
) 
{
  return (
    <html
      lang="vi"
    >
      <body className={`${sourceSans.className} ${sourceSans.variable} ${merriweather.variable} min-h-full flex flex-col`}>
        
        {children}
        <Footer></Footer>
      </body>
    </html>
  );
}
