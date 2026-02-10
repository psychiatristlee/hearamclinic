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
];

function buildTestUrls(): string {
  const today = new Date().toISOString().split("T")[0];

  let urls = `  <url>
    <loc>${BASE_URL}/test</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;

  for (const q of questionnaires) {
    urls += `
  <url>
    <loc>${BASE_URL}/test/${q.name}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }

  for (const name of attentionTests) {
    urls += `
  <url>
    <loc>${BASE_URL}/test/${name}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }

  return urls;
}

export async function GET() {
  try {
    const response = await fetch(FUNCTION_URL, {
      next: { revalidate: 3600 },
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
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (error) {
    console.error("사이트맵 오류:", error);
    return new NextResponse("사이트맵 생성 중 오류가 발생했습니다.", {
      status: 500,
    });
  }
}
