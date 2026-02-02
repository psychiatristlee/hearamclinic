"use client";

import { useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface GenerateResult {
  title: string;
  content: string;
  featuredImage: string;
  slug: string;
}

export default function NewPostPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [slug, setSlug] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (!topic.trim()) return;
    setGenerating(true);
    setError("");

    try {
      const generatePost = httpsCallable<{ topic: string }, GenerateResult>(
        functions,
        "generatePost"
      );
      const result = await generatePost({ topic });
      const data = result.data;

      setTitle(data.title);
      setContent(data.content);
      setFeaturedImage(data.featuredImage);
      setSlug(data.slug);
      setGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "생성 중 오류 발생");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!title || !content) return;
    setSaving(true);

    try {
      await addDoc(collection(db, "posts"), {
        title,
        slug,
        content,
        excerpt: content
          .replace(/[#*!\[\]()]/g, "")
          .replace(/\n+/g, " ")
          .trim()
          .slice(0, 200),
        date: Timestamp.now(),
        categories: ["AI 생성"],
        featuredImage,
        author: "이정석",
        updatedAt: Timestamp.now(),
      });

      router.push(`/blog/${encodeURIComponent(slug)}`);
    } catch (err) {
      console.error("저장 실패:", err);
      alert("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/blog"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; 블로그 목록
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">AI 블로그 글 작성</h1>

      {!generated ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              어떤 주제로 글을 작성할까요?
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="예: 불안장애의 증상과 치료 방법"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              disabled={generating}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleGenerate}
            disabled={generating || !topic.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
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
                AI가 글을 작성하고 있습니다...
              </span>
            ) : (
              "AI로 글 작성"
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setGenerated(false);
                setContent("");
                setTitle("");
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              &larr; 다시 생성하기
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              내용 (마크다운)
            </label>
            <div data-color-mode="light">
              <MDEditor
                value={content}
                onChange={(v) => setContent(v || "")}
                height={600}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
