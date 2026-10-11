"use client";

import { useState, useMemo, useId } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/AuthContext";
import SoundaryBanner from "@/components/SoundaryBanner";
import { IconEye, IconSearch } from "@/components/icons";
import { formatPostDate } from "@/lib/format-date";
import {
  SOUNDARY_PERSONALITY_CATALOG_URL,
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

function formatViews(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(n / 10000 < 10 ? 1 : 0)}만`;
  return n.toLocaleString("ko-KR");
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
  const searchId = useId();

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
      <SoundaryBanner className="mb-5" />

      {/* 심리도식 검사 진입 카드 */}
      <a
        href={soundaryPersonalityUrl("schema") ?? SOUNDARY_PERSONALITY_CATALOG_URL}
        className="surface surface-hover card-lift group block mb-10 overflow-hidden"
      >
        <div className="flex items-stretch">
          <div className="relative w-32 sm:w-44 shrink-0 bg-purple-50">
            <Image
              src="https://firebasestorage.googleapis.com/v0/b/hearamclinic-ef507.firebasestorage.app/o/personality%2Fschema%2Fcover.png?alt=media"
              alt="심리도식 검사"
              fill
              sizes="(max-width: 640px) 128px, 176px"
              className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out-soft motion-reduce:transition-none"
              unoptimized
            />
          </div>
          <div className="p-4 sm:p-5 flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold">사운더리</span>
              <h2 className="text-lg font-bold text-gray-900 group-hover:text-purple-800 transition-colors">심리도식 검사</h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              어린 시절에 만들어져 지금도 반복되는 마음의 무늬를 18가지 도식·5개 영역으로 부드럽게 살펴보는 무료 심리검사예요.
            </p>
            <p className="mt-2 text-xs font-semibold text-purple-700">사운더리로 이동 후 진행 ↗</p>
          </div>
        </div>
      </a>

      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">블로그</h1>
          <p className="mt-1 text-sm text-gray-500">
            해람정신건강의학과 의료진이 전하는 마음 건강 이야기
          </p>
        </div>
        {(claims.admin || claims.editor) && (
          <Link
            href="/blog/new"
            className="pressable shrink-0 px-4 py-2 bg-purple-700 text-white rounded-full hover:bg-purple-800 text-sm font-medium shadow-sm shadow-purple-900/20"
          >
            + AI로 새 글 작성
          </Link>
        )}
      </div>

      {/* 검색 + 카테고리 필터 */}
      <div className="mb-8 space-y-3">
        <div className="relative">
          <label htmlFor={searchId} className="sr-only">
            글 검색
          </label>
          <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
          <input
            id={searchId}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="제목, 내용으로 검색"
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-gray-100/80 text-gray-900 placeholder:text-gray-400 border border-transparent focus:bg-white focus:border-purple-300 focus:outline-none focus:ring-4 focus:ring-purple-500/15 transition-[background-color,border-color,box-shadow]"
          />
        </div>

        {categoryList.length > 1 && (
          <div
            role="group"
            aria-label="카테고리"
            className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {categoryList.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedCategory(cat)}
                  className={`pressable shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border ${
                    active
                      ? "bg-purple-700 border-purple-700 text-white shadow-sm shadow-purple-900/20"
                      : "bg-white border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-800"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="surface p-10 text-center">
          <p className="font-medium text-gray-900">
            {posts.length === 0 ? "아직 블로그 글이 없습니다." : "검색 결과가 없습니다."}
          </p>
          {posts.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCategory("전체");
              }}
              className="pressable mt-3 text-sm font-medium text-purple-700 hover:text-purple-900"
            >
              검색 조건 초기화
            </button>
          )}
        </div>
      ) : (
        <ul className="grid gap-4 sm:gap-5">
          {filtered.map((post) => {
            const date = formatPostDate(post.dateSeconds);
            return (
              <li key={post.id}>
                <Link
                  href={`/${encodeURIComponent(safeDecodeSlug(post.slug))}`}
                  className="surface surface-hover card-lift group block overflow-hidden"
                >
                  <article className="flex flex-col sm:flex-row">
                    {post.featuredImage && (
                      <div className="relative w-full aspect-[16/9] sm:aspect-auto sm:w-52 sm:self-stretch sm:min-h-[150px] shrink-0 bg-purple-50">
                        <Image
                          src={post.featuredImage}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 100vw, 208px"
                          className="object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out-soft motion-reduce:transition-none"
                        />
                      </div>
                    )}
                    <div className="p-4 sm:p-5 flex-1 min-w-0 flex flex-col">
                      {post.categories.length > 0 && (
                        <p className="mb-1.5 flex flex-wrap gap-1.5">
                          {post.categories.map((c) => (
                            <span
                              key={c}
                              className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700"
                            >
                              {c}
                            </span>
                          ))}
                        </p>
                      )}
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 leading-snug group-hover:text-purple-800 transition-colors">
                        {post.title}
                      </h2>
                      <p className="mt-1.5 text-sm text-gray-600 line-clamp-2 leading-relaxed">
                        {decodeHtmlEntities(post.excerpt)}
                      </p>
                      <p className="mt-auto pt-3 text-xs text-gray-500 flex items-center gap-x-2">
                        {date.label && <time dateTime={date.iso}>{date.label}</time>}
                        {typeof post.viewCount === "number" && post.viewCount > 0 && (
                          <>
                            <span className="text-gray-300" aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1">
                              <IconEye className="w-3.5 h-3.5" />
                              <span className="sr-only">조회 </span>
                              {formatViews(post.viewCount)}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </article>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
