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
import SectionImageList from "@/components/SectionImageList";

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
  const [suggestedTopics, setSuggestedTopics] = useState<
    {
      title: string;
      reason: string;
      outline: {
        intro: string;
        sections: { heading: string; summary: string }[];
      };
    }[]
  >([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [selectedOutline, setSelectedOutline] = useState<{
    intro: string;
    sections: { heading: string; summary: string }[];
  } | null>(null);
  const [searchKeywords, setSearchKeywords] = useState<
    {
      query: string;
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    }[]
  >([]);
  const [loadingKeywords, setLoadingKeywords] = useState(false);
  const [keywordsLoaded, setKeywordsLoaded] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [authorName, setAuthorName] = useState("");
  const [category, setCategory] = useState("");
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftUpdatedAt, setDraftUpdatedAt] = useState<string | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(true);

  const editorRef = useRef<MDXEditorMethods>(null);
  const savingRef = useRef(false);
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

  // 생성 중 페이지 이탈 경고
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (generating || generatingImages) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [generating, generatingImages]);


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

  const previousTopicsRef = useRef<string[]>([]);

  async function handleSuggestTopics() {
    setLoadingSuggestions(true);
    setError("");
    try {
      const suggestTopicsFn = httpsCallable<
        { previousTopics: string[] },
        {
          topics: {
            title: string;
            reason: string;
            outline: {
              intro: string;
              sections: { heading: string; summary: string }[];
            };
          }[];
        }
      >(functions, "suggestTopics");
      const result = await suggestTopicsFn({
        previousTopics: previousTopicsRef.current,
      });
      const newTopics = result.data.topics;
      previousTopicsRef.current = [
        ...previousTopicsRef.current,
        ...newTopics.map((t) => t.title),
      ];
      setSuggestedTopics(newTopics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "추천 중 오류 발생");
    } finally {
      setLoadingSuggestions(false);
    }
  }

  async function handleLoadKeywords() {
    if (keywordsLoaded) return;
    setLoadingKeywords(true);
    try {
      const getSearchKeywordsFn = httpsCallable<
        void,
        {
          keywords: {
            query: string;
            clicks: number;
            impressions: number;
            ctr: number;
            position: number;
          }[];
        }
      >(functions, "getSearchKeywords");
      const result = await getSearchKeywordsFn();
      setSearchKeywords(result.data.keywords);
      setKeywordsLoaded(true);
    } catch (err) {
      console.error("검색 키워드 로드 실패:", err);
    } finally {
      setLoadingKeywords(false);
    }
  }

  async function handleChatSend() {
    const msg = chatInput.trim();
    if (!msg || chatSending) return;

    // 첫 메시지를 주제로 설정
    if (!topic) {
      setTopic(msg);
    }

    const userMsg = { role: "user" as const, content: msg };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatInput("");
    setChatSending(true);
    setError("");

    try {
      const chatFn = httpsCallable<
        { message: string; history: { role: string; content: string }[] },
        { reply: string }
      >(functions, "chatAboutTopic", { timeout: 60_000 });
      const result = await chatFn({
        message: msg,
        history: chatMessages,
      });
      setChatMessages([
        ...updatedMessages,
        { role: "assistant", content: result.data.reply },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "채팅 중 오류 발생");
    } finally {
      setChatSending(false);
    }
  }

  // 채팅 스크롤 자동 이동
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  function handleSelectTopic(
    topicTitle: string,
    outline: { intro: string; sections: { heading: string; summary: string }[] }
  ) {
    setTopic(topicTitle);
    setSelectedOutline(outline);
    setShowManualInput(true);
  }

  async function handleGenerate() {
    if (!topic.trim()) return;
    setGenerating(true);
    setError("");

    try {
      const generatePost = httpsCallable<
        {
          topic: string;
          outline?: {
            intro: string;
            sections: { heading: string; summary: string }[];
          };
          chatHistory?: { role: string; content: string }[];
        },
        GenerateResult
      >(
        functions,
        "generatePost"
      );
      const payload: {
        topic: string;
        outline?: { intro: string; sections: { heading: string; summary: string }[] };
        chatHistory?: { role: string; content: string }[];
      } = { topic };
      if (selectedOutline) {
        payload.outline = selectedOutline;
      }
      if (chatMessages.length > 0) {
        payload.chatHistory = chatMessages;
      }
      console.log("[handleGenerate] payload outline:", JSON.stringify(payload.outline));
      const result = await generatePost(payload);
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
    if (savingRef.current) return;
    savingRef.current = true;
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
      savingRef.current = false;
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
        /* ========== 주제 선택 단계 ========== */
        <div className="space-y-6">
          {/* 주제 추천 카드 */}
          {!showManualInput && (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                AI 추천 주제
              </label>
              <p className="text-sm text-gray-400 mb-5">
                Gemini가 최신 트렌드를 분석해서 지금 가장 유용한 주제를
                추천합니다.
              </p>

              {suggestedTopics.length === 0 && !loadingSuggestions && (
                <button
                  onClick={handleSuggestTopics}
                  disabled={loadingSuggestions}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium shadow-sm"
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
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
                    />
                  </svg>
                  주제 추천받기
                </button>
              )}

              {loadingSuggestions && (
                <div className="flex items-center gap-3 text-purple-600 py-4">
                  <SpinnerIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    트렌드를 분석하고 있습니다...
                  </span>
                </div>
              )}

              {suggestedTopics.length > 0 && (
                <div className="space-y-3">
                  {suggestedTopics.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectTopic(t.title, t.outline)}
                      className="w-full text-left p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition group"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-7 h-7 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-sm font-bold">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 group-hover:text-purple-700 transition">
                            {t.title}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {t.reason}
                          </p>
                          {t.outline?.sections && (
                            <div className="mt-2 space-y-0.5">
                              {t.outline.sections.map((s, j) => (
                                <p
                                  key={j}
                                  className="text-xs text-gray-400 truncate"
                                >
                                  {j + 1}. {s.heading}
                                  <span className="text-gray-300">
                                    {" "}
                                    — {s.summary}
                                  </span>
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}

                  <button
                    onClick={handleSuggestTopics}
                    disabled={loadingSuggestions}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600 transition mt-2"
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
                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                      />
                    </svg>
                    다른 주제 추천받기
                  </button>
                </div>
              )}

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
            </div>
          )}

          {/* 직접 주제 입력 + 토론 */}
          {showManualInput ? (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              {/* 헤더 */}
              <div className="flex items-center justify-between px-8 pt-8 pb-4">
                <label className="block text-sm font-semibold text-gray-700">
                  Gemini와 주제 토론
                </label>
                <button
                  onClick={() => {
                    setShowManualInput(false);
                    setTopic("");
                    setSelectedOutline(null);
                    setChatMessages([]);
                    setChatInput("");
                  }}
                  className="text-sm text-gray-400 hover:text-purple-600 transition"
                >
                  추천 목록으로 돌아가기
                </button>
              </div>

              {/* 주제 + outline 표시 */}
              {topic && (
                <div className="mx-8 mb-4 px-4 py-3 bg-purple-50 border border-purple-100 rounded-xl">
                  <span className="text-xs text-purple-500 font-medium">주제</span>
                  <p className="text-sm text-purple-900 mt-0.5 font-medium">{topic}</p>
                  {selectedOutline && (
                    <div className="mt-3 pt-3 border-t border-purple-100 space-y-1.5">
                      <span className="text-xs text-purple-500 font-medium">구성</span>
                      <p className="text-xs text-purple-700">인트로: {selectedOutline.intro}</p>
                      {selectedOutline.sections.map((s, j) => (
                        <p key={j} className="text-xs text-purple-700">
                          {j + 1}. {s.heading}
                          <span className="text-purple-400"> — {s.summary}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 채팅 메시지 영역 */}
              {chatMessages.length > 0 && (
                <div className="mx-8 mb-4 max-h-96 overflow-y-auto border border-gray-100 rounded-xl">
                  <div className="p-4 space-y-4">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                            msg.role === "user"
                              ? "bg-purple-600 text-white rounded-br-md"
                              : "bg-gray-100 text-gray-800 rounded-bl-md"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {chatSending && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 text-gray-500 px-4 py-3 rounded-2xl rounded-bl-md text-sm flex items-center gap-2">
                          <SpinnerIcon className="h-4 w-4" />
                          생각하는 중...
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </div>
              )}

              {/* 채팅 입력 */}
              <div className="px-8 pb-4">
                <div className="flex gap-2">
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleChatSend();
                      }
                    }}
                    placeholder={chatMessages.length === 0
                      ? "주제를 입력하고 Gemini와 토론하세요. 예: 불안장애의 증상과 치료 방법"
                      : "메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
                    }
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none placeholder:text-gray-400"
                    rows={2}
                    disabled={chatSending || generating}
                  />
                  <button
                    onClick={handleChatSend}
                    disabled={chatSending || generating || !chatInput.trim()}
                    className="self-end px-4 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    title="전송"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </button>
                </div>
              </div>

              {error && (
                <div className="mx-8 mb-4">
                  <p className="text-red-500 text-sm flex items-center gap-1.5">
                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </p>
                </div>
              )}

              {/* 하단 액션 바 */}
              <div className="px-8 pb-8 pt-2 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {chatMessages.length === 0
                    ? "주제에 대해 토론한 후 글을 작성하거나, 바로 글쓰기를 시작할 수 있습니다."
                    : `${chatMessages.filter((m) => m.role === "user").length}개의 메시지로 토론 중`
                  }
                </p>
                <button
                  onClick={handleGenerate}
                  disabled={generating || (!topic.trim() && chatMessages.length === 0)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium shadow-sm"
                >
                  {generating ? (
                    <>
                      <SpinnerIcon className="h-5 w-5" />
                      AI가 글을 작성하고 있습니다...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                      {chatMessages.length > 0 ? "토론 기반으로 글쓰기" : "AI로 글 작성"}
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setShowManualInput(true);
                setSelectedOutline(null);
              }}
              className="w-full py-3 text-sm text-gray-500 hover:text-purple-600 border border-dashed border-gray-300 hover:border-purple-300 rounded-xl transition"
            >
              직접 주제를 입력하고 싶어요
            </button>
          )}

          {/* 최근 검색 키워드 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-gray-700">
                최근 검색 키워드
              </label>
              {keywordsLoaded && (
                <span className="text-xs text-gray-400">
                  최근 28일 · hearam.kr
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mb-5">
              Google에서 hearam.kr로 접근할 때 사용한 검색어입니다.
            </p>

            {!keywordsLoaded && !loadingKeywords && (
              <button
                onClick={handleLoadKeywords}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
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
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
                검색 키워드 불러오기
              </button>
            )}

            {loadingKeywords && (
              <div className="flex items-center gap-3 text-gray-500 py-4">
                <SpinnerIcon className="h-5 w-5" />
                <span className="text-sm font-medium">
                  검색 키워드를 불러오고 있습니다...
                </span>
              </div>
            )}

            {keywordsLoaded && searchKeywords.length === 0 && (
              <p className="text-sm text-gray-400 py-2">
                최근 검색 키워드가 없습니다.
              </p>
            )}

            {searchKeywords.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500 text-xs">
                      <th className="text-left py-2 pr-4 font-medium">키워드</th>
                      <th className="text-right py-2 px-3 font-medium">클릭</th>
                      <th className="text-right py-2 px-3 font-medium">노출</th>
                      <th className="text-right py-2 px-3 font-medium">CTR</th>
                      <th className="text-right py-2 pl-3 font-medium">순위</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchKeywords.map((kw, i) => (
                      <tr
                        key={i}
                        className="border-b border-gray-50 hover:bg-purple-50 cursor-pointer transition"
                        onClick={() => {
                          setTopic(kw.query);
                          setSelectedOutline(null);
                          setShowManualInput(true);
                        }}
                      >
                        <td className="py-2.5 pr-4 text-gray-900 font-medium">
                          {kw.query}
                        </td>
                        <td className="py-2.5 px-3 text-right text-gray-600">
                          {kw.clicks}
                        </td>
                        <td className="py-2.5 px-3 text-right text-gray-600">
                          {kw.impressions.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right text-gray-600">
                          {kw.ctr}%
                        </td>
                        <td className="py-2.5 pl-3 text-right text-gray-600">
                          {kw.position}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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

          {/* 섹션별 이미지 관리 */}
          <SectionImageList
            content={content}
            slug={slug}
            onContentUpdate={updateContent}
            onFeaturedImageUpdate={setFeaturedImage}
            disabled={isBusy}
          />

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
