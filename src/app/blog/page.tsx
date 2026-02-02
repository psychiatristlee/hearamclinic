"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  date: { seconds: number };
  categories: string[];
  featuredImage: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      const q = query(collection(db, "posts"), orderBy("date", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[];
      setPosts(data);
      setLoading(false);
    }
    fetchPosts();
  }, []);

  if (loading) {
    return <p className="text-gray-500">로딩 중...</p>;
  }

  if (posts.length === 0) {
    return <p className="text-gray-500">아직 블로그 글이 없습니다.</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">블로그</h1>
        <Link
          href="/blog/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          + AI로 새 글 작성
        </Link>
      </div>
      <div className="grid gap-6">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${encodeURIComponent(post.slug)}`}
            className="block border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
          >
            <div className="flex">
              {post.featuredImage && (
                <div className="w-48 h-36 flex-shrink-0">
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4 flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {post.title}
                </h2>
                <p className="text-sm text-gray-500 mb-2">
                  {new Date(post.date.seconds * 1000).toLocaleDateString(
                    "ko-KR"
                  )}
                  {post.categories.length > 0 && (
                    <span className="ml-2 text-gray-400">
                      {post.categories.join(", ")}
                    </span>
                  )}
                </p>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {post.excerpt}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
