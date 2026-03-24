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

// 블로그 텍스트 생성 (Google Search grounding 적용)
interface TopicOutline {
  intro: string;
  sections: Array<{heading: string; summary: string}>;
}

async function generateBlogText(
  ai: GoogleGenAI,
  topic: string,
  outline?: TopicOutline,
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
    contents: `당신은 정신건강의학과 전문의입니다. 의사의 관점에서 환자분들에게 직접 설명하듯이 정신건강 관련 블로그 글을 작성합니다.
웹 검색을 통해 최신 의학 정보와 근거를 바탕으로 글을 작성하세요.

[절대 금지 사항 - 반드시 지켜야 합니다]
- "해람", "해람정신건강의학과", "해람클리닉", "저희 병원", "저희 의원", "저희 클리닉" 등 특정 병원/의원 이름을 절대 사용하지 마세요. "해람"이라는 단어가 글 어디에도 등장하면 안 됩니다.
- "안녕하세요", "~입니다", "정신건강의학과 전문의입니다" 같은 자기소개나 인사말을 절대 사용하지 마세요.
- "~에서 알려드립니다", "~에서 안내해 드립니다" 같은 표현을 사용하지 마세요.
- "정신과 전문의를 찾아주세요", "전문의와 상담하세요", "의료진과 상의하세요", "전문가의 도움을 받으세요", "전문가에게 상담하세요", "가까운 정신건강의학과를 방문하세요" 등 의료진 상담/방문을 권유하는 문장을 글의 어디에도 절대 넣지 마세요. 글은 정보 전달로 자연스럽게 끝내세요.
- 인트로를 이탤릭(*...*) 한 문단으로 쓰지 마세요. 이것은 절대 금지입니다.
- 참고 문헌 섹션을 추가하지 마세요.
- 각 섹션 마지막 문단을 **볼드**로 강조하지 마세요. 모든 문단은 일반 텍스트로 작성하세요.

[잘못된 인트로 예시 - 이렇게 쓰면 안 됩니다]
❌ "*자신을 더 깊이 이해하고 싶거나, 마음의 어려움으로 전문가의 도움을 받고자 할 때 심리 검사는 중요한 첫걸음이 됩니다. 그중에서도... 해람정신건강의학과에서 알려드립니다.*"
→ 이탤릭 한 문단, 병원 이름 언급, "알려드립니다" 사용 — 모두 금지

[인트로 형식 - 반드시 이 형식을 따르세요]
- 제목(# h1) 바로 아래에 인트로를 작성하세요.
- 인트로는 반드시 3개의 독립된 문단으로 구성하세요. (빈 줄로 구분된 3개 문단)
- 각 문단은 2~3문장으로 작성하세요.
- 인트로에는 이탤릭(*...*) 서식을 절대 사용하지 마세요. 일반 텍스트로만 작성하세요.
- 의사가 환자에게 자연스럽게 설명하는 어조로 작성하세요.

[본문 형식]
- h2(##)로 소제목 3~4개를 만드세요.
- 소제목은 대화형 질문이나 짧은 문장으로 작성하세요.
  예: "스프라바토는 어떻게 개발되게 되었나요?", "스프라바토 치료를 잘 권하지 않는 이유"
- 일부 소제목 아래에는 질문을 좀 더 풀어서 설명하는 부연 문장(2~3줄)을 추가할 수 있습니다.
  예:
  ## 그런데 스프라바토를 왜 사용하는 걸까요?

  그런데 다른 우울증 약도 있는데
  굳이 스프라바토를 왜 사용하는 걸까요?
- 각 소제목 아래에 3~4개 문단을 작성하세요.
- 각 섹션의 마지막 문단을 볼드로 강조하지 마세요. 일반 텍스트로 자연스럽게 마무리하세요.
- 문단과 문단 사이에 반드시 빈 줄을 넣어 간격을 만드세요.
- 의사가 환자에게 직접 설명하는 듯한 자연스럽고 친근한 어조를 사용하세요.
- 마크다운 형식으로 작성하세요.
- 제목(h1)은 첫 줄에 # 으로 작성하세요.
- 참고 문헌 섹션은 추가하지 마세요.
${outlineInstruction}
주제: ${topic}

마크다운 블로그 글을 작성해주세요.`,
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

// Claude를 이용한 블로그 글 교정
async function reviewWithClaude(
  claudeApiKey: string,
  markdown: string,
): Promise<string> {
  const claude = new Anthropic({apiKey: claudeApiKey});
  const response = await claude.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [{
      role: "user",
      content: `아래 블로그 글을 다듬어주세요. 당신의 역할은 AI가 작성한 글을 사람이 쓴 것처럼 간결하고 자연스럽게 만드는 것입니다.

[핵심 목표]
- 간결하게: 불필요한 수식어, 중복 표현, 늘어지는 문장을 줄이기
- 광고 느낌 제거: 과장된 표현, 홍보성 어조, 감탄사 남발 제거
- 자연스럽게: 기계적이고 딱딱한 문장을 사람이 말하듯 자연스럽게
- 의학적 정확성 유지

[삭제 대상]
- "안녕하세요", "~입니다", "전문의입니다" 등 자기소개/인사말
- "전문의와 상담하세요", "의료진과 상의하세요", "전문가의 도움을 받으세요", "가까운 정신건강의학과를 방문하세요" 등 의료진 상담/방문 권유
- "해람", 병원 이름, "저희 병원" 등 병원 관련 언급
- "~하는 것이 중요합니다", "~해야 합니다" 같은 교과서적 마무리 반복

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
    console.log("[generatePost] topic:", topic);
    console.log("[generatePost] outline:", JSON.stringify(outline));

    const ai = new GoogleGenAI({apiKey: apiKey.value()});
    const rawMarkdown = await generateBlogText(ai, topic, outline);

    // Claude로 교정
    console.log("[generatePost] reviewing with Claude...");
    const reviewedMarkdown = await reviewWithClaude(
      anthropicApiKey.value(),
      rawMarkdown,
    );
    console.log("[generatePost] Claude review complete");

    const titleMatch = reviewedMarkdown.match(/^#\s+(.+)$/m);
    const title = titleMatch?.[1] ?? topic;
    const content = reviewedMarkdown.replace(/^#\s+.+\n*/m, "").trimStart();
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
- 첫 부분(인트로)은 반드시 3개의 독립된 문단(빈 줄로 구분)으로 작성하세요. 이탤릭 한 문단으로 쓰면 안 됩니다.
- 인트로에 이탤릭(*...*) 서식을 사용하지 마세요. 일반 텍스트로만 작성하세요.
- 소제목은 대화형 질문이나 짧은 문장으로 작성하세요.
- 일부 소제목 아래에는 질문을 좀 더 풀어서 설명하는 부연 문장을 추가할 수 있습니다.
- 각 섹션의 마지막 문단을 볼드로 강조하지 마세요. 일반 텍스트로 자연스럽게 마무리하세요.
- 문단과 문단 사이에 반드시 빈 줄을 넣어 간격을 만드세요
- 의사가 환자에게 직접 설명하는 듯한 자연스럽고 친근한 어조를 유지하세요
- 제목(h1)은 첫 줄에 # 으로 작성하세요
- 웹 검색을 통해 최신 정보를 반영하세요
- 참고 문헌 섹션은 추가하지 마세요. 기존에 있다면 제거하세요.
- 사용자가 웹에서 사진/이미지를 찾아 넣어달라고 요청하면, 적절한 위치에 이미지 플레이스홀더를 삽입하세요:
  ![이미지 설명](WEB_IMAGE:english search keyword)
  예: ![상담 장면](WEB_IMAGE:therapy counseling session)
- 검색 키워드는 반드시 영어로 작성하세요 (검색 정확도를 위해)
- 이미지 설명은 한국어로 작성하세요
- 각 이미지마다 서로 다른 구체적인 검색 키워드를 사용하세요

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
