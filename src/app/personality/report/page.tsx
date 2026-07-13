"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { httpsCallable } from "firebase/functions";
import { functions, auth } from "@/lib/firebase";
import { listUserTestResults, type TestResultRecord } from "@/lib/test-history";
import RequireAuth from "@/components/auth/RequireAuth";
import {
  getNextGuidedTest,
  guidedPath,
} from "@/lib/test/personality-guide";

interface ReportPayload {
  headline: string;
  summary: string;
  coreTraits: string;
  strengths: string[];
  growthAreas: string[];
  relationships: string;
  workEnvironment: string;
  stressPatterns: string;
  selfCare: string;
  closingNote: string;
}

interface TestCatalogItem {
  type: string;
  displayTitle: string;
  href: string;
  emoji: string;
}

const CATALOG: TestCatalogItem[] = [
  { type: "big5", displayTitle: "Big 5 성격 검사", href: "/personality/big5", emoji: "🧬" },
  { type: "enneagram", displayTitle: "에니어그램", href: "/personality/enneagram", emoji: "🌐" },
  { type: "attachment", displayTitle: "애착 유형", href: "/personality/attachment", emoji: "💞" },
  { type: "disc", displayTitle: "DISC 행동 유형", href: "/personality/disc", emoji: "🎯" },
  { type: "riasec", displayTitle: "직업흥미 검사 (RIASEC)", href: "/personality/riasec", emoji: "🧭" },
];

export default function PersonalityReportPage() {
  return (
    <RequireAuth message="종합 보고서를 만들고 본인 계정에 저장하기 위해 로그인이 필요합니다.">
      <ReportContent />
    </RequireAuth>
  );
}

function ReportContent() {
  const router = useRouter();
  const [latestByType, setLatestByType] = useState<Record<string, TestResultRecord>>({});
  const [loadingResults, setLoadingResults] = useState(true);
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [startingGuided, setStartingGuided] = useState(false);

  useEffect(() => {
    (async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoadingResults(false);
        return;
      }
      const all = await listUserTestResults(user.uid, { max: 200 });
      const map: Record<string, TestResultRecord> = {};
      for (const r of all) {
        if (CATALOG.some((c) => c.type === r.type) && !map[r.type]) {
          map[r.type] = r; // 가장 최근 결과만
        }
      }
      setLatestByType(map);
      setLoadingResults(false);
    })();
  }, []);

  const completedCount = Object.keys(latestByType).length;
  const allCompleted = completedCount === CATALOG.length;

  async function handleStartGuided() {
    setStartingGuided(true);
    const next = await getNextGuidedTest();
    if (next) {
      router.push(guidedPath(next.path));
    } else {
      // 이미 모두 완료 - 그냥 보고서 생성으로 진행
      setStartingGuided(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    setReport(null);
    try {
      const tests = CATALOG
        .filter((c) => latestByType[c.type])
        .map((c) => {
          const r = latestByType[c.type];
          return {
            type: r.type,
            displayTitle: r.displayTitle,
            summary: r.summary,
            result: r.result,
          };
        });
      const fn = httpsCallable<{ tests: typeof tests }, ReportPayload>(
        functions,
        "generatePersonalityReport",
      );
      const res = await fn({ tests });
      setReport(res.data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      setError("보고서 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setGenerating(false);
    }
  }

  if (loadingResults) {
    return <p className="text-center py-12 text-gray-500">불러오는 중...</p>;
  }

  if (report) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-2xl p-6 mb-6">
          <p className="text-sm text-purple-100 mb-2">📊 종합 성격 보고서</p>
          <h1 className="text-2xl sm:text-3xl font-bold mb-3 leading-snug">
            {report.headline}
          </h1>
          <p className="text-sm text-purple-50 leading-relaxed">{report.summary}</p>
        </div>

        <Section title="핵심 성격 특성">
          {report.coreTraits.split("\n\n").map((p, i) => (
            <p key={i} className="text-gray-700 leading-relaxed mb-3 last:mb-0">{p}</p>
          ))}
        </Section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Section title="강점" tone="green">
            <ul className="space-y-1.5 text-sm text-green-900">
              {report.strengths.map((s, i) => <li key={i}>✓ {s}</li>)}
            </ul>
          </Section>
          <Section title="성장의 방향" tone="amber">
            <ul className="space-y-1.5 text-sm text-amber-900">
              {report.growthAreas.map((s, i) => <li key={i}>→ {s}</li>)}
            </ul>
          </Section>
        </div>

        <Section title="관계 안에서">
          <p className="text-gray-700 leading-relaxed">{report.relationships}</p>
        </Section>
        <Section title="잘 맞는 일과 환경">
          <p className="text-gray-700 leading-relaxed">{report.workEnvironment}</p>
        </Section>
        <Section title="스트레스 패턴과 회복">
          <p className="text-gray-700 leading-relaxed">{report.stressPatterns}</p>
        </Section>
        <Section title="자기 돌봄 권장">
          <p className="text-gray-700 leading-relaxed">{report.selfCare}</p>
        </Section>

        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5 mb-6">
          <p className="text-purple-900 leading-relaxed italic">
            {report.closingNote}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-lg transition"
          >
            {generating ? "다시 생성 중..." : "보고서 다시 생성하기"}
          </button>
          <Link
            href="/profile"
            className="flex-1 px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition text-center"
          >
            내 대시보드로
          </Link>
        </div>
        <p className="text-xs text-gray-500 mt-4 text-center">
          본 보고서는 자가 점검 도구이며 의학적 진단을 대체하지 않습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-2xl p-6 mb-6">
        <div className="text-5xl mb-3">📊</div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">종합 성격 보고서</h1>
        <p className="text-sm text-purple-50 leading-relaxed">
          5가지 검사(성격 4종+직업흥미) 결과를 AI가 통합 분석하여 한 사람의 다면적 프로필로 정리해 드립니다.
          각 검사가 서로 보완·일치되는 지점을 찾아 본인을 더 깊이 이해하실 수 있습니다.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-purple-900">검사 진행 상황</h2>
          <span className="text-sm text-purple-700 font-semibold">
            {completedCount} / {CATALOG.length}
          </span>
        </div>
        <ul className="space-y-2">
          {CATALOG.map((c) => {
            const done = !!latestByType[c.type];
            return (
              <li key={c.type}>
                <Link
                  href={c.href}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                    done
                      ? "bg-green-50 border-green-200 hover:border-green-300"
                      : "bg-white border-gray-200 hover:border-purple-300"
                  }`}
                >
                  <span className="text-2xl">{c.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{c.displayTitle}</p>
                    {done ? (
                      <p className="text-xs text-green-700 mt-0.5">
                        ✓ {latestByType[c.type].summary}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-0.5">아직 진행 전</p>
                    )}
                  </div>
                  {done ? (
                    <span className="text-green-600 text-lg">✓</span>
                  ) : (
                    <span className="text-purple-600 text-sm font-medium">시작하기 →</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {allCompleted ? (
        <>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full px-6 py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-lg rounded-xl shadow-md transition"
          >
            {generating ? "AI가 통합 분석 중... (약 30초)" : "📝 종합 보고서 생성하기"}
          </button>
          {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}
        </>
      ) : (
        <div className="space-y-3">
          <button
            onClick={handleStartGuided}
            disabled={startingGuided}
            className="w-full px-6 py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-lg rounded-xl shadow-md transition"
          >
            {startingGuided
              ? "다음 검사로 이동 중..."
              : completedCount === 0
                ? "🚀 5개 검사 순차 시작하기"
                : `▶ 남은 ${CATALOG.length - completedCount}개 검사 이어서 진행하기`}
          </button>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
            <p className="text-xs text-amber-800 leading-relaxed">
              "순차 시작"을 누르시면 검사를 자동으로 안내해 드립니다. 각 검사가 끝날 때마다 다음 검사 버튼이 보이고, 모두 마치시면 보고서 화면으로 돌아옵니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
  tone = "default",
}: {
  title: string;
  children: React.ReactNode;
  tone?: "default" | "green" | "amber";
}) {
  const toneClass =
    tone === "green"
      ? "bg-green-50 border-green-100"
      : tone === "amber"
        ? "bg-amber-50 border-amber-100"
        : "bg-white border-gray-200";
  const titleColor =
    tone === "green"
      ? "text-green-800"
      : tone === "amber"
        ? "text-amber-800"
        : "text-purple-900";

  return (
    <div className={`${toneClass} border rounded-2xl p-5 mb-4`}>
      <h3 className={`text-sm font-bold mb-3 ${titleColor}`}>{title}</h3>
      {children}
    </div>
  );
}
