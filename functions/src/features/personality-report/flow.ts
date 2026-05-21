import {onCall, HttpsError} from "firebase-functions/https";
import {GoogleGenAI} from "@google/genai";
import {apiKey} from "../generate-post/flow";

interface TestSummary {
  type: string; // big5, enneagram, attachment, disc
  displayTitle: string;
  summary: string; // 짧은 결과 요약 (예: "감성 지휘자 (HHHHH)")
  result: Record<string, unknown>;
}

export const generatePersonalityReport = onCall(
  {
    secrets: [apiKey],
    timeoutSeconds: 120,
    memory: "512MiB",
    region: "asia-northeast3",
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    }
    const tests = request.data?.tests as TestSummary[] | undefined;
    if (!tests || tests.length === 0) {
      throw new HttpsError("invalid-argument", "검사 결과가 필요합니다.");
    }

    const ai = new GoogleGenAI({apiKey: apiKey.value()});

    // 사용자 검사 결과를 텍스트로 정리
    const blocks = tests.map((t) => {
      const detail = JSON.stringify(t.result, null, 2);
      return `=== ${t.displayTitle} ===
요약: ${t.summary}
상세: ${detail}`;
    }).join("\n\n");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `당신은 정신건강의학과 임상 심리 분야의 전문가이며, 여러 성격 검사 결과를 통합 해석하는 보고서를 작성합니다.

[사용자의 검사 결과]
${blocks}

[보고서 작성 지침]
- 따뜻하고 전문적인 어조의 한국어 존댓말로 작성하세요. 단정적·판단적 표현 금지.
- 진단(예: "당신은 우울증입니다")이나 의학적 처방 금지.
- 4개 검사가 서로 보완·일치·대조되는 지점을 발견하여 한 사람의 다면적 프로필로 통합 해석하세요.
- 각 섹션은 2-4문장. 전체 분량은 적당히. 진료실에서 한 번에 읽을 수 있을 정도.
- 마크다운 형식 금지. 일반 텍스트만.

[반드시 아래 JSON 형식으로만 응답]
{
  "headline": "이 사람을 한 문장으로 요약 (20자 내외, 시적이면서 정확하게)",
  "summary": "전체적인 인상 한 문단 (3-4문장)",
  "coreTraits": "핵심 성격 특성 통합 분석 (2-3문단, 검사들이 어떻게 일치하거나 보완되는지 짚어서)",
  "strengths": ["핵심 강점 3-5가지 (각 한 줄)"],
  "growthAreas": ["성장의 방향 3-5가지 (각 한 줄, 비난하지 않는 톤)"],
  "relationships": "관계 안에서의 모습 (애착·DISC·에니어그램 결과 종합, 2-3문장)",
  "workEnvironment": "잘 맞는 일과 환경 (Big5의 성실성·개방성·외향성, DISC 종합, 2-3문장)",
  "stressPatterns": "스트레스 상황에서의 패턴과 회복 방법 (에니어그램의 스트레스 결, Big5의 정서 민감성, 애착 종합)",
  "selfCare": "본인을 더 자라게 하는 자기 돌봄 권장 (구체적이고 부드럽게, 2-3문장)",
  "closingNote": "마지막 따뜻한 한 문단 (이 사람을 응원하는 마음을 담아서)"
}`,
    });

    const text = (response.text ?? "").trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new HttpsError("internal", "보고서 생성에 실패했습니다.");
    }
    try {
      const json = JSON.parse(jsonMatch[0]);
      return json;
    } catch {
      throw new HttpsError("internal", "보고서 형식 파싱에 실패했습니다.");
    }
  },
);
