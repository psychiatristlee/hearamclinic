"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/AuthContext";
import {
  soundaryBatteryUrl,
  soundaryPersonalityUrl,
} from "@/lib/external-tests";

function safeDecodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

export interface PostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  dateSeconds: number;
  categories: string[];
  featuredImage: string;
  viewCount?: number;
}

export default function PostList({ posts }: { posts: PostSummary[] }) {
  const { claims } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");

  const categoryList = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => p.categories.forEach((c) => set.add(c)));
    return ["전체", ...Array.from(set).sort()];
  }, [posts]);

  const filtered = useMemo(() => {
    let result = posts;

    if (selectedCategory !== "전체") {
      result = result.filter((p) => p.categories.includes(selectedCategory));
    }

    if (search.trim()) {
      const keyword = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(keyword) ||
          p.excerpt.toLowerCase().includes(keyword) ||
          p.categories.some((c) => c.toLowerCase().includes(keyword))
      );
    }

    return result;
  }, [posts, search, selectedCategory]);

  return (
    <div>
      {/* 종합 성격 보고서 진입 배너 */}
      <a
        href={soundaryBatteryUrl()}
        className="group block mb-4 bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-2xl overflow-hidden hover:shadow-2xl transition"
      >
        <div className="p-5 flex items-center gap-4">
          <div className="text-4xl flex-shrink-0">📊</div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold mb-0.5">AI 종합 성격 보고서</h2>
            <p className="text-sm text-purple-100 leading-relaxed">
              Big 5·에니어그램·애착·DISC·직업흥미 5가지 검사를 AI가 통합 분석해 나만의 프로필로 정리해 드려요.
            </p>
          </div>
          <div className="text-2xl opacity-70 group-hover:translate-x-1 transition-transform">→</div>
        </div>
      </a>

      {/* 심리도식 검사 진입 카드 (신규) */}
      <a
        href={soundaryPersonalityUrl("schema") ?? "/personality/schema"}
        className="group block mb-8 bg-white border border-purple-100 rounded-2xl overflow-hidden hover:shadow-xl hover:border-purple-300 transition"
      >
        <div className="flex items-stretch">
          <div className="relative w-32 sm:w-44 flex-shrink-0 bg-purple-50">
            <Image
              src="https://firebasestorage.googleapis.com/v0/b/hearamclinic-ef507.firebasestorage.app/o/personality%2Fschema%2Fcover.png?alt=media"
              alt="심리도식 검사"
              fill
              sizes="(max-width: 640px) 128px, 176px"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              unoptimized
            />
          </div>
          <div className="p-4 sm:p-5 flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">NEW</span>
              <h2 className="text-lg font-bold text-gray-900 group-hover:text-purple-700 transition">심리도식 검사</h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              어린 시절에 만들어져 지금도 반복되는 마음의 무늬를 18가지 도식·5개 영역으로 부드럽게 살펴보는 무료 심리검사예요.
            </p>
          </div>
        </div>
      </a>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">블로그</h1>
        {(claims.admin || claims.editor) && (
          <Link
            href="/blog/new"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
          >
            + AI로 새 글 작성
          </Link>
        )}
      </div>

      {categoryList.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {categoryList.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                selectedCategory === cat
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="제목, 내용으로 검색..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500">
          {posts.length === 0
            ? "아직 블로그 글이 없습니다."
            : "검색 결과가 없습니다."}
        </p>
      ) : (
        <div className="grid gap-6">
          {filtered.map((post) => (
            <Link
              key={post.id}
              href={`/${encodeURIComponent(safeDecodeSlug(post.slug))}`}
              className="block border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row">
                {post.featuredImage && (
                  <div className="relative w-full sm:w-48 h-48 sm:h-36 flex-shrink-0">
                    <Image
                      src={post.featuredImage}
                      alt={post.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 192px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-4 flex-1">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    {post.title}
                  </h2>
                  <p className="text-sm text-gray-500 mb-2 flex flex-wrap items-center gap-x-2">
                    <span>
                      {new Date(post.dateSeconds * 1000).toLocaleDateString(
                        "ko-KR"
                      )}
                    </span>
                    {post.categories.length > 0 && (
                      <span className="text-gray-400">
                        {post.categories.join(", ")}
                      </span>
                    )}
                    {typeof post.viewCount === "number" && post.viewCount > 0 && (
                      <span className="text-gray-400 inline-flex items-center gap-0.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {post.viewCount >= 10000
                          ? `${(post.viewCount / 10000).toFixed(post.viewCount / 10000 < 10 ? 1 : 0)}만`
                          : post.viewCount.toLocaleString("ko-KR")}
                      </span>
                    )}
                  </p>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {decodeHtmlEntities(post.excerpt)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
