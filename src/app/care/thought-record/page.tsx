"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import {
  buildUserContext,
  callThoughtRecord,
  savePracticeSession,
  listPracticeSessions,
  type ThoughtRecordResult,
  type PracticeSessionRecord,
} from "@/lib/care";
import RequireAuth from "@/components/auth/RequireAuth";


interface ThoughtRecordInput {
  situation: string;
  automaticThought: string;
  emotion?: string;
}

type ThoughtRecordSession = PracticeSessionRecord<
  ThoughtRecordInput,
  ThoughtRecordResult
>;

type View = "list" | "form" | "result" | "detail";

export default function ThoughtRecordPage() {
  return (
    <RequireAuth message="사고 기록을 본인 계정에 안전하게 보관하고 과거 기록을 볼 수 있도록 로그인이 필요합니다.">
      <ThoughtRecordContent />
    </RequireAuth>
  );
}

function ThoughtRecordContent() {
  const [view, setView] = useState<View>("list");
  const [sessions, setSessions] = useState<ThoughtRecordSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [selectedSession, setSelectedSession] =
    useState<ThoughtRecordSession | null>(null);

  const [situation, setSituation] = useState("");
  const [automaticThought, setAutomaticThought] = useState("");
  const [emotion, setEmotion] = useState("");
  const [result, setResult] = useState<ThoughtRecordResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      // auth 초기화 후 한 번 더 시도
      await new Promise<void>((resolve) => {
        const unsub = auth.onAuthStateChanged(() => {
          unsub();
          resolve();
        });
      });
      const data = await listPracticeSessions<
        ThoughtRecordInput,
        ThoughtRecordResult
      >("thought-record", 30);
      setSessions(data);
      setLoadingSessions(false);
    })();
  }, []);

  async function handleSubmit() {
    if (!situation.trim() || !automaticThought.trim()) {
      setError("상황과 떠오른 생각을 적어주세요.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const ctx = await buildUserContext();
      const data = await callThoughtRecord({
        situation: situation.trim(),
        automaticThought: automaticThought.trim(),
        emotion: emotion.trim() || undefined,
        context: ctx,
      });
      setResult(data);
      await savePracticeSession(
        "thought-record",
        { situation, automaticThought, emotion },
        data,
      );
      // 새 세션을 리스트에 즉시 반영
      const newSession: ThoughtRecordSession = {
        id: `temp-${Date.now()}`,
        type: "thought-record",
        input: { situation, automaticThought, emotion },
        output: data,
        createdAt: new Date(),
      };
      setSessions((prev) => [newSession, ...prev]);
      setView("result");
    } catch (err) {
      console.error(err);
      setError("분석에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setSituation("");
    setAutomaticThought("");
    setEmotion("");
    setResult(null);
    setError("");
    setView("list");
  }

  function handleViewSession(s: ThoughtRecordSession) {
    setSelectedSession(s);
    setView("detail");
  }

  function formatDate(d: Date): string {
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) {
      return `오늘 ${d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`;
    }
    return d.toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatTime(d: Date): string {
    return d.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function dayGroupLabel(d: Date): string {
    const now = new Date();
    const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
    if (sameDay(d, now)) return "오늘";
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (sameDay(d, yesterday)) return "어제";
    const diffDays = Math.floor(
      (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays < 7) return `${diffDays}일 전`;
    return d.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    });
  }

  /** sessions를 날짜별로 그룹핑 (이미 시간 역순 정렬됨 전제) */
  function groupByDay(items: ThoughtRecordSession[]): Array<{
    key: string;
    label: string;
    items: ThoughtRecordSession[];
  }> {
    const groups: Array<{ key: string; label: string; items: ThoughtRecordSession[] }> = [];
    for (const s of items) {
      const key = s.createdAt.toDateString();
      const last = groups[groups.length - 1];
      if (last && last.key === key) {
        last.items.push(s);
      } else {
        groups.push({ key, label: dayGroupLabel(s.createdAt), items: [s] });
      }
    }
    return groups;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-purple-900 mb-2">📝 사고 기록</h1>
      <p className="text-gray-600 mb-6">
        마음에 떠오른 자동 사고를 입력하시면 인지 왜곡을 살피고 균형 잡힌 생각을 함께 정리해 드립니다.
      </p>

      {/* 과거 기록 리스트 */}
      {view === "list" && (
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-purple-900">
                지난 기록
                {sessions.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    {sessions.length}건
                  </span>
                )}
              </h2>
              <button
                onClick={() => setView("form")}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition"
              >
                + 새로 쓰기
              </button>
            </div>

            {loadingSessions ? (
              <p className="text-sm text-gray-500 text-center py-6">
                불러오는 중...
              </p>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-sm text-gray-500 mb-1">아직 작성한 기록이 없어요</p>
                <p className="text-xs text-gray-400">
                  마음에 떠오른 생각을 첫 기록으로 남겨 보세요
                </p>
              </div>
            ) : (
              <div className="relative pl-6">
                {/* 세로 타임라인 라인 */}
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-purple-200" />

                {groupByDay(sessions).map((group) => (
                  <div key={group.key} className="mb-5 last:mb-0">
                    {/* 날짜 헤더 */}
                    <div className="relative -ml-6 mb-3">
                      <div className="inline-block px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                        {group.label}
                      </div>
                    </div>

                    <ul className="space-y-3">
                      {group.items.map((s) => (
                        <li key={s.id} className="relative">
                          {/* 점 마커 */}
                          <div className="absolute -left-[1.31rem] top-3 w-3 h-3 rounded-full bg-purple-500 border-2 border-white shadow" />

                          <button
                            onClick={() => handleViewSession(s)}
                            className="w-full text-left p-3 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition"
                          >
                            <p className="text-[11px] text-gray-400 mb-1.5">
                              {formatTime(s.createdAt)}
                            </p>

                            <div className="space-y-1.5">
                              <div className="flex gap-1.5 items-start">
                                <span className="text-xs text-purple-700 font-semibold flex-shrink-0 w-10">상황</span>
                                <p className="text-xs text-gray-700 line-clamp-1 flex-1">
                                  {s.input.situation}
                                </p>
                              </div>
                              <div className="flex gap-1.5 items-start">
                                <span className="text-xs text-purple-700 font-semibold flex-shrink-0 w-10">사고</span>
                                <p className="text-xs text-gray-700 line-clamp-2 flex-1">
                                  {s.input.automaticThought}
                                </p>
                              </div>
                              {s.output?.balancedThought && (
                                <div className="flex gap-1.5 items-start pt-1.5 border-t border-gray-100">
                                  <span className="text-xs text-emerald-700 font-semibold flex-shrink-0 w-10">균형</span>
                                  <p className="text-xs text-emerald-800 line-clamp-2 flex-1 italic">
                                    {s.output.balancedThought}
                                  </p>
                                </div>
                              )}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 text-center">
            모든 기록은 본인 계정에만 저장되며, 다른 사용자가 볼 수 없습니다.
          </p>
        </div>
      )}

      {/* 새 기록 작성 */}
      {view === "form" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <button
            onClick={() => setView("list")}
            className="text-sm text-purple-600 hover:underline mb-2"
          >
            ← 기록 목록으로
          </button>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              어떤 상황이었나요?
            </label>
            <textarea
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              placeholder="예: 회의에서 발표 후 동료가 다른 곳을 봤다"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              그 순간 떠오른 생각은요?
            </label>
            <textarea
              value={automaticThought}
              onChange={(e) => setAutomaticThought(e.target.value)}
              placeholder="예: 내 발표가 지루했나 보다. 사람들이 나를 무능하다고 생각할 거야."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              어떤 감정이 들었나요? (선택)
            </label>
            <input
              type="text"
              value={emotion}
              onChange={(e) => setEmotion(e.target.value)}
              placeholder="예: 부끄러움 70, 무력감 50"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-lg transition"
          >
            {loading ? "함께 살펴보는 중..." : "분석하기"}
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      )}

      {/* 방금 분석한 결과 */}
      {view === "result" && result && (
        <ResultView
          result={result}
          onBack={handleReset}
          backLabel="기록 목록으로"
        />
      )}

      {/* 과거 기록 상세 */}
      {view === "detail" && selectedSession && (
        <div className="space-y-4">
          <button
            onClick={() => {
              setSelectedSession(null);
              setView("list");
            }}
            className="text-sm text-purple-600 hover:underline"
          >
            ← 기록 목록으로
          </button>

          <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5">
            <p className="text-xs text-purple-600 font-medium mb-2">
              {formatDate(selectedSession.createdAt)}
            </p>
            <h3 className="text-sm font-semibold text-purple-900 mb-1">상황</h3>
            <p className="text-sm text-gray-800 mb-3">
              {selectedSession.input.situation}
            </p>
            <h3 className="text-sm font-semibold text-purple-900 mb-1">자동 사고</h3>
            <p className="text-sm text-gray-800 mb-3">
              💭 {selectedSession.input.automaticThought}
            </p>
            {selectedSession.input.emotion && (
              <>
                <h3 className="text-sm font-semibold text-purple-900 mb-1">감정</h3>
                <p className="text-sm text-gray-800">
                  {selectedSession.input.emotion}
                </p>
              </>
            )}
          </div>

          <ResultView
            result={selectedSession.output}
            onBack={() => {
              setSelectedSession(null);
              setView("list");
            }}
            backLabel="기록 목록으로 돌아가기"
          />
        </div>
      )}
    </div>
  );
}

function ResultView({
  result,
  onBack,
  backLabel,
}: {
  result: ThoughtRecordResult;
  onBack: () => void;
  backLabel: string;
}) {
  return (
    <div className="space-y-5">
      <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-purple-800 mb-2">먼저, 그 마음을</h3>
        <p className="text-purple-900 leading-relaxed">{result.validation}</p>
      </div>

      {result.distortions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-purple-900 mb-3">살펴볼 인지 왜곡</h3>
          <ul className="space-y-3">
            {result.distortions.map((d, i) => (
              <li key={i} className="border-l-2 border-purple-300 pl-3">
                <p className="text-sm font-semibold text-purple-700">{d.name}</p>
                <p className="text-sm text-gray-700 mt-1">{d.explain}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-purple-900 mb-3">증거를 점검하는 질문</h3>
        <ol className="space-y-2 list-decimal list-inside text-sm text-gray-700">
          {result.questions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ol>
      </div>

      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-emerald-800 mb-2">균형 잡힌 생각</h3>
        <p className="text-emerald-900 leading-relaxed">{result.balancedThought}</p>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-amber-800 mb-2">지금 해볼 작은 행동</h3>
        <p className="text-amber-900 leading-relaxed">{result.smallAction}</p>
      </div>

      {result.gentleNote && (
        <p className="text-xs text-gray-500 italic px-2">{result.gentleNote}</p>
      )}

      <button
        onClick={onBack}
        className="w-full px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition"
      >
        {backLabel}
      </button>
    </div>
  );
}
