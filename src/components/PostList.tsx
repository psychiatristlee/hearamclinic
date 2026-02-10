"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/AuthContext";

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
                  <p className="text-sm text-gray-500 mb-2">
                    {new Date(post.dateSeconds * 1000).toLocaleDateString(
                      "ko-KR"
                    )}
                    {post.categories.length > 0 && (
                      <span className="ml-2 text-gray-400">
                        {post.categories.join(", ")}
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
