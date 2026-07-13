import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import NaverMap from "@/components/NaverMap";
import { AuthProvider } from "@/lib/AuthContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
        <footer className="border-t border-purple-100 bg-purple-50/30 mt-12">
          <div className="mx-auto max-w-4xl px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 네이버 지도 */}
              <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
                <NaverMap />
              </div>
              {/* 클리닉 정보 */}
              <div className="flex flex-col justify-center">
                <a
                  href="https://naver.me/Fy2FWU9A"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border border-gray-200 rounded-xl p-6 bg-white hover:shadow-lg transition"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-2xl">N</span>
                    </div>
                    <div>
                      <p className="font-bold text-lg text-gray-900">
                        해람정신건강의학과
                      </p>
                      <p className="text-gray-500 mt-1">
                        네이버 플레이스에서 예약하기
                      </p>
                    </div>
                  </div>
                </a>
                <div className="mt-4 p-4 text-sm text-gray-600">
                  <p className="font-medium text-gray-900 mb-2">위치 안내</p>
                  <p>📍 서울특별시 마포구 양화로 178 4층, 7층</p>
                  <p>📞 0507-1352-8189</p>
                </div>
              </div>
            </div>
          </div>
        </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
