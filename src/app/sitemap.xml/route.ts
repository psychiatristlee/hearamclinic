import { NextResponse } from "next/server";

const FUNCTION_URL =
  "https://asia-northeast3-hearamclinic-ef507.cloudfunctions.net/sitemap";

export async function GET() {
  try {
    const response = await fetch(FUNCTION_URL, {
      next: { revalidate: 3600 }, // 1시간 캐시
    });

    if (!response.ok) {
      throw new Error("사이트맵 가져오기 실패");
    }

    const xml = await response.text();

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
