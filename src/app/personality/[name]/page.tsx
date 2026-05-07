import Big5Test from "@/components/test/Big5Test";
import { TYPES, characterImageUrl } from "@/lib/test/big5/types";
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

  if (meta) {
    return { title: meta.title, description: meta.description };
  }
  return { title: "성격 검사" };
}

export default async function PersonalityPage(props: PageProps) {
  const params = await props.params;
  if (params.name === "big5") return <Big5Test />;

  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold text-gray-900">검사를 찾을 수 없습니다</h1>
    </div>
  );
}
