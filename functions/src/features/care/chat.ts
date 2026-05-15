import {onCall, HttpsError} from "firebase-functions/https";
import {GoogleGenAI, Content} from "@google/genai";
import {apiKey} from "../generate-post/flow";

// 위기 키워드 (한국어 + 영어 일부)
const CRISIS_PATTERNS: RegExp[] = [
  /자살/i,
  /죽고\s*싶/i,
  /죽어버리/i,
  /죽으려/i,
  /자해/i,
  /목매/i,
  /약\s*먹어/i,
  /수면제\s*많이/i,
  /끝내고\s*싶/i,
  /사라지고\s*싶/i,
  /더는\s*못\s*살/i,
  /살기\s*싫/i,
  /존재할\s*이유/i,
  /해치고\s*싶/i,
  /칼/i,
  /투신/i,
  /뛰어내리/i,
  /\bsuicide\b/i,
  /\bkill myself\b/i,
  /\bself.harm\b/i,
];

function detectCrisis(text: string): boolean {
  return CRISIS_PATTERNS.some((re) => re.test(text));
}

const CRISIS_RESPONSE = `지금 떠올리시는 마음의 무게가 크게 느껴집니다. 먼저 안전한 곳에서 잠시 호흡을 가다듬어 주시기를 부탁드립니다.

지금 도움을 받으실 수 있는 곳입니다.
• 자살예방상담전화 1393 (24시간)
• 정신건강 위기 상담전화 1577-0199 (24시간)
• 청소년 상담전화 1388
• 응급한 상황이라면 119

말씀 한 통, 통화 한 번이 큰 도움이 됩니다. 가까운 사람에게 알리시는 것도 좋습니다. 저는 의료 전문가가 아니어서 지금의 위기를 다 안아 드릴 수는 없지만, 위 전화는 훈련받은 분들이 함께해 주실 겁니다.

이 메시지를 보신 후에도 마음이 계속 무거우시다면, 정신건강의학과 진료를 꼭 받아 보시기를 권합니다.`;

const SYSTEM_PROMPT = `당신은 한국 정신건강의학과 병원에서 제공하는 자가 돌봄 챗봇입니다. 이름은 "해람 동행"입니다. 정식 상담사나 의사가 아니며, 사용자도 그 사실을 압니다.

[당신의 역할]
- 사용자가 마음 속 이야기를 풀어놓을 수 있도록 따뜻하게 듣는 동행자
- 인지행동치료(CBT)와 수용전념치료(ACT)의 결을 자연스럽게 녹여 대화
- 진단·약 처방·치료 지시는 절대 하지 않음
- 필요한 경우 진료실 방문을 부드럽게 권유

[대화 스타일]
- 존댓말(~합니다, ~네요, ~겠어요). 반말 금지.
- 한 번에 한 답변은 짧게(2-4문장). 긴 설교 금지.
- 답변 끝에 자연스러운 질문이나 초대를 1개 정도 포함하여 대화가 이어지게.
- 사용자의 감정을 먼저 비추어 인정 (validation) → 그 후에 부드러운 탐색.
- "당신은 ~한 사람이군요" 같은 단정적 평가 금지.

[CBT 결 — 이렇게 자연스럽게 녹이세요]
- 자동 사고가 나오면 "그 생각이 정말로 그렇다고 느껴지는 부분은 어떤 점이었을까요?" 같은 질문
- 인지 왜곡(흑백 사고, 파국화, 마음 읽기, 개인화 등)이 보이면 진단명을 던지지 말고 "혹시 다른 시선으로 본다면 어떨까요?"처럼 부드럽게
- 행동 활성화 제안: "오늘 5분만 해볼 수 있는 작은 한 가지는 무엇이 있을까요?"

[ACT 결 — 이렇게 자연스럽게 녹이세요]
- 감정이나 생각을 밀어내려 하지 않도록: "그 마음이 그대로 머물러도 괜찮습니다. 곁에 두고 잠시 함께해 볼까요"
- 인지 분리(defusion): "지금 그 생각이 사실이라기보다 마음이 들려주는 한 가지 이야기처럼 들립니다"
- 가치 명료화: "이 어려움을 통과한 후에, 어떤 모습으로 살아가고 싶으세요?"
- 현재 순간 머무름: "지금 이 순간, 몸의 어떤 감각이 느껴지시는지 잠깐 알아차려 보실까요"

[위기 감지 시 — 가장 중요]
- 사용자가 자살·자해·심각한 위기를 표현하면 즉시 위기 자원을 안내해야 합니다:
  • 자살예방상담전화 1393
  • 정신건강 위기 상담전화 1577-0199
  • 응급 시 119
- 위기 표현이 있으면 다른 어떤 CBT/ACT 기법보다 안전 안내가 우선입니다.

[금지 사항]
- 의학적 진단 (예: "당신은 우울증입니다")
- 약 권유 또는 약 종류 언급
- "괜찮아요" 같은 가벼운 위로로 감정을 묵살하기
- 사용자를 가르치려 들기
- 마크다운 형식(**, ##, --) 사용. 일반 텍스트로만 답변.

[진료 안내가 적절한 경우]
- 2주 이상 지속되는 우울 / 일상 기능 저하 / 수면·식욕 큰 변화 / 위기 표현
- 부드럽게: "이 정도의 무게라면 한 번 정신건강의학과 진료를 받아 보시는 것도 도움이 되실 것 같아요. 진료실에서는 더 자세히 살펴봐 드릴 수 있습니다."`;

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export const chatWithCounselor = onCall(
  {
    secrets: [apiKey],
    timeoutSeconds: 60,
    memory: "512MiB",
    region: "asia-northeast3",
  },
  async (request) => {
    const userMessage = (request.data?.message as string | undefined)?.slice(0, 2000)?.trim();
    const history = (request.data?.history as ChatMessage[] | undefined) ?? [];

    if (!userMessage) {
      throw new HttpsError("invalid-argument", "메시지를 입력해 주세요.");
    }

    // 1차 위기 감지 (사용자 메시지 + 최근 3개 메시지)
    const recentText = [
      userMessage,
      ...history.slice(-3).map((m) => m.text),
    ].join(" ");
    const isCrisis = detectCrisis(recentText);

    if (isCrisis) {
      return {
        reply: CRISIS_RESPONSE,
        crisisDetected: true,
      };
    }

    // Gemini 호출
    const ai = new GoogleGenAI({apiKey: apiKey.value()});

    const contents: Content[] = [];
    // 최근 12개 메시지만 유지 (context 관리)
    const recentHistory = history.slice(-12);
    for (const m of recentHistory) {
      contents.push({
        role: m.role,
        parts: [{text: m.text}],
      });
    }
    contents.push({
      role: "user",
      parts: [{text: userMessage}],
    });

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.7,
        },
      });

      const reply = (response.text ?? "").trim();
      if (!reply) {
        throw new Error("빈 응답");
      }

      // 2차 검사: 응답 중에도 위기 신호가 나오는 경우 대비
      const replyCrisis = detectCrisis(reply);

      return {
        reply,
        crisisDetected: replyCrisis,
      };
    } catch (err) {
      console.error("[chatWithCounselor] 실패:", err);
      throw new HttpsError(
        "internal",
        "답변 생성 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      );
    }
  },
);
