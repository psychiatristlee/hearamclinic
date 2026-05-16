"use client";

import { useState } from "react";
import {
  BREATHING_PRESETS,
  findBreathingPreset,
  type BreathingPreset,
} from "@/lib/care/breathing-presets";
import { savePracticeSession } from "@/lib/care";

export default function BreathingPage() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const selected: BreathingPreset | null = selectedSlug
    ? findBreathingPreset(selectedSlug) ?? null
    : null;

  function handleSelect(slug: string) {
    setSelectedSlug(slug);
    const preset = findBreathingPreset(slug);
    if (preset) {
      savePracticeSession("breathing", { slug }, {
        title: preset.title,
        technique: preset.technique,
        totalSeconds: preset.totalSeconds,
      });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBack() {
    setSelectedSlug(null);
  }

  if (selected) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={handleBack}
          className="text-sm text-purple-600 hover:underline mb-4"
        >
          ← 다른 호흡 가이드 보기
        </button>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6 mb-6">
          <p className="text-xs text-purple-600 font-medium mb-1">
            {selected.technique} · 약 {Math.round((selected.totalSeconds / 60) * 10) / 10}분
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-purple-900 mb-3">
            {selected.emoji} {selected.title}
          </h1>
          <p className="text-gray-700 leading-relaxed">{selected.intro}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-5">
          <h2 className="text-lg font-bold text-purple-900 mb-4">함께 따라하기</h2>
          <ol className="space-y-3">
            {selected.steps.map((step, i) => (
              <li key={i} className="flex gap-3 items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-purple-800">
                      {step.label}
                    </span>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {step.seconds}초
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{step.instruction}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-5">
          <h3 className="text-sm font-bold text-emerald-800 mb-2">호흡 후</h3>
          <p className="text-sm text-emerald-900 leading-relaxed">
            {selected.afterCare}
          </p>
        </div>

        <button
          onClick={handleBack}
          className="w-full px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition"
        >
          다른 호흡 가이드 고르기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-purple-900 mb-2">🌬 호흡 가이드</h1>
      <p className="text-gray-600 mb-6">
        상황에 맞는 호흡 기법을 골라 1분 안팎으로 따라해 보세요.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {BREATHING_PRESETS.map((p) => (
          <button
            key={p.slug}
            onClick={() => handleSelect(p.slug)}
            className="group text-left bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg hover:border-purple-300 transition"
          >
            <div className="flex items-start gap-3 mb-2">
              <span className="text-3xl">{p.emoji}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 transition">
                  {p.title}
                </h3>
                <p className="text-xs text-gray-500">{p.tagline}</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-2 leading-relaxed line-clamp-2">
              {p.intro}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {p.recommendedFor.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-6 text-center">
        호흡 가이드는 자가 돌봄을 위한 보조 도구입니다. 만성적인 불안이나 호흡 곤란이 있으시면 진료를 받아 보시기를 권합니다.
      </p>
    </div>
  );
}
