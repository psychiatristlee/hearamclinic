"use client";

import { usePathname } from "next/navigation";
import { soundaryUrlForLegacyPath } from "@/lib/external-tests";

export default function SaveLoginPrompt(_props: {
  message?: string;
  onSignedIn?: () => void;
}) {
  const pathname = usePathname() ?? "/test";
  const targetUrl = soundaryUrlForLegacyPath(pathname);
  void _props;

  return (
    <aside className="mb-6 rounded-2xl border border-purple-100 bg-purple-50 p-5 text-center">
      <p className="font-bold text-purple-900">검사 기록과 변화 추적은 Soundary에서 이용해 주세요</p>
      <p className="mt-1 text-sm leading-relaxed text-gray-600">
        해람에서는 신규 회원가입을 받지 않습니다. 같은 검사를 사운더리로 이동 후 진행할 수 있습니다.
      </p>
      <a
        href={targetUrl}
        className="mt-4 inline-block rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white hover:bg-purple-700"
      >
        사운더리로 이동 후 진행 ↗
      </a>
    </aside>
  );
}
