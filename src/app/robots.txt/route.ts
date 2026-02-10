import { NextResponse } from "next/server";

const SITE_URL = "https://hearam.kr";

export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /login
Disallow: /profile
Disallow: /blog/new
Disallow: /*/edit

Sitemap: ${SITE_URL}/sitemap.xml
`;

  return new NextResponse(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
