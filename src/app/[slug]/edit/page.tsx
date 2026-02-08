"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  categories: string[];
  featuredImage: string;
}

export default function EditPostPage() {
  const { user, claims, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const slug = decodeURIComponent(params.slug as string);

  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchPost() {
      const q = query(collection(db, "posts"), where("slug", "==", slug));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docData = snapshot.docs[0];
        const data = { id: docData.id, ...docData.data() } as Post;
        setPost(data);
        setTitle(data.title);
        setContent(data.content);
      }
      setLoading(false);
    }
    fetchPost();
  }, [slug]);

  async function handleSave() {
    if (!post) return;
    setSaving(true);
    try {
      const postRef = doc(db, "posts", post.id);
      await updateDoc(postRef, {
        title,
        content,
        updatedAt: new Date(),
      });
      router.push(`/${encodeURIComponent(post.slug)}`);
    } catch (err) {
      console.error("저장 실패:", err);
      alert("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!authLoading && !loading && !user) {
      router.replace(`/login?redirect=/${slug}/edit`);
    }
  }, [authLoading, loading, user, router, slug]);

  if (authLoading || loading) {
    return <p className="text-gray-500">로딩 중...</p>;
  }
  if (!user) return null;
  if (!claims.admin && !claims.editor) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">접근 권한이 없습니다.</p>
        <p className="text-sm text-gray-400 mt-2">editor 또는 admin 권한이 필요합니다.</p>
      </div>
    );
  }

  if (!post) {
    return <p className="text-gray-500">글을 찾을 수 없습니다.</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/${encodeURIComponent(post.slug)}`}
          className="text-sm text-purple-500 hover:text-purple-700"
        >
          &larr; 돌아가기
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          제목
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          내용 (마크다운)
        </label>
        <div data-color-mode="light">
          <MDEditor value={content} onChange={(v) => setContent(v || "")} height={600} />
        </div>
      </div>
    </div>
  );
}
