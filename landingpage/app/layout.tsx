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
  metadataBase: new URL("https://chedinhnghia.com"),

  title: {
    default:
      "TS.BS. Chế Đình Nghĩa | Tư vấn chấn thương chỉnh hình online",
    template: "%s | TS.BS. Chế Đình Nghĩa",
  },

  description:
    "TS.BS. Chế Đình Nghĩa, chuyên khoa chấn thương chỉnh hình tại Hà Nội. Tư vấn online các vấn đề cơ xương khớp, chấn thương thể thao, khớp gối, khớp vai, khớp háng và phục hồi sau phẫu thuật.",

  icons: {
    icon: "/images/logo.png",
    shortcut: "/images/logo.png",
    apple: "/images/logo.png",
  },

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://chedinhnghia.com/",
    siteName: "TS.BS. Chế Đình Nghĩa",
    title:
      "TS.BS. Chế Đình Nghĩa | Tư vấn chấn thương chỉnh hình online",
    description:
      "Tư vấn online các vấn đề cơ xương khớp, chấn thương thể thao, khớp gối, khớp vai, khớp háng và phục hồi sau phẫu thuật.",
    images: [
      {
        url: "/images/bsnghia.png",
        width: 1200,
        height: 630,
        alt: "TS.BS. Chế Đình Nghĩa - Tư vấn chấn thương chỉnh hình",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title:
      "TS.BS. Chế Đình Nghĩa | Tư vấn chấn thương chỉnh hình online",
    description:
      "Tư vấn online các vấn đề cơ xương khớp, chấn thương thể thao và phục hồi sau phẫu thuật.",
    images: ["/images/bsnghia.png"],
  },

  robots: {
    index: true,
    follow: true,
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
