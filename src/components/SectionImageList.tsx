"use client";

import { useState, useMemo } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import Image from "next/image";

interface SectionImage {
  sectionTitle: string;
  sectionText: string;
  imageUrl: string;
  imageMarkdown: string;
}

interface SectionImageListProps {
  content: string;
  slug: string;
  onContentUpdate: (content: string) => void;
  onFeaturedImageUpdate: (url: string) => void;
  disabled?: boolean;
}

function parseSectionImages(content: string): SectionImage[] {
  const results: SectionImage[] = [];
  const imageRegex = /!\[([^\]]*)\]\((https:\/\/firebasestorage[^)]+)\)/g;

  // h2 기준으로 섹션 분리
  const lines = content.split("\n");
  const sections: { title: string; startLine: number; text: string }[] = [];
  let currentTitle = "인트로";
  let currentStart = 0;
  let currentLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) {
      if (currentLines.length > 0) {
        sections.push({
          title: currentTitle,
          startLine: currentStart,
          text: currentLines.join("\n"),
        });
      }
      currentTitle = lines[i].replace(/^##\s+/, "");
      currentStart = i;
      currentLines = [lines[i]];
    } else {
      currentLines.push(lines[i]);
    }
  }
  if (currentLines.length > 0) {
    sections.push({
      title: currentTitle,
      startLine: currentStart,
      text: currentLines.join("\n"),
    });
  }

  // 각 섹션에서 이미지 찾기
  for (const section of sections) {
    let match;
    const sectionImageRegex = /!\[([^\]]*)\]\((https:\/\/firebasestorage[^)]+)\)/g;
    while ((match = sectionImageRegex.exec(section.text)) !== null) {
      // 이미지 마크다운을 제외한 섹션 텍스트
      const textWithoutImage = section.text
        .replace(/\n\n!\[[^\]]*\]\([^)]+\)/g, "")
        .trim();

      results.push({
        sectionTitle: section.title,
        sectionText: textWithoutImage,
        imageUrl: match[2],
        imageMarkdown: match[0],
      });
    }
  }

  return results;
}

export default function SectionImageList({
  content,
  slug,
  onContentUpdate,
  onFeaturedImageUpdate,
  disabled = false,
}: SectionImageListProps) {
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);

  const sectionImages = useMemo(() => parseSectionImages(content), [content]);

  if (sectionImages.length === 0) return null;

  async function handleRegenerate(index: number) {
    const section = sectionImages[index];
    setRegeneratingIndex(index);

    try {
      const regenerate = httpsCallable<
        { sectionText: string; slug: string; oldImageUrl: string },
        { imageUrl: string }
      >(functions, "regenerateSectionImage", { timeout: 120_000 });

      const result = await regenerate({
        sectionText: section.sectionText,
        slug,
        oldImageUrl: section.imageUrl,
      });

      const newUrl = result.data.imageUrl;

      // content에서 이전 이미지 URL을 새 URL로 교체
      const updatedContent = content.replace(section.imageUrl, newUrl);
      onContentUpdate(updatedContent);

      // 첫 번째 이미지가 교체됐으면 featuredImage도 업데이트
      if (index === 0) {
        onFeaturedImageUpdate(newUrl);
      }
    } catch (err) {
      console.error("이미지 재생성 실패:", err);
      alert("이미지 재생성에 실패했습니다.");
    } finally {
      setRegeneratingIndex(null);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <label className="block text-sm font-semibold text-gray-700 mb-4">
        섹션별 이미지
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sectionImages.map((section, i) => (
          <div
            key={`${section.imageUrl}-${i}`}
            className="border border-gray-200 rounded-xl overflow-hidden"
          >
            <div className="relative w-full h-40 bg-gray-100">
              {regeneratingIndex === i ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="animate-spin h-6 w-6 text-purple-600"
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
                    <span className="text-xs text-gray-500">생성 중...</span>
                  </div>
                </div>
              ) : (
                <Image
                  src={section.imageUrl}
                  alt={section.sectionTitle}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
              )}
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-gray-700 truncate">
                {section.sectionTitle}
              </p>
              <button
                onClick={() => handleRegenerate(i)}
                disabled={disabled || regeneratingIndex !== null}
                className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
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
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                  />
                </svg>
                재생성
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
