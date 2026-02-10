"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
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

interface GenerateResult {
  title: string;
  content: string;
  featuredImage: string;
  slug: string;
}

interface ImageResult {
  content: string;
  featuredImage: string;
}

const SpinnerIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

export default function EditPostPage() {
  const { user, claims, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const slug = decodeURIComponent(params.slug as string);

  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [error, setError] = useState("");

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
        setFeaturedImage(data.featuredImage || "");
      }
      setLoading(false);
    }
    fetchPost();
  }, [slug]);

  async function handleGenerate() {
    if (!title.trim()) return;
    setGenerating(true);
    setError("");

    try {
      const generatePost = httpsCallable<{ topic: string }, GenerateResult>(
        functions,
        "generatePost"
      );
      const result = await generatePost({ topic: title });
      setTitle(result.data.title);
      setContent(result.data.content);
      setFeaturedImage(result.data.featuredImage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "재생성 중 오류 발생");
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerateImages() {
    if (!content || !post) return;
    setGeneratingImages(true);
    setError("");

    try {
      const generatePostImages = httpsCallable<
        { content: string; slug: string },
        ImageResult
      >(functions, "generatePostImages");
      const result = await generatePostImages({ content, slug: post.slug });
      setContent(result.data.content);
      setFeaturedImage(result.data.featuredImage);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "이미지 생성 중 오류 발생"
      );
    } finally {
      setGeneratingImages(false);
    }
  }

  async function handleSave() {
    if (!post) return;
    setSaving(true);

    try {
      const postRef = doc(db, "posts", post.id);
      await updateDoc(postRef, {
        title,
        content,
        excerpt: content
          .replace(/[#*!\[\]()]/g, "")
          .replace(/\n+/g, " ")
          .trim()
          .slice(0, 200),
        featuredImage,
        updatedAt: Timestamp.now(),
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
        <p className="text-sm text-gray-400 mt-2">
          editor 또는 admin 권한이 필요합니다.
        </p>
      </div>
    );
  }

  if (!post) {
    return <p className="text-gray-500">글을 찾을 수 없습니다.</p>;
  }

  const isBusy = generating || generatingImages || saving;

  return (
    <div className="max-w-5xl mx-auto">
      {/* 상단 네비게이션 */}
      <div className="mb-8">
        <Link
          href={`/${encodeURIComponent(post.slug)}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600 transition"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          돌아가기
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">글 수정</h1>

      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm flex items-center gap-2">
            <svg
              className="w-4 h-4 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        )}

        {/* 글 정보 카드 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            제목
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* 마크다운 에디터 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            내용 (마크다운)
          </label>
          <div data-color-mode="light" className="rounded-xl overflow-hidden">
            <MDEditor
              value={content}
              onChange={(v) => setContent(v || "")}
              height={600}
            />
          </div>
        </div>

        {/* 하단 액션 바 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* 보조 액션 */}
          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={isBusy || !title.trim()}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm font-medium"
            >
              {generating ? (
                <>
                  <SpinnerIcon />
                  재생성 중...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                    />
                  </svg>
                  재생성
                </>
              )}
            </button>
            <button
              onClick={handleGenerateImages}
              disabled={isBusy || !content}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-purple-200 text-purple-600 rounded-xl hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm font-medium"
            >
              {generatingImages ? (
                <>
                  <SpinnerIcon />
                  사진 생성 중...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                    />
                  </svg>
                  사진 생성
                </>
              )}
            </button>
          </div>

          {/* 주요 액션 */}
          <button
            onClick={handleSave}
            disabled={isBusy || !title || !content}
            className="inline-flex items-center justify-center gap-2 px-8 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm font-semibold shadow-sm"
          >
            {saving ? (
              <>
                <SpinnerIcon />
                저장 중...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
                  />
                </svg>
                저장하기
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
