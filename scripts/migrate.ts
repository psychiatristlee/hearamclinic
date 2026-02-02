/**
 * WordPress → Firebase 마이그레이션 스크립트
 *
 * hearam.kr의 블로그 글을 WordPress REST API로 가져와서
 * Firebase Firestore + Storage에 저장합니다.
 *
 * 실행: npx tsx scripts/migrate.ts
 */

import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import TurndownService from "turndown";
import * as fs from "fs";
import * as path from "path";

// Firebase Admin 초기화 (서비스 계정 키 파일 또는 기본 자격 증명 사용)
const serviceAccountPath = path.join(__dirname, "../service-account-key.json");

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, "utf-8")
  ) as ServiceAccount;
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: "hearamclinic-ef507.firebasestorage.app",
  });
} else {
  initializeApp({
    projectId: "hearamclinic-ef507",
    storageBucket: "hearamclinic-ef507.firebasestorage.app",
  });
}

const db = getFirestore();
const bucket = getStorage().bucket();

// Turndown (HTML → Markdown)
const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

// 네이버 플레이스 링크 제거 (변환 전 HTML에서 a태그 자체를 제거)
turndown.addRule("removeNaverLinks", {
  filter: (node) => {
    if (node.nodeName !== "A") return false;
    const href = (node as HTMLAnchorElement).getAttribute("href") || "";
    return (
      href.includes("naver.me") ||
      href.includes("map.naver.com") ||
      href.includes("place.naver.com") ||
      href.includes("naver.com/place")
    );
  },
  replacement: () => "",
});

// WordPress figure/figcaption 처리 (data-src 우선)
turndown.addRule("figure", {
  filter: "figure",
  replacement: (_content, node) => {
    const el = node as HTMLElement;
    const img = el.querySelector("img");
    const figcaption = el.querySelector("figcaption");
    if (img) {
      // data-src가 있으면 우선 사용 (lazy loading)
      const src =
        img.getAttribute("data-src") || img.getAttribute("src") || "";
      const alt = figcaption?.textContent || img.getAttribute("alt") || "";
      // base64 placeholder는 무시
      if (src.startsWith("data:")) return "";
      return `\n\n![${alt}](${src})\n\n`;
    }
    return _content;
  },
});

// WordPress REST API 타입
interface WPPost {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  slug: string;
  date: string;
  categories: number[];
  featured_media: number;
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url: string;
      alt_text: string;
    }>;
    "wp:term"?: Array<
      Array<{
        id: number;
        name: string;
        slug: string;
      }>
    >;
  };
}

interface WPCategory {
  id: number;
  name: string;
  slug: string;
}

const WP_API_BASE = "https://hearam.kr/wp-json/wp/v2";

// WordPress 리사이즈 suffix 제거: image-300x200.png → image.png
function cleanImageUrl(url: string): string {
  return url.replace(/-\d+x\d+(\.\w+)$/, "$1");
}

// noscript 태그 제거 (lazy-loaded 이미지의 중복 방지)
function removeNoscriptTags(html: string): string {
  return html.replace(/<noscript>[\s\S]*?<\/noscript>/gi, "");
}

// lazy-loaded 이미지 전처리: data-src → src로 변환
function fixLazyLoadedImages(html: string): string {
  // data-src가 있는 img 태그에서 data-src 값을 src로 교체
  return html.replace(
    /<img([^>]*)\sdata-src="([^"]+)"([^>]*)>/gi,
    (_match, before, dataSrc, after) => {
      // 기존 src="data:image/gif;base64,..." 를 실제 URL로 교체
      const cleaned = (before + after).replace(/\ssrc="[^"]*"/gi, "");
      return `<img${cleaned} src="${dataSrc}">`;
    }
  );
}

async function deleteAllPosts() {
  console.log("기존 데이터 삭제 중...");
  const snapshot = await db.collection("posts").get();
  if (snapshot.empty) {
    console.log("삭제할 데이터가 없습니다.\n");
    return;
  }
  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`${snapshot.size}개 문서 삭제 완료\n`);
}

async function deleteAllStorageImages() {
  console.log("기존 Storage 이미지 삭제 중...");
  try {
    const [files] = await bucket.getFiles({ prefix: "blog-images/" });
    if (files.length === 0) {
      console.log("삭제할 이미지가 없습니다.\n");
      return;
    }
    for (const file of files) {
      await file.delete();
    }
    console.log(`${files.length}개 이미지 삭제 완료\n`);
  } catch {
    console.log("Storage 이미지 삭제 건너뜀 (버킷 비어있음)\n");
  }
}

async function fetchAllPosts(): Promise<WPPost[]> {
  const allPosts: WPPost[] = [];
  let page = 1;

  while (true) {
    const url = `${WP_API_BASE}/posts?per_page=10&page=${page}&_embed`; // TODO: 테스트용 10개 제한
    console.log(`Fetching page ${page}...`);

    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 400) break;
      throw new Error(`WP API error: ${res.status} ${res.statusText}`);
    }

    const posts: WPPost[] = await res.json();
    if (posts.length === 0) break;

    allPosts.push(...posts);
    break; // TODO: 테스트용 - 첫 페이지만
  }

  console.log(`총 ${allPosts.length}개 포스트를 가져왔습니다.`);
  return allPosts;
}

async function fetchCategories(): Promise<Map<number, string>> {
  const res = await fetch(`${WP_API_BASE}/categories?per_page=100`);
  const cats: WPCategory[] = await res.json();
  const map = new Map<number, string>();
  for (const cat of cats) {
    map.set(cat.id, cat.name);
  }
  return map;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function extractImageUrls(html: string): string[] {
  // src, data-src, srcset, data-srcset 모두에서 이미지 URL 추출
  const regex = /https?:\/\/hearam\.kr\/wp-content\/uploads\/[^\s"'<>,]+/g;
  const matches = html.match(regex) || [];
  // 리사이즈 suffix 제거하고 중복 제거
  return [...new Set(matches.map(cleanImageUrl))];
}

// HTML에서 네이버 플레이스 관련 링크/블록 전체 제거
function removeNaverPlaceHtml(html: string): string {
  let cleaned = html;

  // 1. vlp-link-container 블록 전체 제거 (네이버 플레이스 카드)
  cleaned = cleaned.replace(
    /<div[^>]*class="vlp-link-container[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi,
    ""
  );

  // 2. 남은 a 태그로 된 네이버 링크 제거
  cleaned = cleaned.replace(
    /<a[^>]*href="[^"]*(?:naver\.me|map\.naver\.com|place\.naver\.com|naver\.com\/place)[^"]*"[^>]*>[\s\S]*?<\/a>/gi,
    ""
  );

  // 3. 네이버 지도 iframe 제거
  cleaned = cleaned.replace(
    /<iframe[^>]*(?:naver\.me|map\.naver\.com|place\.naver\.com)[^>]*>[\s\S]*?<\/iframe>/gi,
    ""
  );

  return cleaned;
}

async function downloadAndUploadImage(
  imageUrl: string,
  postId: number
): Promise<string | null> {
  try {
    console.log(`  📥 다운로드 시도: ${imageUrl}`);
    const res = await fetch(imageUrl);
    if (!res.ok) {
      console.warn(`  ❌ 다운로드 실패: ${imageUrl} (HTTP ${res.status})`);
      return null;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") || "image/jpeg";
    console.log(`  📦 다운로드 완료: ${(buffer.length / 1024).toFixed(1)}KB, ${contentType}`);

    const fileName = new URL(imageUrl).pathname.split("/").pop() || "image.jpg";
    const storagePath = `blog-images/${postId}/${fileName}`;

    const file = bucket.file(storagePath);
    await file.save(buffer, {
      metadata: { contentType },
      public: true,
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
    console.log(`  ✅ Storage 업로드 완료: ${storagePath}`);
    return publicUrl;
  } catch (err) {
    console.warn(`  ❌ 업로드 실패: ${imageUrl}`, err);
    return null;
  }
}

async function migratePost(
  post: WPPost,
  categoryMap: Map<number, string>,
  imageUrlMap: Map<string, string>
) {
  const title = decodeHtmlEntities(post.title.rendered);
  console.log(`처리 중: ${title}`);

  // HTML 전처리: 네이버 블록 제거 + noscript 제거 + lazy-loaded 이미지 수정
  let cleanedHtml = removeNaverPlaceHtml(post.content.rendered);
  cleanedHtml = removeNoscriptTags(cleanedHtml);
  cleanedHtml = fixLazyLoadedImages(cleanedHtml);
  let markdown = turndown.turndown(cleanedHtml);

  // WordPress 리사이즈 URL도 원본 URL로 정규화
  markdown = markdown.replace(
    /https?:\/\/hearam\.kr\/wp-content\/uploads\/[^\s)]+/g,
    (url) => cleanImageUrl(url)
  );

  // 이미지 URL을 Firebase Storage URL로 교체
  for (const [originalUrl, firebaseUrl] of imageUrlMap) {
    markdown = markdown.replaceAll(originalUrl, firebaseUrl);
  }

  // 마크다운에서 네이버 링크 잔여분 제거
  markdown = markdown.replace(
    /\[([^\]]*)\]\(https?:\/\/[^\)]*(?:naver\.me|map\.naver\.com|place\.naver\.com|naver\.com\/place)[^\)]*\)/gi,
    ""
  );
  // "해람정신과 네이버 플레이스" 관련 텍스트 줄 제거
  markdown = markdown.replace(
    /^.*(?:해람정신과\s*네이버\s*플레이스|네이버\s*플레이스를?\s*방문|예약을?\s*위해서는?\s*네이버).*$/gim,
    ""
  );
  // pstatic.net (네이버 이미지) 관련 마크다운 이미지 제거
  markdown = markdown.replace(/!\[[^\]]*\]\([^)]*pstatic\.net[^)]*\)/gi, "");
  // 빈 줄 정리
  markdown = markdown.replace(/\n{3,}/g, "\n\n").trim();

  const excerpt = decodeHtmlEntities(
    post.excerpt.rendered.replace(/<[^>]*>/g, "").trim()
  );

  const categories = post.categories
    .map((id) => categoryMap.get(id))
    .filter((name): name is string => !!name && name !== "Uncategorized");

  let featuredImage = "";
  if (post._embedded?.["wp:featuredmedia"]?.[0]?.source_url) {
    const originalFeaturedUrl = cleanImageUrl(
      post._embedded["wp:featuredmedia"][0].source_url
    );
    featuredImage = imageUrlMap.get(originalFeaturedUrl) || originalFeaturedUrl;
  }

  const docData = {
    wpId: post.id,
    title,
    slug: post.slug,
    content: markdown,
    excerpt,
    date: Timestamp.fromDate(new Date(post.date)),
    categories,
    featuredImage,
    author: "이정석",
    updatedAt: Timestamp.now(),
  };

  await db.collection("posts").doc(String(post.id)).set(docData);
  console.log(`  ✓ 저장 완료: ${title}`);
}

async function main() {
  console.log("=== hearam.kr → Firebase 마이그레이션 시작 ===\n");

  // 0. 기존 데이터 삭제
  await deleteAllPosts();
  await deleteAllStorageImages();

  // 1. 카테고리 가져오기
  console.log("카테고리 가져오는 중...");
  const categoryMap = await fetchCategories();
  console.log(`카테고리 ${categoryMap.size}개 로드 완료\n`);

  // 2. 모든 포스트 가져오기
  const posts = await fetchAllPosts();

  // 3. 포스트별 이미지 업로드 + 마이그레이션
  console.log("\n포스트 마이그레이션 중...\n");
  for (const post of posts) {
    // HTML 전처리 후 이미지 URL 수집
    let cleanedHtml = removeNaverPlaceHtml(post.content.rendered);
    cleanedHtml = removeNoscriptTags(cleanedHtml);
    cleanedHtml = fixLazyLoadedImages(cleanedHtml);
    const postImageUrls = new Set<string>();
    const urls = extractImageUrls(cleanedHtml);
    urls.forEach((url) => postImageUrls.add(url));

    if (post._embedded?.["wp:featuredmedia"]?.[0]?.source_url) {
      const featuredUrl = cleanImageUrl(
        post._embedded["wp:featuredmedia"][0].source_url
      );
      if (featuredUrl.includes("hearam.kr/wp-content/uploads/")) {
        postImageUrls.add(featuredUrl);
      }
    }

    console.log(`\n[포스트 ${post.id}] "${decodeHtmlEntities(post.title.rendered)}"`);
    console.log(`  추출된 이미지 ${postImageUrls.size}개:`);
    for (const url of postImageUrls) {
      console.log(`    - ${url}`);
    }

    const imageUrlMap = new Map<string, string>();
    for (const originalUrl of postImageUrls) {
      const firebaseUrl = await downloadAndUploadImage(originalUrl, post.id);
      if (firebaseUrl) {
        imageUrlMap.set(originalUrl, firebaseUrl);
      }
    }
    console.log(`  성공: ${imageUrlMap.size}/${postImageUrls.size}개 업로드됨`);

    await migratePost(post, categoryMap, imageUrlMap);
  }

  console.log(`\n=== 마이그레이션 완료! ${posts.length}개 포스트 처리됨 ===`);
}

main().catch((err) => {
  console.error("마이그레이션 실패:", err);
  process.exit(1);
});
