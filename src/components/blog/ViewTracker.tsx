"use client";

import { useEffect } from "react";
import { incrementBlogViewIfNew } from "@/lib/blog-views";

/**
 * 마운트 시 블로그 글 조회수를 1 증가시킵니다. 시각 요소 없음.
 */
export default function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    // 약간의 지연으로 미리보기/봇 트래픽 최소화
    const timer = setTimeout(() => {
      incrementBlogViewIfNew(slug);
    }, 1500);
    return () => clearTimeout(timer);
  }, [slug]);

  return null;
}
