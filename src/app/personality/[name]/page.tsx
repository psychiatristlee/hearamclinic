import { Suspense } from "react";
import Big5Test from "@/components/test/Big5Test";
import EnneagramTest from "@/components/test/EnneagramTest";
import AttachmentTest from "@/components/test/AttachmentTest";
import RequireAuth from "@/components/auth/RequireAuth";
import { TYPES, characterImageUrl } from "@/lib/test/big5/types";
import {
  TYPES as ENNEA_TYPES,
  characterImageUrl as enneaImageUrl,
} from "@/lib/test/enneagram/types";
import {
  TYPES as ATTACH_TYPES,
  characterImageUrl as attachImageUrl,
  AttachmentTypeCode,
} from "@/lib/test/attachment/types";
import { EnneaType } from "@/lib/test/enneagram/questions";
import type { Metadata } from "next";

const personalityTestMeta: Record<
  string,
  { title: string; description: string }
> = {
  big5: {
    title: "Big 5 성격 검사",
    description:
      "5가지 성격 차원으로 본인의 유형을 자세히 알아보세요. 32개 유형 중 당신은 어떤 사람일까요?",
  },
  enneagram: {
    title: "에니어그램 성격 검사",
    description:
      "9가지 유형으로 본인의 핵심 동기와 두려움을 살펴보세요. 어떤 유형이 당신과 가장 닮았을까요?",
  },
  attachment: {
    title: "애착 유형 검사",
    description:
      "관계 속에서 본인이 어떤 마음의 결로 움직이는지, 불안과 회피 두 차원으로 4개 유형을 살펴보세요.",
  },
};

export async function generateStaticParams() {
  return Object.keys(personalityTestMeta).map((name) => ({ name }));
}

type PageProps = {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ result?: string }>;
};

const VALID_CODE_RE = /^[HL]{5}$/;

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const meta = personalityTestMeta[params.name];

  // 공유된 결과 코드가 있으면 OG에 캐릭터 이미지/유형 노출
  if (params.name === "big5" && searchParams.result && VALID_CODE_RE.test(searchParams.result)) {
    const code = searchParams.result;
    const type = TYPES[code];
    if (type) {
      const title = `${type.name} - Big 5 성격 검사`;
      const description = `${type.tagline} · ${type.summary.slice(0, 120)}`;
      const imageUrl = characterImageUrl(code);
      return {
        title,
        description,
        openGraph: {
          title,
          description,
          images: [{ url: imageUrl, width: 1024, height: 1024, alt: type.name }],
          type: "article",
        },
        twitter: {
          card: "summary_large_image",
          title,
          description,
          images: [imageUrl],
        },
      };
    }
  }

  // 에니어그램 공유 결과
  if (params.name === "enneagram" && searchParams.result && /^[1-9]$/.test(searchParams.result)) {
    const num = parseInt(searchParams.result, 10) as EnneaType;
    const t = ENNEA_TYPES[num];
    if (t) {
      const title = `${num}번. ${t.name} - 에니어그램`;
      const description = `${t.tagline} · ${t.summary.slice(0, 120)}`;
      const imageUrl = enneaImageUrl(num);
      return {
        title,
        description,
        openGraph: {
          title,
          description,
          images: [{ url: imageUrl, width: 1024, height: 1024, alt: t.name }],
          type: "article",
        },
        twitter: {
          card: "summary_large_image",
          title,
          description,
          images: [imageUrl],
        },
      };
    }
  }

  // 애착 유형 공유 결과
  if (
    params.name === "attachment" &&
    searchParams.result &&
    ["secure", "anxious", "avoidant", "disorganized"].includes(searchParams.result)
  ) {
    const code = searchParams.result as AttachmentTypeCode;
    const t = ATTACH_TYPES[code];
    if (t) {
      const title = `${t.name} - 애착 유형 검사`;
      const description = `${t.tagline} · ${t.summary.slice(0, 120)}`;
      const imageUrl = attachImageUrl(code);
      return {
        title,
        description,
        openGraph: {
          title,
          description,
          images: [{ url: imageUrl, width: 1024, height: 1024, alt: t.name }],
          type: "article",
        },
        twitter: {
          card: "summary_large_image",
          title,
          description,
          images: [imageUrl],
        },
      };
    }
  }

  if (meta) {
    return { title: meta.title, description: meta.description };
  }
  return { title: "성격 검사" };
}

function LoadingFallback() {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500">불러오는 중...</p>
    </div>
  );
}

export default async function PersonalityPage(props: PageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  // 공유된 결과 보기는 로그인 없이도 가능 (?result=...)
  const isSharedView =
    searchParams.result &&
    (VALID_CODE_RE.test(searchParams.result) ||
      /^[1-9]$/.test(searchParams.result) ||
      ["secure", "anxious", "avoidant", "disorganized"].includes(searchParams.result));

  function withAuth(child: React.ReactNode) {
    if (isSharedView) return child;
    return (
      <RequireAuth message="검사 결과를 본인 계정에 안전하게 기록하기 위해 로그인이 필요합니다.">
        {child}
      </RequireAuth>
    );
  }

  if (params.name === "big5") {
    return withAuth(
      <Suspense fallback={<LoadingFallback />}>
        <Big5Test />
      </Suspense>,
    );
  }
  if (params.name === "enneagram") {
    return withAuth(
      <Suspense fallback={<LoadingFallback />}>
        <EnneagramTest />
      </Suspense>,
    );
  }
  if (params.name === "attachment") {
    return withAuth(
      <Suspense fallback={<LoadingFallback />}>
        <AttachmentTest />
      </Suspense>,
    );
  }

  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold text-gray-900">검사를 찾을 수 없습니다</h1>
    </div>
  );
}
