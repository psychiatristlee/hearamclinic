import { Suspense } from "react";
import Big5Test from "@/components/test/Big5Test";
import EnneagramTest from "@/components/test/EnneagramTest";
import AttachmentTest from "@/components/test/AttachmentTest";
import DiscTest from "@/components/test/DiscTest";
import RiasecTest from "@/components/test/RiasecTest";
import SchemaTest from "@/components/test/SchemaTest";
import {
  DOMAINS as SCHEMA_DOMAINS,
  domainImageUrl as schemaDomainImageUrl,
} from "@/lib/test/schema/types";
import type { SchemaDomain } from "@/lib/test/schema/questions";
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
  { title: string; description: string; keywords: string[] }
> = {
  big5: {
    title: "무료 Big 5 성격 검사 (5요인) — 32유형 진단 + 캐릭터",
    description:
      "정신건강의학과에서 제공하는 무료 Big 5(빅5) 성격 검사. 개방성·성실성·외향성·친화성·정서 민감성 5가지 차원으로 32유형 중 본인 유형을 진단하고 캐릭터와 함께 자세히 안내합니다.",
    keywords: ["Big 5 검사", "빅5 성격 검사", "5요인 성격 검사", "무료 성격 검사", "성격 유형 검사", "OCEAN 검사"],
  },
  enneagram: {
    title: "무료 에니어그램 검사 — 9가지 유형 + 날개 분석",
    description:
      "무료 에니어그램 성격 검사. 9가지 유형으로 본인의 핵심 동기와 두려움을 살펴보고, 양옆의 날개 유형까지 분석해 드립니다. 캐릭터 이미지와 자세한 해석 포함.",
    keywords: ["에니어그램 검사", "에니어그램 9가지 유형", "에니어그램 날개", "무료 에니어그램", "성격 유형 검사"],
  },
  attachment: {
    title: "무료 성인 애착 유형 검사 — 안정·헌신·자립·양가 4유형",
    description:
      "관계 속에서 본인의 마음 결을 살펴보는 무료 성인 애착 유형 검사. 불안과 회피 두 차원으로 안정·헌신·자립·양가 4유형을 진단하고 사분면 차트로 위치를 확인합니다.",
    keywords: ["애착 유형 검사", "성인 애착 유형", "애착 유형 테스트", "무료 애착 검사", "안정형 불안형 회피형"],
  },
  disc: {
    title: "무료 DISC 성격 검사 — 주도·사교·안정·신중 4유형",
    description:
      "정신건강의학과에서 제공하는 무료 DISC 행동 유형 검사. 주도(D)·사교(I)·안정(S)·신중(C) 4가지 행동 양식으로 본인의 패턴과 강점·관계·업무 환경 적합도를 분석합니다.",
    keywords: ["DISC 검사", "DISC 행동 유형", "DISC 무료 검사", "DISC 성격 검사", "행동 유형 검사", "직장 성격 검사"],
  },
  riasec: {
    title: "무료 직업흥미 검사 (RIASEC) — 홀랜드 6유형 진로적성",
    description:
      "정신건강의학과에서 제공하는 무료 직업흥미 검사. 홀랜드(Holland) RIASEC 6유형(현실·탐구·예술·사회·진취·관습)으로 나에게 맞는 직업과 진로 방향, 잘 맞는 일 환경을 분석합니다.",
    keywords: ["직업흥미검사", "홀랜드 검사", "RIASEC 검사", "진로적성검사", "무료 직업검사", "진로 검사", "적성 검사"],
  },
  schema: {
    title: "무료 심리도식 검사 — 18가지 도식·5영역으로 마음의 무늬 읽기",
    description:
      "어린 시절에 만들어져 지금도 되풀이되는 마음의 무늬(심리도식)를 살펴보는 무료 심리도식 검사. 제프리 영의 심리도식치료 이론에 기반해 18가지 초기부적응도식과 5개 도식영역으로 나를 부드럽게 이해합니다. 특정 상용·공인 검사와 무관한 자체 개발 무료 검사.",
    keywords: ["심리도식 검사", "스키마 검사", "초기부적응도식", "심리도식치료", "스키마 테라피", "어린시절 상처", "무의식 패턴 검사", "무료 심리검사", "성격 상처 검사"],
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

  // 심리도식 공유 결과 (대표 영역 DR/IA/IL/OD/OI)
  if (
    params.name === "schema" &&
    searchParams.result &&
    ["DR", "IA", "IL", "OD", "OI"].includes(searchParams.result)
  ) {
    const code = searchParams.result as SchemaDomain;
    const d = SCHEMA_DOMAINS[code];
    if (d) {
      const title = `${d.name} - 심리도식 검사`;
      const description = `${d.tagline}`;
      const imageUrl = schemaDomainImageUrl(code);
      return {
        title,
        description,
        openGraph: {
          title,
          description,
          images: [{ url: imageUrl, width: 1024, height: 1024, alt: d.name }],
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
    const canonical = `https://hearam.kr/personality/${params.name}`;
    return {
      title: meta.title,
      description: meta.description,
      keywords: meta.keywords,
      alternates: { canonical },
      openGraph: {
        title: meta.title,
        description: meta.description,
        url: canonical,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: meta.title,
        description: meta.description,
      },
    };
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

function quizJsonLd(name: string) {
  const meta = personalityTestMeta[name];
  if (!meta) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: meta.title,
    description: meta.description,
    url: `https://hearam.kr/personality/${name}`,
    provider: {
      "@type": "MedicalOrganization",
      name: "해람정신건강의학과",
      url: "https://hearam.kr",
    },
    educationalLevel: "general",
    inLanguage: "ko",
    isAccessibleForFree: true,
  };
}

export default async function PersonalityPage(props: PageProps) {
  const params = await props.params;
  const ld = quizJsonLd(params.name);
  const schemaScript = ld ? (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
    />
  ) : null;

  if (params.name === "big5") {
    return (
      <>
        {schemaScript}
        <Suspense fallback={<LoadingFallback />}>
          <Big5Test />
        </Suspense>
      </>
    );
  }
  if (params.name === "enneagram") {
    return (
      <>
        {schemaScript}
        <Suspense fallback={<LoadingFallback />}>
          <EnneagramTest />
        </Suspense>
      </>
    );
  }
  if (params.name === "attachment") {
    return (
      <>
        {schemaScript}
        <Suspense fallback={<LoadingFallback />}>
          <AttachmentTest />
        </Suspense>
      </>
    );
  }
  if (params.name === "disc") {
    return (
      <>
        {schemaScript}
        <Suspense fallback={<LoadingFallback />}>
          <DiscTest />
        </Suspense>
      </>
    );
  }
  if (params.name === "riasec") {
    return (
      <>
        {schemaScript}
        <Suspense fallback={<LoadingFallback />}>
          <RiasecTest />
        </Suspense>
      </>
    );
  }
  if (params.name === "schema") {
    return (
      <>
        {schemaScript}
        <Suspense fallback={<LoadingFallback />}>
          <SchemaTest />
        </Suspense>
      </>
    );
  }

  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold text-gray-900">검사를 찾을 수 없습니다</h1>
    </div>
  );
}
