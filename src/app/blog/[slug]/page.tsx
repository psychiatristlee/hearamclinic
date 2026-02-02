"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { useParams } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  date: { seconds: number };
  categories: string[];
  featuredImage: string;
  author: string;
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = decodeURIComponent(params.slug as string);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      const q = query(collection(db, "posts"), where("slug", "==", slug));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setPost({ id: doc.id, ...doc.data() } as Post);
      }
      setLoading(false);
    }
    fetchPost();
  }, [slug]);

  if (loading) {
    return <p className="text-gray-500">로딩 중...</p>;
  }

  if (!post) {
    return <p className="text-gray-500">글을 찾을 수 없습니다.</p>;
  }

  return (
    <article>
      <div className="mb-8">
        <Link
          href="/blog"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; 블로그 목록
        </Link>
      </div>

      {post.featuredImage && (
        <img
          src={post.featuredImage}
          alt={post.title}
          className="w-full max-h-96 object-cover rounded-lg mb-8"
        />
      )}

      <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>

      <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 pb-4 border-b">
        <span>{post.author}</span>
        <span>
          {new Date(post.date.seconds * 1000).toLocaleDateString("ko-KR")}
        </span>
        {post.categories.length > 0 && (
          <span>{post.categories.join(", ")}</span>
        )}
        <Link
          href={`/blog/${encodeURIComponent(post.slug)}/edit`}
          className="ml-auto text-blue-600 hover:text-blue-800"
        >
          수정
        </Link>
      </div>

      <div className="prose prose-lg max-w-none">
        <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          {post.content}
        </Markdown>
      </div>
    </article>
  );
}
