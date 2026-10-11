import type { Metadata } from "next";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import FeedbackWidget from "@/components/feedback/FeedbackWidget";
import { AuthProvider } from "@/lib/AuthContext";
import "./globals.css";

// 서체는 globals.css의 시스템 서체 스택을 쓴다 (웹폰트 다운로드 없음 → 첫 렌더 지연 제거).

export const metadata: Metadata = {
  metadataBase: new URL("https://hearam.kr"),
  title: {
    default: "해람정신건강의학과 | 서울 마포구 홍대입구역 정신건강의학과",
    template: "%s | 해람정신건강의학과",
  },
  description:
    "서울 마포구 홍대입구역 해람정신건강의학과 - 우울증, 불안장애, ADHD, 불면증, 공황장애 등 정신건강 전문 진료. 8인의 전문의가 함께합니다.",
  keywords: [
    "정신건강의학과",
    "홍대입구역",
    "마포구",
    "정신과",
    "우울증",
    "불안장애",
    "ADHD",
    "불면증",
    "공황장애",
    "심리상담",
    "해람",
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://hearam.kr",
    siteName: "해람정신건강의학과",
    title: "해람정신건강의학과 | 서울 마포구 홍대입구역 정신건강의학과",
    description:
      "서울 마포구 홍대입구역 해람정신건강의학과 - 우울증, 불안장애, ADHD, 불면증, 공황장애 등 정신건강 전문 진료.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "해람정신건강의학과 로고",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "해람정신건강의학과 | 서울 마포구 홍대입구역 정신건강의학과",
    description:
      "서울 마포구 홍대입구역 해람정신건강의학과 - 우울증, 불안장애, ADHD, 불면증, 공황장애 등 정신건강 전문 진료.",
    images: ["/logo.png"],
  },
  alternates: {
    canonical: "https://hearam.kr",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <AuthProvider>
        <Header />
        <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-10">{children}</main>
        <SiteFooter />
        <FeedbackWidget />
        </AuthProvider>
      </body>
    </html>
  );
}
