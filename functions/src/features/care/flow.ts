import {onCall, HttpsError} from "firebase-functions/https";
import {GoogleGenAI} from "@google/genai";
import {apiKey} from "../generate-post/flow";

// 공통 함수 옵션
const CALLABLE_OPTS = {
  secrets: [apiKey],
  timeoutSeconds: 60,
  memory: "512MiB" as const,
  region: "asia-northeast3" as const,
};

interface UserContext {
  recentMood?: number; // 1-5
  recentSleepHours?: number;
  recentSleepQuality?: number; // 1-5
  recentStress?: number; // 1-5
  recentEnergy?: number; // 1-5
  recentNote?: string;
  // 가벼운 검사 요약 (예: "최근 PHQ-9 14점", "Big5 LHHHL")
  recentTestSummary?: string;
}

function buildContextSection(ctx?: UserContext): string {
  if (!ctx) return "";
  const parts: string[] = [];
  if (typeof ctx.recentMood === "number") parts.push(`기분 ${ctx.recentMood}/5`);
  if (typeof ctx.recentSleepHours === "number") parts.push(`수면 ${ctx.recentSleepHours}시간`);
  if (typeof ctx.recentSleepQuality === "number") parts.push(`수면 질 ${ctx.recentSleepQuality}/5`);
  if (typeof ctx.recentStress === "number") parts.push(`스트레스 ${ctx.recentStress}/5`);
  if (typeof ctx.recentEnergy === "number") parts.push(`에너지 ${ctx.recentEnergy}/5`);
  if (ctx.recentNote) parts.push(`사용자 메모: ${ctx.recentNote}`);
  if (ctx.recentTestSummary) parts.push(`최근 검사: ${ctx.recentTestSummary}`);
  if (parts.length === 0) return "";
  return `\n\n[사용자 현재 상태]\n- ${parts.join("\n- ")}\n\n위 상태를 자연스럽게 반영하여 작성하세요. 사용자 상태를 직접 인용하거나 진단하듯 단정짓지 마세요.`;
}

function extractJson(text: string): unknown {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("응답에서 JSON을 찾을 수 없습니다.");
  return JSON.parse(m[0]);
}

const SHARED_VOICE = `[작성 톤]
- 따뜻하지만 가르치지 않는 톤. 정신건강의학과 진료실의 차분한 안내처럼.
- 존댓말(~합니다, ~됩니다). 반말 금지.
- 의학적 진단·약 처방 권유 금지. 도구 자체는 자가 돌봄용이라는 점을 인지하고 작성.
- 진단명·검사명을 안다고 단정하지 마세요. 부드럽게 권유.
- 광고성·과장 금지.`;

// 1. 호흡 가이드
export const generateBreathingGuide = onCall(
  CALLABLE_OPTS,
  async (request) => {
    const ctx = request.data?.context as UserContext | undefined;
    const ai = new GoogleGenAI({apiKey: apiKey.value()});

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `당신은 정신건강 자가 돌봄 도구를 작성합니다. 사용자가 지금 1-3분간 따라할 수 있는 호흡 가이드를 만들어 주세요.

${SHARED_VOICE}

[형식 — 반드시 JSON]
{
  "title": "호흡 가이드 제목 (15자 이내)",
  "intro": "한 문단(2-3문장)으로 이 호흡이 도움이 되는 이유를 부드럽게 안내",
  "technique": "기법 이름 (예: 4-7-8 호흡, 박스 호흡, 횡격막 호흡 등)",
  "steps": [
    {"label":"준비","instruction":"...","seconds":15},
    {"label":"들숨","instruction":"...","seconds":4},
    ...
  ],
  "totalSeconds": 60-180,
  "afterCare": "호흡 후 잠시 머무르며 알아차릴 점 (한 문단)"
}

steps는 6-12개. seconds 합이 totalSeconds와 맞아야 합니다. 사용자가 현재 스트레스 수준이 높으면 더 부드러운 기법을 선택해 주세요.${buildContextSection(ctx)}`,
    });

    const json = extractJson(response.text ?? "");
    return json;
  },
);

// 2. CBT 사고 기록 — 사용자 자동 사고를 입력받아 인지 왜곡 식별·재구성 제안
export const generateThoughtRecord = onCall(
  CALLABLE_OPTS,
  async (request) => {
    const ctx = request.data?.context as UserContext | undefined;
    const situation = (request.data?.situation as string | undefined)?.slice(0, 1000);
    const automaticThought = (request.data?.automaticThought as string | undefined)?.slice(0, 1000);
    const emotion = (request.data?.emotion as string | undefined)?.slice(0, 200);

    if (!situation || !automaticThought) {
      throw new HttpsError("invalid-argument", "상황과 자동 사고를 입력해 주세요.");
    }

    const ai = new GoogleGenAI({apiKey: apiKey.value()});
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `당신은 인지행동치료(CBT) 자가 도구를 작성합니다. 사용자가 입력한 자동 사고를 부드럽게 살펴보고, 인지 왜곡을 식별한 뒤 균형 잡힌 대안 생각을 제안해 주세요.

${SHARED_VOICE}

[사용자 입력]
- 상황: ${situation}
- 자동 사고: ${automaticThought}
- 감정: ${emotion || "표현하지 않음"}

[형식 — 반드시 JSON]
{
  "validation": "사용자의 감정을 먼저 인정하는 한 문단",
  "distortions": [
    {"name":"왜곡 이름(예: 흑백사고, 파국화, 마음 읽기, 개인화 등)","explain":"이 자동 사고에서 어떻게 나타나는지 한 문장"}
  ],
  "questions": ["증거를 점검하는 질문 3-5개"],
  "balancedThought": "기존 사고를 완전히 부정하지 않으면서도 균형을 잡는 대안 생각 2-3문장",
  "smallAction": "지금 5분 안에 해볼 수 있는 작은 행동 하나",
  "gentleNote": "치료가 필요한 수준이라면 진료를 권하는 부드러운 한 줄"
}

distortions는 1-3개로 한정. 사용자를 비난하지 마세요.${buildContextSection(ctx)}`,
    });

    const json = extractJson(response.text ?? "");
    return json;
  },
);

// 3. 감사 일기 프롬프트
export const generateGratitudePrompts = onCall(
  CALLABLE_OPTS,
  async (request) => {
    const ctx = request.data?.context as UserContext | undefined;
    const ai = new GoogleGenAI({apiKey: apiKey.value()});

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `당신은 감사 일기 가이드를 작성합니다. 사용자가 오늘 떠올려볼 만한 감사 프롬프트 3개를 만들어 주세요.

${SHARED_VOICE}

[원칙]
- 진부하거나 일반적인 질문 금지 (예: "감사한 일을 적어보세요")
- 구체적이고 작은 순간에 시선을 두는 질문
- 사용자의 현재 컨디션에 비춰 너무 무거운 주제는 피하기
- 한 질문당 한두 줄, 함께 짧은 길잡이 한 줄

[형식 — 반드시 JSON]
{
  "intro": "오늘 이 감사 연습이 도움이 될 이유 (2문장)",
  "prompts": [
    {"question":"...","hint":"..."},
    {"question":"...","hint":"..."},
    {"question":"...","hint":"..."}
  ],
  "closing": "글을 마치며 떠올릴 한 문장"
}${buildContextSection(ctx)}`,
    });

    const json = extractJson(response.text ?? "");
    return json;
  },
);

// 4. 마음챙김 명상 스크립트
export const generateMindfulnessScript = onCall(
  CALLABLE_OPTS,
  async (request) => {
    const ctx = request.data?.context as UserContext | undefined;
    const duration = Math.max(2, Math.min(15, (request.data?.minutes as number) || 5));
    const focus = (request.data?.focus as string | undefined)?.slice(0, 200) || "지금 이 순간으로 돌아오기";

    const ai = new GoogleGenAI({apiKey: apiKey.value()});
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `당신은 마음챙김 명상 스크립트를 작성합니다. 사용자가 ${duration}분 동안 따라할 수 있는 가이드를 만들어 주세요.

${SHARED_VOICE}

[원칙]
- 호흡, 신체 감각, 소리, 생각 알아차림 중 ${focus}에 맞는 기법 선택
- 사용자가 천천히 따라 읽을 수 있게 짧은 문장으로
- 평가하거나 비판하지 않는 수용적 태도
- ACT(수용전념치료)의 결: 생각·감정을 밀어내지 않고 흘려보내기

[형식 — 반드시 JSON]
{
  "title": "스크립트 제목",
  "duration": ${duration},
  "focus": "주된 초점 (1단어 또는 짧은 구)",
  "segments": [
    {"phase":"열기","text":"...","approxSeconds":30-60},
    {"phase":"본 명상","text":"...","approxSeconds":...},
    {"phase":"마무리","text":"...","approxSeconds":30-60}
  ]
}

segments는 4-7개. 본 명상 단계는 여러 개로 나누어도 좋습니다. text는 한국어 존댓말. ${focus}에 맞는 흐름을 만들어 주세요.${buildContextSection(ctx)}`,
    });

    const json = extractJson(response.text ?? "");
    return json;
  },
);
