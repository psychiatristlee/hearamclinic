import { NextResponse } from "next/server";
import questionnaires from "@/lib/test/questionnaires";

const FUNCTION_URL =
  "https://asia-northeast3-hearamclinic-ef507.cloudfunctions.net/sitemap";

const BASE_URL = "https://hearam.kr";

const attentionTests = [
  "stroop",
  "selective-attention",
  "sustained-inhibition",
  "interference-attention",
  "n-back",
  "digit-span",
  "trail-making",
  "iq",
  "reaction-time",
  "spatial-span",
  "task-switching",
];

const personalityTests = ["big5", "enneagram", "attachment", "disc", "riasec", "schema"];

// 검사 페이지 최초 배포일 (내용이 변경되면 이 날짜를 업데이트)
const TEST_LAST_MODIFIED = "2026-07-13";

function buildTestUrls(): string {
  let urls = `  <url>
    <loc>${BASE_URL}/test</loc>
    <lastmod>${TEST_LAST_MODIFIED}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;

  for (const q of questionnaires) {
    urls += `
  <url>
    <loc>${BASE_URL}/test/${q.name}</loc>
    <lastmod>${TEST_LAST_MODIFIED}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }

  for (const name of attentionTests) {
    urls += `
  <url>
    <loc>${BASE_URL}/test/${name}</loc>
    <lastmod>${TEST_LAST_MODIFIED}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }

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

  // 성격 검사 개별
  for (const name of personalityTests) {
    urls += `
  <url>
    <loc>${BASE_URL}/personality/${name}</loc>
    <lastmod>${TEST_LAST_MODIFIED}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`;
  }

  // 종합 성격 보고서
  urls += `
  <url>
    <loc>${BASE_URL}/personality/report</loc>
    <lastmod>${TEST_LAST_MODIFIED}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
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
