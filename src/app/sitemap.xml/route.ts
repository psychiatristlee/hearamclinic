import { NextResponse } from "next/server";

const FUNCTION_URL =
  "https://asia-northeast3-hearamclinic-ef507.cloudfunctions.net/sitemap";

const BASE_URL = "https://hearam.kr";

// 검사 페이지 최초 배포일 (내용이 변경되면 이 날짜를 업데이트)
const TEST_LAST_MODIFIED = "2026-07-13";

// 개별 검사 페이지는 soundary.life 로 영구 리다이렉트되므로(next.config.ts)
// 사이트맵에는 허브 페이지만 남긴다.
function buildTestUrls(): string {
  let urls = `  <url>
    <loc>${BASE_URL}/test</loc>
    <lastmod>${TEST_LAST_MODIFIED}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;

  // 집중력 검사 인덱스
  urls += `
  <url>
    <loc>${BASE_URL}/attention</loc>
    <lastmod>${TEST_LAST_MODIFIED}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;

  // 성격 검사 인덱스
  urls += `
  <url>
    <loc>${BASE_URL}/personality</loc>
    <lastmod>${TEST_LAST_MODIFIED}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;

  return urls;
}

export async function GET() {
  try {
    const response = await fetch(FUNCTION_URL, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error("사이트맵 가져오기 실패");
    }

    const existingXml = await response.text();

    // 기존 사이트맵의 </urlset> 닫는 태그 앞에 검사지 URL 삽입
    const testUrls = buildTestUrls();
    const xml = existingXml.replace("</urlset>", `${testUrls}\n</urlset>`);

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=60, s-maxage=300",
      },
    });
  } catch (error) {
    console.error("사이트맵 오류:", error);
    return new NextResponse("사이트맵 생성 중 오류가 발생했습니다.", {
      status: 500,
    });
  }
}
