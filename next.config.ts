import type { NextConfig } from "next";

// soundary.life(해람헬스케어)로 이관된 검사들 — 개별 검사 페이지 방문자도 넘긴다.
// (src/lib/external-tests.ts 의 매핑과 동일하게 유지할 것)
// 쿼리스트링(?result=… 공유 파라미터 등)은 리다이렉트 시 그대로 전달된다.
const SOUNDARY_TEST_SLUGS = [
  // 심리 설문
  "phq9", "cesd", "pss", "asrs", "mdq", "audit",
  "gad7", "pcl5", "who5", "epds", "dass21",
  // 집중력·인지·지능
  "stroop", "selective-attention", "sustained-inhibition", "interference-attention",
  "n-back", "digit-span", "trail-making", "iq",
  "reaction-time", "spatial-span", "task-switching",
];
const SOUNDARY_PERSONALITY_SLUGS = [
  "big5", "enneagram", "attachment", "disc", "riasec", "schema",
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "blogthumb.pstatic.net",
      },
    ],
  },
  async redirects() {
    return [
      ...SOUNDARY_TEST_SLUGS.map((slug) => ({
        source: `/test/${slug}`,
        destination: `https://soundary.life/ko/test/${slug}?utm_source=hearam.kr`,
        permanent: true,
      })),
      ...SOUNDARY_PERSONALITY_SLUGS.map((slug) => ({
        source: `/personality/${slug}`,
        destination: `https://soundary.life/ko/personality/${slug}?utm_source=hearam.kr`,
        permanent: true,
      })),
      {
        source: "/personality/report",
        destination:
          "https://soundary.life/ko/personality/battery?utm_source=hearam.kr",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "unsafe-none",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
