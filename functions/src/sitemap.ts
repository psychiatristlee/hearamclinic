import {onSchedule} from "firebase-functions/scheduler";
import {onRequest} from "firebase-functions/https";
import {getFirestore} from "firebase-admin/firestore";
import {getStorage} from "firebase-admin/storage";

const SITE_URL = "https://hearam.kr";

interface PostDoc {
  slug: string;
  date: {seconds: number};
}

// 사이트맵 XML 생성
async function generateSitemapXml(): Promise<string> {
  const db = getFirestore();
  const snapshot = await db
    .collection("posts")
    .orderBy("date", "desc")
    .get();

  const posts = snapshot.docs.map((doc) => doc.data() as PostDoc);

  const urls = [
    // 메인 페이지
    `  <url>
    <loc>${SITE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
  ];

  // 블로그 포스트들
  for (const post of posts) {
    const lastmod = new Date(post.date.seconds * 1000)
      .toISOString()
      .split("T")[0];
    urls.push(`  <url>
    <loc>${SITE_URL}/blog/${encodeURIComponent(post.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
}

// 매일 자정(KST 09:00 UTC)에 사이트맵 생성
export const generateSitemap = onSchedule(
  {
    schedule: "0 0 * * *",
    timeZone: "Asia/Seoul",
    region: "asia-northeast3",
  },
  async () => {
    const xml = await generateSitemapXml();

    const bucket = getStorage().bucket();
    const file = bucket.file("sitemap.xml");

    await file.save(xml, {
      contentType: "application/xml",
      metadata: {
        cacheControl: "public, max-age=86400",
      },
    });

    // 파일을 공개로 설정
    await file.makePublic();

    console.log("사이트맵 생성 완료:", new Date().toISOString());
  },
);

// HTTP 엔드포인트로 사이트맵 제공 (실시간 생성)
export const sitemap = onRequest(
  {
    region: "asia-northeast3",
    cors: true,
  },
  async (req, res) => {
    try {
      const xml = await generateSitemapXml();
      res.set("Content-Type", "application/xml");
      res.set("Cache-Control", "public, max-age=3600");
      res.status(200).send(xml);
    } catch (err) {
      console.error("사이트맵 생성 실패:", err);
      res.status(500).send("사이트맵 생성 중 오류가 발생했습니다.");
    }
  },
);
