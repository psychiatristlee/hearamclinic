import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI 종합 성격 보고서 — 4가지 검사 통합 분석 | 해람정신건강의학과",
  description:
    "Big 5·에니어그램·애착 유형·DISC 4가지 성격 검사 결과를 AI가 통합 분석하여 한 사람의 다면적 프로필로 정리해 드리는 무료 서비스. 4개 검사를 모두 마치시면 종합 보고서를 받으실 수 있습니다.",
  keywords: [
    "AI 성격 분석",
    "종합 성격 보고서",
    "Big 5 에니어그램 통합",
    "성격 검사 통합 분석",
    "MBTI 종합",
    "성격 진단 보고서",
    "AI 성격 진단",
    "무료 성격 분석",
  ],
  alternates: { canonical: "https://hearam.kr/personality/report" },
  openGraph: {
    title: "AI 종합 성격 보고서 — 4가지 검사 통합 분석",
    description:
      "Big 5·에니어그램·애착·DISC 결과를 AI가 통합 분석한 종합 성격 보고서를 무료로 받아 보세요.",
    url: "https://hearam.kr/personality/report",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI 종합 성격 보고서",
    description:
      "4가지 성격 검사 결과를 AI가 통합 분석.",
  },
};

export default function ReportLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
