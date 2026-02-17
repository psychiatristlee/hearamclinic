"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MarkdownEditor, {
  type MDXEditorMethods,
} from "@/components/MarkdownEditor";

interface GenerateResult {
  title: string;
  content: string;
  featuredImage: string;
  slug: string;
}

interface EditResult {
  title: string;
  content: string;
}

interface ImageResult {
  content: string;
  featuredImage: string;
}

interface DraftResult {
  exists: boolean;
  title?: string;
  content?: string;
  slug?: string;
  featuredImage?: string;
  topic?: string;
  updatedAt?: string | null;
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

export default function NewPostPage() {
  const { user, claims, loading: authLoading } = useAuth();
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [slug, setSlug] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [error, setError] = useState("");
  const [editInstructions, setEditInstructions] = useState("");
  const [showEditInput, setShowEditInput] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [category, setCategory] = useState("");
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftUpdatedAt, setDraftUpdatedAt] = useState<string | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(true);

  const editorRef = useRef<MDXEditorMethods>(null);
  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
    editorRef.current?.setMarkdown(newContent);
  }, []);

  // 카테고리 관련 state
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  // Firestore에서 카테고리 목록 불러오기
  useEffect(() => {
    async function fetchCategories() {
      try {
        const q = query(
          collection(db, "categories"),
          orderBy("order", "asc")
        );
        const snap = await getDocs(q);
        const names = snap.docs.map((d) => d.data().name as string);
        if (names.length > 0) {
          setCategories(names);
          if (!category) setCategory(names[0]);
        } else {
          // fallback: 카테고리가 없으면 기본값 사용
          const fallback = ["정신과 설명서", "서평", "기타"];
          setCategories(fallback);
          if (!category) setCategory(fallback[0]);
        }
      } catch {
        const fallback = ["정신과 설명서", "서평", "기타"];
        setCategories(fallback);
        if (!category) setCategory(fallback[0]);
      } finally {
        setLoadingCategories(false);
      }
    }
    fetchCategories();
  }, []);

  async function handleAddCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    if (categories.includes(name)) {
      setCategory(name);
      setShowNewCategory(false);
      setNewCategoryName("");
      return;
    }

    setAddingCategory(true);
    try {
      await addDoc(collection(db, "categories"), {
        name,
        order: categories.length,
        createdAt: Timestamp.now(),
      });
      setCategories((prev) => [...prev, name]);
      setCategory(name);
      setShowNewCategory(false);
      setNewCategoryName("");
    } catch {
      alert("카테고리 추가에 실패했습니다.");
    } finally {
      setAddingCategory(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (snap.exists()) {
        setAuthorName(snap.data().authorName || user.displayName || "");
      } else {
        setAuthorName(user.displayName || "");
      }
    });
  }, [user]);

  // 임시 저장 불러오기
  useEffect(() => {
    if (!user || (!claims.admin && !claims.editor)) {
      setLoadingDraft(false);
      return;
    }

    async function fetchDraft() {
      try {
        const loadDraftFn = httpsCallable<void, DraftResult>(
          functions,
          "loadDraft"
        );
        const result = await loadDraftFn();
        const data = result.data;

        if (data.exists && (data.title || data.content)) {
          setTitle(data.title || "");
          updateContent(data.content || "");
          setSlug(data.slug || "");
          setFeaturedImage(data.featuredImage || "");
          setTopic(data.topic || "");
          setDraftUpdatedAt(data.updatedAt || null);
          setDraftLoaded(true);
          if (data.title || data.content) {
            setGenerated(true);
          }
        }
      } catch (err) {
        console.error("임시 저장 불러오기 실패:", err);
      } finally {
        setLoadingDraft(false);
      }
    }

    fetchDraft();
  }, [user, claims]);

  const handleSaveDraft = useCallback(async () => {
    if (!title && !content) return;
    setSavingDraft(true);

    try {
      const saveDraftFn = httpsCallable<
        {
          title: string;
          content: string;
          slug: string;
          featuredImage: string;
          topic: string;
        },
        { success: boolean }
      >(functions, "saveDraft");
      await saveDraftFn({ title, content, slug, featuredImage, topic });
      setDraftUpdatedAt(new Date().toISOString());
      setDraftLoaded(true);
    } catch (err) {
      console.error("임시 저장 실패:", err);
      alert("임시 저장에 실패했습니다.");
    } finally {
      setSavingDraft(false);
    }
  }, [title, content, slug, featuredImage, topic]);

  async function handleDeleteDraft() {
    if (!confirm("임시 저장을 삭제하시겠습니까?")) return;

    try {
      const deleteDraftFn = httpsCallable<void, { success: boolean }>(
        functions,
        "deleteDraft"
      );
      await deleteDraftFn();
      setDraftLoaded(false);
      setDraftUpdatedAt(null);
      setGenerated(false);
      setTitle("");
      updateContent("");
      setSlug("");
      setFeaturedImage("");
      setTopic("");
    } catch (err) {
      console.error("임시 저장 삭제 실패:", err);
      alert("임시 저장 삭제에 실패했습니다.");
    }
  }

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

      // 본문에서 첫 번째 h1 제거 (제목 필드와 중복 방지)
      const contentWithoutH1 = data.content
        .replace(/^\s*#\s+.+\n*/, "")
        .trimStart();

      setTitle(data.title);
      updateContent(contentWithoutH1);
      setFeaturedImage(data.featuredImage);
      setSlug(data.slug);
      setGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "생성 중 오류 발생");
    } finally {
      setGenerating(false);
    }
  }

  async function handleEdit() {
    if (!editInstructions.trim() || !content) return;
    setGenerating(true);
    setError("");

    try {
      const editPostFn = httpsCallable<
        { content: string; title: string; instructions: string },
        EditResult
      >(functions, "editPost", { timeout: 300_000 });
      const result = await editPostFn({
        content,
        title,
        instructions: editInstructions,
      });
      setTitle(result.data.title);
      updateContent(result.data.content);
      setShowEditInput(false);
      setEditInstructions("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "수정 중 오류 발생");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!title || !content) return;
    setSaving(true);

    try {
      let finalContent = content;
      let finalFeaturedImage = featuredImage;

      if (content.includes("temp%2F")) {
        const finalize = httpsCallable<
          { content: string; slug: string },
          ImageResult
        >(functions, "finalizePostImages");
        const result = await finalize({ content, slug });
        finalContent = result.data.content;
        finalFeaturedImage = result.data.featuredImage;
      }

      await addDoc(collection(db, "posts"), {
        title,
        slug,
        content: finalContent,
        excerpt: finalContent
          .replace(/[#*!\[\]()]/g, "")
          .replace(/\n+/g, " ")
          .trim()
          .slice(0, 200),
        date: Timestamp.now(),
        categories: [category],
        featuredImage: finalFeaturedImage,
        author: authorName || user?.displayName || "",
        updatedAt: Timestamp.now(),
      });

      if (draftLoaded) {
        try {
          const deleteDraftFn = httpsCallable<void, { success: boolean }>(
            functions,
            "deleteDraft"
          );
          await deleteDraftFn();
        } catch (err) {
          console.error("임시 저장 삭제 실패:", err);
        }
      }

      router.push(`/${encodeURIComponent(slug)}`);
    } catch (err) {
      console.error("저장 실패:", err);
      alert("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateImages() {
    if (!content || !slug) return;
    setGeneratingImages(true);
    setError("");

    try {
      const generatePostImages = httpsCallable<
        { content: string; slug: string },
        ImageResult
      >(functions, "generatePostImages", { timeout: 300_000 });
      const result = await generatePostImages({ content, slug });
      updateContent(result.data.content);
      setFeaturedImage(result.data.featuredImage);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "이미지 생성 중 오류 발생"
      );
    } finally {
      setGeneratingImages(false);
    }
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/blog/new");
    }
  }, [authLoading, user, router]);

  if (authLoading || loadingDraft)
    return <p className="text-gray-500">로딩 중...</p>;
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

  const isBusy = generating || generatingImages || saving;

  return (
    <div className="max-w-5xl mx-auto">
      {/* 상단 네비게이션 */}
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/"
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
          블로그 목록
        </Link>
        {draftLoaded && draftUpdatedAt && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            임시 저장: {new Date(draftUpdatedAt).toLocaleString("ko-KR")}
            <button
              onClick={handleDeleteDraft}
              className="ml-1 text-red-400 hover:text-red-600 transition"
            >
              삭제
            </button>
          </div>
        )}
      </div>

      {/* 페이지 제목 */}
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        AI 블로그 글 작성
      </h1>

      {!generated ? (
        /* ========== 주제 입력 단계 ========== */
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            어떤 주제로 글을 작성할까요?
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="예: 불안장애의 증상과 치료 방법"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none placeholder:text-gray-400"
            rows={3}
            disabled={generating}
          />

          {error && (
            <p className="mt-3 text-red-500 text-sm flex items-center gap-1.5">
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
            </p>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating || !topic.trim()}
            className="mt-5 inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium shadow-sm"
          >
            {generating ? (
              <>
                <SpinnerIcon className="h-5 w-5" />
                AI가 글을 작성하고 있습니다...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
                  />
                </svg>
                AI로 글 작성
              </>
            )}
          </button>
        </div>
      ) : (
        /* ========== 편집 단계 ========== */
        <div className="space-y-6">
          {/* 상단 툴바 */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setGenerated(false);
                updateContent("");
                setTitle("");
              }}
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
              주제 변경
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={savingDraft || saving || (!title && !content)}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600 disabled:opacity-40 transition"
            >
              {savingDraft ? (
                <>
                  <SpinnerIcon className="h-3.5 w-3.5" />
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
                      d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 3v4h8V3M7 21v-8h10v8"
                    />
                  </svg>
                  임시 저장
                </>
              )}
            </button>
          </div>

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
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
            {/* 제목 */}
            <div>
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

            {/* 카테고리 + 슬러그 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  카테고리
                </label>
                {showNewCategory ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleAddCategory()
                      }
                      placeholder="새 카테고리 이름"
                      className="flex-1 px-4 py-2.5 border border-purple-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      autoFocus
                    />
                    <button
                      onClick={handleAddCategory}
                      disabled={addingCategory || !newCategoryName.trim()}
                      className="px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition text-sm font-medium"
                    >
                      {addingCategory ? (
                        <SpinnerIcon className="h-4 w-4" />
                      ) : (
                        "추가"
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowNewCategory(false);
                        setNewCategoryName("");
                      }}
                      className="px-3 py-2.5 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition text-sm"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      disabled={loadingCategories}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowNewCategory(true)}
                      className="px-3 py-2.5 border border-gray-200 text-gray-500 rounded-xl hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition"
                      title="새 카테고리 추가"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4.5v15m7.5-7.5h-15"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  슬러그 (URL)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-base text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 마크다운 에디터 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              내용
            </label>
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <MarkdownEditor
                ref={editorRef}
                markdown={content}
                onChange={(v) => setContent(v)}
              />
            </div>
          </div>

          {/* AI 수정 지시사항 입력 */}
          {showEditInput && (
            <div className="bg-white border border-purple-200 rounded-2xl p-5 shadow-sm space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                어떻게 수정할까요?
              </label>
              <textarea
                value={editInstructions}
                onChange={(e) => setEditInstructions(e.target.value)}
                placeholder="예: 두 번째 섹션에 약물 부작용 내용을 추가해줘 / 어조를 더 친근하게 바꿔줘 / 웹에서 관련 사진을 찾아서 넣어줘"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none placeholder:text-gray-400"
                rows={3}
                disabled={generating}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setShowEditInput(false); setEditInstructions(""); }}
                  disabled={generating}
                  className="px-4 py-2 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition text-sm"
                >
                  취소
                </button>
                <button
                  onClick={handleEdit}
                  disabled={generating || !editInstructions.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                >
                  {generating ? (
                    <>
                      <SpinnerIcon />
                      AI 수정 중...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                      AI로 수정
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 하단 액션 바 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* 보조 액션 */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowEditInput(!showEditInput)}
                disabled={isBusy || !content}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                AI 수정
              </button>
              <button
                onClick={handleGenerateImages}
                disabled={isBusy}
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
                  발행하기
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
