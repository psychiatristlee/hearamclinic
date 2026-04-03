import {onCall, HttpsError} from "firebase-functions/https";
import {defineSecret} from "firebase-functions/params";
import {getStorage} from "firebase-admin/storage";
import {getFirestore} from "firebase-admin/firestore";
import {GoogleGenAI} from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import {randomUUID} from "crypto";
import {verifyEditorAuth, createGenkitInstance, uploadImage, makeDownloadUrl} from "../../shared";
import {generateImage} from "../generate-image";

const apiKey = defineSecret("GOOGLE_GENAI_API_KEY");
const anthropicApiKey = defineSecret("ANTHROPIC_API_KEY");

// WEB_IMAGE 플레이스홀더를 Google Search grounding으로 찾은 이미지 URL로 교체
async function resolveWebImages(
  text: string, ai: GoogleGenAI,
): Promise<string> {
  const regex = /!\[([^\]]*)\]\(WEB_IMAGE:([^)]+)\)/g;
  const matches = [...text.matchAll(regex)];
  if (matches.length === 0) return text;

  let result = text;
  for (const [full, alt, query] of matches) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Find a copyright-free image for: "${query.trim()}"

Search the web for a freely usable image from sources like Unsplash, Pixabay, Pexels, or Wikimedia Commons.

IMPORTANT:
- Return a DIRECT image file URL that can be embedded in a webpage
- The image must be free to use (Creative Commons, Public Domain, or similar free license)
- Prefer high-quality, landscape-oriented images

Respond ONLY in this exact JSON format:
{"url":"<direct image URL>","source":"<source name>","license":"<license>"}

If no image found: {"url":"","source":"","license":""}`,
        config: {
          tools: [{googleSearch: {}}],
        },
      });

      const responseText = (response.text ?? "").trim();
      const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        if (data.url) {
          const credit = `*출처: ${data.source || "Web"}` +
            `${data.license ? ` (${data.license})` : ""}*`;
          result = result.replace(
            full, `![${alt}](${data.url})\n\n${credit}`,
          );
          continue;
        }
      }
    } catch (err) {
      console.error("[resolveWebImages] grounding search error:", err);
    }
    // 실패 시 플레이스홀더 제거
    result = result.replace(full, "");
  }
  return result;
}

// 마크다운을 h2 섹션으로 분리
function splitSections(markdown: string): string[] {
  const lines = markdown.split("\n");
  const sections: string[] = [];
  let current = "";

  for (const line of lines) {
    if (line.startsWith("## ") && current.trim()) {
      sections.push(current.trim());
      current = line + "\n";
    } else {
      current += line + "\n";
    }
  }
  if (current.trim()) {
    sections.push(current.trim());
  }
  return sections;
}

// 채팅 메시지 타입
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// 블로그 텍스트 생성 (Google Search grounding 적용)
interface TopicOutline {
  intro: string;
  sections: Array<{heading: string; summary: string}>;
}

async function generateBlogText(
  ai: GoogleGenAI,
  topic: string,
  outline?: TopicOutline,
  chatHistory?: ChatMessage[],
): Promise<string> {
  let outlineInstruction = "";
  console.log("[generateBlogText] outline received:", !!outline, outline?.sections?.length, "sections");
  if (outline) {
    const sectionList = outline.sections
      .map((s, i) => `  ${i + 1}. ## ${s.heading}\n     → ${s.summary}`)
      .join("\n");
    outlineInstruction = `
[글 구성 - 이 구성을 반드시 그대로 따르세요. 소제목을 변경하거나 빠뜨리면 안 됩니다]
- 인트로: ${outline.intro}
- 본문 소제목과 각 섹션에서 다룰 내용:
${sectionList}

중요: 위 소제목(heading)을 그대로 h2로 사용하세요. 소제목을 임의로 바꾸지 마세요.
각 섹션의 summary에 적힌 핵심 내용을 반드시 포함하여 3~4개 문단으로 풍부하게 작성하세요.
`;
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `당신은 정신건강의학과 전문의가 운영하는 블로그의 글을 작성합니다.
웹 검색을 통해 최신 의학 정보와 근거를 바탕으로 글을 작성하세요.

★★★ 가장 중요한 규칙: 반드시 존댓말(합니다체)로 작성하세요 ★★★
- 모든 문장을 "~합니다", "~됩니다", "~입니다", "~있습니다", "~했습니다", "~보였습니다" 등으로 끝내세요.
- "~한다", "~된다", "~이다", "~있다", "~했다", "~낮았고", "~보였다", "~나타났다" 같은 반말(해라체/평서형) 종결어미는 절대 사용 금지입니다.
- 글 전체에서 단 한 문장도 반말이 있으면 안 됩니다. 작성 후 모든 문장의 종결어미를 다시 확인하세요.

[어조와 문체]
- 진료실에서 환자에게 차분하게 설명하는 어조로 작성하세요.
- 간결하게 쓰세요. 같은 말을 반복하거나 늘어뜨리지 마세요.

[절대 금지]
- "해람", "해람정신건강의학과", "저희 병원/의원/클리닉" 등 특정 병원 이름 금지.
- "안녕하세요", "전문의입니다" 같은 인사말/자기소개 금지.
- "전문의와 상담하세요", "전문가의 도움을 받으세요", "가까운 정신건강의학과를 방문하세요" 등 상담/방문 권유 금지.
- 이탤릭(*...*), 볼드(**...**) 강조 금지. 모든 문단은 일반 텍스트.
- 참고 문헌 섹션 금지.
- 외부 이미지나 사진을 삽입하지 마세요. 텍스트만 작성하세요.

[인트로 형식]
- 제목(# h1) 바로 아래에 인트로 2문단을 작성하세요.
- 인사말이나 자기소개 없이 바로 주제로 들어가세요.
- 자연스럽게 "진료실에서 이런 이야기를 자주 듣습니다" 또는 "최근 ~라는 질문을 많이 받습니다" 같은 식으로 시작하면 좋습니다.
- 각 문단은 2~3문장. 짧고 핵심만.

[본문 형식]
- h2(##)로 소제목 3~4개.
- 소제목은 대화형 질문이나 짧은 문장으로. 예: "그런데 왜 약을 먹어야 하나요?"
- 각 소제목 아래에 2~3개 문단, 각 문단은 2~3문장.
- 글 전체가 모바일에서 읽기 편한 분량이어야 합니다. 너무 길게 쓰지 마세요.
- 문단과 문단 사이에 빈 줄을 넣으세요.
- 마크다운 형식. 제목(h1)은 첫 줄에 #.
- 참고 문헌 섹션은 추가하지 마세요.
${outlineInstruction}
${chatHistory && chatHistory.length > 0 ? `
[사전 토론 내용 - 이 토론에서 다뤄진 핵심 내용과 관점을 글에 반영하세요]
${chatHistory.map((m) => `${m.role === "user" ? "사용자" : "AI"}: ${m.content}`).join("\n\n")}

위 토론에서 논의된 핵심 포인트, 사용자가 관심을 보인 부분, 합의된 관점을 블로그 글에 자연스럽게 녹여내세요.
` : ""}
주제: ${topic}

마크다운 블로그 글을 작성해주세요. 다시 한번 강조: 모든 문장을 존댓말(~합니다, ~됩니다)로 끝내세요.`,
    config: {
      tools: [{googleSearch: {}}],
    },
  });

  return response.text ?? "";
}

// 블로그 주제 추천 (Google Search grounding)
export const suggestTopics = onCall(
  {
    secrets: [apiKey],
    timeoutSeconds: 60,
    memory: "512MiB",
    region: "asia-northeast3",
  },
  async (request) => {
    verifyEditorAuth(request);

    const previousTopics = (request.data as {previousTopics?: string[]})
      ?.previousTopics ?? [];

    // Firestore에서 최근 50개 블로그 제목 조회
    const db = getFirestore();
    const recentPostsSnap = await db.collection("posts")
      .orderBy("date", "desc")
      .limit(50)
      .select("title")
      .get();
    const existingTitles = recentPostsSnap.docs.map((d) => d.data().title as string);

    // 기존 블로그 제목 + 이번 세션에서 이미 추천된 주제 합산
    const allExcluded = [...new Set([...existingTitles, ...previousTopics])];

    const excludeClause = allExcluded.length > 0
      ? `\n\n중요: 다음은 이미 작성되었거나 추천된 주제들입니다. 이와 동일하거나 유사한 주제는 절대 추천하지 마세요. 완전히 다른 새로운 주제를 추천하세요:\n${allExcluded.map((t) => `- ${t}`).join("\n")}`
      : "";

    const ai = new GoogleGenAI({apiKey: apiKey.value()});
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `당신은 정신건강의학과 전문의이자 블로그 운영자입니다.
웹 검색을 통해 현재 사람들이 가장 관심을 갖고 있는 정신건강 관련 주제를 파악하세요.

다음 기준으로 블로그 글 주제 3개를 추천해주세요:
- 최근 뉴스, SNS, 검색 트렌드에서 화제가 되는 정신건강 관련 주제
- 일반인이 궁금해할 만한 정신건강 정보
- 정신건강의학과 전문의가 설명하면 도움이 될 주제

각 주제에 대해:
1. title: 구체적인 블로그 글 제목 (클릭하고 싶게 만드는 제목)
2. reason: 왜 지금 이 주제가 유용한지 한 줄 설명
3. outline: 블로그 글의 구체적인 구성 (인트로 요약 + h2 소제목 3~4개와 각 소제목별 다룰 핵심 내용 1~2줄)
${excludeClause}
반드시 아래 JSON 배열 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요:
[{"title":"제목1","reason":"이유1","outline":{"intro":"인트로에서 다룰 내용 요약","sections":[{"heading":"소제목1","summary":"이 섹션에서 다룰 핵심 내용"},{"heading":"소제목2","summary":"이 섹션에서 다룰 핵심 내용"},{"heading":"소제목3","summary":"이 섹션에서 다룰 핵심 내용"}]}},{"title":"제목2","reason":"이유2","outline":{"intro":"...","sections":[...]}},{"title":"제목3","reason":"이유3","outline":{"intro":"...","sections":[...]}}]`,
      config: {
        tools: [{googleSearch: {}}],
      },
    });

    const text = (response.text ?? "").trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new HttpsError("internal", "주제 추천 결과를 파싱할 수 없습니다.");
    }

    const topics = JSON.parse(jsonMatch[0]) as Array<{
      title: string;
      reason: string;
      outline: {
        intro: string;
        sections: Array<{heading: string; summary: string}>;
      };
    }>;
    return {topics: topics.slice(0, 3)};
  },
);

// 주제 토론 채팅
export const chatAboutTopic = onCall(
  {
    secrets: [apiKey],
    timeoutSeconds: 120,
    memory: "512MiB",
    region: "asia-northeast3",
  },
  async (request) => {
    verifyEditorAuth(request);

    const message = request.data?.message;
    const history = request.data?.history as ChatMessage[] | undefined;

    if (!message || typeof message !== "string") {
      throw new HttpsError("invalid-argument", "메시지를 입력해주세요.");
    }

    const ai = new GoogleGenAI({apiKey: apiKey.value()});

    // 이전 대화 기록을 포함한 컨텍스트 구성
    const historyContext = history && history.length > 0
      ? history.map((m) =>
        `${m.role === "user" ? "사용자" : "AI"}: ${m.content}`
      ).join("\n\n") + "\n\n"
      : "";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `당신은 정신건강의학과 전문의입니다. 사용자(동료 의사 또는 블로그 작성자)와 블로그 글 주제에 대해 토론하고 있습니다.

웹 검색을 통해 최신 의학 정보를 바탕으로 답변하세요.

역할:
- 주제에 대한 의학적 관점, 최신 연구, 임상 경험을 공유하세요
- 블로그 글에 포함하면 좋을 포인트를 제안하세요
- 사용자의 질문에 구체적으로 답변하세요
- 간결하고 핵심적으로 답변하세요 (3~5문단 이내)
- 토론이므로 마크다운 형식이 아닌 자연스러운 대화체로 답변하세요

${historyContext}사용자: ${message}`,
      config: {
        tools: [{googleSearch: {}}],
      },
    });

    return {reply: response.text ?? ""};
  },
);

// Claude를 이용한 블로그 글 교정
async function reviewWithClaude(
  claudeApiKey: string,
  markdown: string,
): Promise<string> {
  const claude = new Anthropic({apiKey: claudeApiKey});
  const response = await claude.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    system: `당신은 한국어 블로그 글 교정 전문가입니다. 가장 중요한 임무는 모든 문장을 존댓말(합니다체)로 통일하는 것입니다.

반말 → 존댓말 변환 규칙:
- "~한다" → "~합니다", "~된다" → "~됩니다", "~이다" → "~입니다"
- "~있다" → "~있습니다", "~없다" → "~없습니다"
- "~했다" → "~했습니다", "~됐다" → "~됐습니다"
- "~보였다" → "~보였습니다", "~나타났다" → "~나타났습니다"
- "~낮았고" → "~낮았으며", "~높았고" → "~높았으며"
- "~적다" → "~적습니다", "~크다" → "~큽니다", "~많다" → "~많습니다"
- "~않는다" → "~않습니다", "~아니다" → "~아닙니다"
- "~였다" → "~였습니다", "~같다" → "~같습니다"
- 문장 중간의 연결어미(~하며, ~하고, ~되어, ~인데 등)는 그대로 두되, 문장 끝 종결어미만 존댓말로 변환하세요.

출력에 반말 종결어미가 단 하나라도 남아있으면 실패입니다.`,
    messages: [{
      role: "user",
      content: `아래 블로그 글을 다듬어주세요.

[1단계 - 존댓말 변환 (최우선)]
모든 문장의 종결어미를 확인하고 반말(해라체)을 존댓말(합니다체)로 변환하세요.
예시:
- "체중 증가 부담이 현저히 적다." → "체중 증가 부담이 현저히 적습니다."
- "다르게 나타난다." → "다르게 나타납니다."
- "일으키는 건 아니다." → "일으키는 것은 아닙니다."
- "체중 감소를 보였다." → "체중 감소를 보였습니다."

[2단계 - 문체 다듬기]
- 간결하게: 불필요한 수식어, 중복 표현, 늘어지는 문장을 과감히 삭제
- 분량 줄이기: 글이 너무 길면 각 섹션을 2~3문단으로 줄이세요
- 광고 느낌 제거: 과장된 표현, 홍보성 어조 제거
- 자연스럽게: 기계적이고 딱딱한 문장을 사람이 말하듯 자연스럽게
- 의학적 정확성 유지

[삭제 대상]
- "안녕하세요", "전문의입니다" 등 자기소개/인사말
- "전문의와 상담하세요", "전문가의 도움을 받으세요", "가까운 정신건강의학과를 방문하세요" 등 상담/방문 권유
- "해람", 병원 이름, "저희 병원" 등 병원 관련 언급
- "~하는 것이 중요합니다", "~해야 합니다" 같은 교과서적 마무리 반복
- 외부 이미지 마크다운 (![...](...)) — 출처 표기 포함해서 모두 삭제

[반드시 지킬 것]
- 마크다운 구조(h1, h2, 문단 구분) 그대로 유지
- 소제목(h2) 변경 금지
- 핵심 정보나 의미 변경 금지
- 교정된 마크다운만 출력, 다른 설명 금지

${markdown}`,
    }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  return text.trim();
}

// 텍스트만 생성 (이미지 없음)
export const generatePost = onCall(
  {
    secrets: [apiKey, anthropicApiKey],
    timeoutSeconds: 300,
    memory: "1GiB",
    region: "asia-northeast3",
  },
  async (request) => {
    verifyEditorAuth(request);

    const topic = request.data?.topic;
    if (!topic || typeof topic !== "string") {
      throw new HttpsError("invalid-argument", "주제를 입력해주세요.");
    }
    const outline = request.data?.outline as TopicOutline | undefined;
    const chatHistory = request.data?.chatHistory as ChatMessage[] | undefined;
    console.log("[generatePost] topic:", topic);
    console.log("[generatePost] outline:", JSON.stringify(outline));
    console.log("[generatePost] chatHistory:", chatHistory?.length ?? 0, "messages");

    const ai = new GoogleGenAI({apiKey: apiKey.value()});
    const rawMarkdown = await generateBlogText(ai, topic, outline, chatHistory);

    // Claude로 교정
    console.log("[generatePost] reviewing with Claude...");
    const reviewedMarkdown = await reviewWithClaude(
      anthropicApiKey.value(),
      rawMarkdown,
    );
    console.log("[generatePost] Claude review complete");

    // 외부 이미지 마크다운 강제 제거 (Gemini/Claude가 남긴 경우 대비)
    const cleanedMarkdown = reviewedMarkdown
      .replace(/!\[[^\]]*\]\(https?:\/\/[^)]+\)\n*/g, "")
      .replace(/\n*\*출처:[^*]*\*/g, "");

    const titleMatch = cleanedMarkdown.match(/^#\s+(.+)$/m);
    const title = titleMatch?.[1] ?? topic;
    const content = cleanedMarkdown.replace(/^#\s+.+\n*/m, "").trimStart();
    const slug = title
      .replace(/\s+/g, "-")
      .toLowerCase()
      .replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100);

    return {
      title,
      content,
      featuredImage: "",
      slug,
    };
  },
);

// 기존 블로그 글 수정 (지시사항 기반)
async function editBlogText(
  ai: GoogleGenAI,
  existingContent: string,
  instructions: string,
): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `당신은 정신건강의학과 전문의입니다. 의사의 관점에서 환자분들에게 직접 설명하듯이 블로그 글을 수정합니다.
아래 기존 블로그 글을 사용자의 수정 지시사항에 따라 수정해주세요.

중요: "해람", "해람정신건강의학과", "저희 병원", "저희 의원", "저희 클리닉" 등 특정 병원/의원을 절대 언급하지 마세요. "해람"이라는 단어가 글 어디에도 등장하면 안 됩니다. "~에서 알려드립니다" 같은 표현도 금지입니다.

규칙:
- 기존 글의 형식(마크다운, h2 소제목 구조)을 유지하세요
- 수정 지시사항에 해당하는 부분만 변경하고, 나머지는 최대한 보존하세요
- 존댓말(~합니다, ~됩니다)을 사용하세요. 반말(~한다, ~된다) 금지.
- 인트로에 인사말/자기소개 없이 바로 주제로 시작하세요
- 이탤릭, 볼드 서식 금지. 일반 텍스트만.
- 문단과 문단 사이에 빈 줄을 넣으세요
- 의사가 환자에게 설명하는 듯한 자연스러운 어조
- 제목(h1)은 첫 줄에 #
- 웹 검색을 통해 최신 정보를 반영하세요
- 참고 문헌 섹션, 외부 이미지 삽입 금지
- 글이 너무 길면 줄이세요. 간결하게.

기존 글:
${existingContent}

수정 지시사항:
${instructions}

수정된 마크다운 블로그 글을 작성해주세요.`,
    config: {
      tools: [{googleSearch: {}}],
    },
  });

  return response.text ?? "";
}

// 기존 글 수정 함수
export const editPost = onCall(
  {
    secrets: [apiKey],
    timeoutSeconds: 300,
    memory: "1GiB",
    region: "asia-northeast3",
  },
  async (request) => {
    verifyEditorAuth(request);

    const existingContent = request.data?.content;
    const title = request.data?.title;
    const instructions = request.data?.instructions;

    if (!existingContent || typeof existingContent !== "string") {
      throw new HttpsError("invalid-argument", "기존 콘텐츠가 필요합니다.");
    }
    if (!instructions || typeof instructions !== "string") {
      throw new HttpsError("invalid-argument", "수정 지시사항을 입력해주세요.");
    }

    const ai = new GoogleGenAI({apiKey: apiKey.value()});
    const fullContent = title ? `# ${title}\n\n${existingContent}` : existingContent;
    const rawMarkdown = await editBlogText(ai, fullContent, instructions);

    const titleMatch = rawMarkdown.match(/^#\s+(.+)$/m);
    const newTitle = titleMatch?.[1] ?? title ?? "";
    let content = rawMarkdown.replace(/^#\s+.+\n*/m, "").trimStart();

    // WEB_IMAGE 플레이스홀더를 Google Search grounding으로 찾은 이미지로 교체
    content = await resolveWebImages(content, ai);

    return {
      title: newTitle,
      content,
    };
  },
);

// 이미지 별도 생성 (각 문단 뒤에 삽입)
export const generatePostImages = onCall(
  {
    secrets: [apiKey],
    timeoutSeconds: 300,
    memory: "1GiB",
    region: "asia-northeast3",
  },
  async (request) => {
    verifyEditorAuth(request);

    const userId = request.auth!.uid;
    const content = request.data?.content;
    const slug = request.data?.slug;
    if (!content || typeof content !== "string") {
      throw new HttpsError("invalid-argument", "콘텐츠가 필요합니다.");
    }
    if (!slug || typeof slug !== "string") {
      throw new HttpsError("invalid-argument", "slug이 필요합니다.");
    }

    // 기존 임시 이미지 삭제 (재생성 시)
    const bucket = getStorage().bucket();
    const [existingFiles] = await bucket.getFiles({prefix: `blog-images/posts/${slug}/`});
    for (const file of existingFiles) {
      try {
        await file.delete();
        console.log("[generatePostImages] 기존 이미지 삭제:", file.name);
      } catch (err) {
        console.error("[generatePostImages] 기존 이미지 삭제 실패:", file.name, err);
      }
    }

    const genkitAi = createGenkitInstance(apiKey.value());
    // 기존 이미지 마크다운 모두 제거 후 섹션 분리
    const cleanedContent = content.replace(/\n\n!\[[^\]]*\]\([^)]+\)/g, "");
    const sections = splitSections(cleanedContent);

    const sectionsWithImages: string[] = [];
    let imageIndex = 0;

    // 첫 섹션(인트로)에도 이미지 생성
    if (sections.length > 0) {
      const introBuffer = await generateImage(genkitAi, sections[0]);
      if (introBuffer) {
        imageIndex++;
        const introUrl = await uploadImage(introBuffer, userId, slug, imageIndex);
        sectionsWithImages.push(sections[0] + `\n\n![](${introUrl})`);
      } else {
        sectionsWithImages.push(sections[0]);
      }
    }

    // h2 섹션들: 소제목 1개당 이미지 1개 생성 (섹션 끝에 배치)
    for (let i = 1; i < sections.length; i++) {
      const section = sections[i];
      // "참고 문헌/참고 자료" 섹션은 이미지 생성 건너뛰기
      if (
        section.startsWith("## 참고 문헌") ||
        section.startsWith("## 참고 자료")
      ) {
        sectionsWithImages.push(section);
        continue;
      }

      const imageBuffer = await generateImage(genkitAi, section);
      if (imageBuffer) {
        imageIndex++;
        const imageUrl = await uploadImage(imageBuffer, userId, slug, imageIndex);
        sectionsWithImages.push(section + `\n\n![](${imageUrl})`);
      } else {
        sectionsWithImages.push(section);
      }
    }

    const finalMarkdown = sectionsWithImages.join("\n\n");

    const firstImageMatch = finalMarkdown.match(
      /https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^\s"<>)]+\?alt=media&token=[a-f0-9-]+/,
    );
    const featuredImage = firstImageMatch?.[0] ?? "";

    return {
      content: finalMarkdown,
      featuredImage,
    };
  },
);

// 개별 섹션 이미지 재생성
export const regenerateSectionImage = onCall(
  {
    secrets: [apiKey],
    timeoutSeconds: 120,
    memory: "1GiB",
    region: "asia-northeast3",
  },
  async (request) => {
    verifyEditorAuth(request);

    const sectionText = request.data?.sectionText;
    const slug = request.data?.slug;
    const oldImageUrl = request.data?.oldImageUrl;

    if (!sectionText || typeof sectionText !== "string") {
      throw new HttpsError("invalid-argument", "섹션 텍스트가 필요합니다.");
    }
    if (!slug || typeof slug !== "string") {
      throw new HttpsError("invalid-argument", "slug이 필요합니다.");
    }

    // 기존 이미지 삭제
    if (oldImageUrl && typeof oldImageUrl === "string") {
      try {
        const bucket = getStorage().bucket();
        const pathMatch = oldImageUrl.match(
          /\/o\/([^?]+)\?/,
        );
        if (pathMatch) {
          const storagePath = decodeURIComponent(pathMatch[1]);
          await bucket.file(storagePath).delete();
          console.log("[regenerateSectionImage] 기존 이미지 삭제:", storagePath);
        }
      } catch (err) {
        console.error("[regenerateSectionImage] 기존 이미지 삭제 실패:", err);
      }
    }

    // 새 이미지 생성
    const genkitAi = createGenkitInstance(apiKey.value());
    const imageBuffer = await generateImage(genkitAi, sectionText);
    if (!imageBuffer) {
      throw new HttpsError("internal", "이미지 생성에 실패했습니다.");
    }

    // 고유 이름으로 업로드
    const bucket = getStorage().bucket();
    const storagePath = `blog-images/posts/${slug}/section-${randomUUID()}.png`;
    const downloadToken = randomUUID();
    const file = bucket.file(storagePath);
    await file.save(imageBuffer, {
      metadata: {
        contentType: "image/png",
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
    });

    const imageUrl = makeDownloadUrl(bucket.name, storagePath, downloadToken);
    return {imageUrl};
  },
);

// 저장 시 임시 이미지를 최종 경로로 이동 (temp/ → blog-images/posts/)
export const finalizePostImages = onCall(
  {
    timeoutSeconds: 120,
    memory: "512MiB",
    region: "asia-northeast3",
  },
  async (request) => {
    verifyEditorAuth(request);

    const userId = request.auth!.uid;
    const content = request.data?.content;
    const slug = request.data?.slug;
    if (!content || typeof content !== "string") {
      throw new HttpsError("invalid-argument", "콘텐츠가 필요합니다.");
    }
    if (!slug || typeof slug !== "string") {
      throw new HttpsError("invalid-argument", "slug이 필요합니다.");
    }

    const bucket = getStorage().bucket();
    let updatedContent = content;

    // temp/{userId}/{slug}/ 하위의 모든 파일 나열
    console.log("[finalizePostImages] userId:", userId);
    console.log("[finalizePostImages] slug:", slug);
    console.log("[finalizePostImages] prefix:", `temp/${userId}/${slug}/`);
    const [files] = await bucket.getFiles({prefix: `temp/${userId}/${slug}/`});
    console.log("[finalizePostImages] found files:", files.length, files.map((f) => f.name));

    for (const file of files) {
      const tempPath = file.name; // e.g. "temp/userId/slug/section-1.png"
      // temp/userId/slug/... → blog-images/posts/slug/...
      const finalPath = tempPath.replace(
        new RegExp(`^temp/${userId}/`),
        "blog-images/posts/",
      );
      const finalFile = bucket.file(finalPath);

      try {
        // 새 토큰으로 최종 경로에 복사
        const downloadToken = randomUUID();
        await file.copy(finalFile);
        await finalFile.setMetadata({
          metadata: {
            firebaseStorageDownloadTokens: downloadToken,
          },
        });

        const finalUrl = makeDownloadUrl(
          bucket.name, finalPath, downloadToken,
        );

        // 콘텐츠에서 이 파일의 temp URL을 찾아 교체
        const urlEncodedPath = encodeURIComponent(tempPath);
        const escapedPath = urlEncodedPath.replace(/[.*+?^${}()|[\]\\%]/g, "\\$&");
        const tempUrlRegex = new RegExp(
          `https://firebasestorage\\.googleapis\\.com/v0/b/[^/]+/o/${escapedPath}\\?[^)\\s]*`,
          "g",
        );
        console.log("[finalizePostImages] searching for:", urlEncodedPath);
        console.log("[finalizePostImages] replacing with:", finalUrl);
        const beforeLen = updatedContent.length;
        updatedContent = updatedContent.replace(tempUrlRegex, finalUrl);
        console.log("[finalizePostImages] replaced:", beforeLen !== updatedContent.length);

        // 임시 파일 삭제
        await file.delete();
      } catch (err) {
        console.error(`이미지 이동 실패: ${tempPath}`, err);
      }
    }

    // featuredImage 추출
    const firstImageMatch = updatedContent.match(
      /https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^\s"<>)]+\?alt=media&token=[a-f0-9-]+/,
    );
    const featuredImage = firstImageMatch?.[0] ?? "";

    return {
      content: updatedContent,
      featuredImage,
    };
  },
);
