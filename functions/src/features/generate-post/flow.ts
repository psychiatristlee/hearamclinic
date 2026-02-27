import {onCall, HttpsError} from "firebase-functions/https";
import {defineSecret} from "firebase-functions/params";
import {getStorage} from "firebase-admin/storage";
import {GoogleGenAI} from "@google/genai";
import {randomUUID} from "crypto";
import {verifyEditorAuth, createGenkitInstance, uploadImage, makeDownloadUrl} from "../../shared";
import {generateImage} from "../generate-image";

const apiKey = defineSecret("GOOGLE_GENAI_API_KEY");

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
async function generateBlogText(
  ai: GoogleGenAI,
  topic: string,
): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `당신은 정신건강 전문 블로그 작성자입니다. 정신건강 관련 블로그 글을 작성합니다.
웹 검색을 통해 최신 의학 정보와 근거를 바탕으로 글을 작성하세요.

[절대 금지 사항 - 반드시 지켜야 합니다]
- "해람", "해람정신건강의학과", "해람클리닉", "안녕하세요, ~입니다", "저희 병원", "저희 의원", "저희 클리닉" 등 특정 병원/의원 이름이나 인사말을 절대 사용하지 마세요. "해람"이라는 단어가 글 어디에도 등장하면 안 됩니다.
- "~에서 알려드립니다", "~에서 안내해 드립니다" 같은 표현을 사용하지 마세요.
- 인트로를 이탤릭(*...*) 한 문단으로 쓰지 마세요. 이것은 절대 금지입니다.

[잘못된 인트로 예시 - 이렇게 쓰면 안 됩니다]
❌ "*자신을 더 깊이 이해하고 싶거나, 마음의 어려움으로 전문가의 도움을 받고자 할 때 심리 검사는 중요한 첫걸음이 됩니다. 그중에서도... 해람정신건강의학과에서 알려드립니다.*"
→ 이탤릭 한 문단, 병원 이름 언급, "알려드립니다" 사용 — 모두 금지

[인트로 형식 - 반드시 이 형식을 따르세요]
- 제목(# h1) 바로 아래에 인트로를 작성하세요.
- 인트로는 반드시 3개의 독립된 문단으로 구성하세요. (빈 줄로 구분된 3개 문단)
- 각 문단은 2~3문장으로 작성하세요.
- 인트로에는 이탤릭(*...*) 서식을 절대 사용하지 마세요. 일반 텍스트로만 작성하세요.
- 인트로는 주제에 대한 정보를 자연스럽게 설명하는 방식으로 작성하세요.

[본문 형식]
- h2(##)로 소제목 3~4개를 만들고 각 소제목 아래에 2~3개 문단 작성
- 각 섹션의 마지막 문단은 **볼드**로 핵심 내용 강조
- 문단과 문단 사이에 반드시 빈 줄을 넣어 간격을 만드세요
- 전문적이지만 친근한 어조 사용
- 마크다운 형식으로 작성
- 제목(h1)은 첫 줄에 # 으로 작성

[참고 문헌]
- 글 마지막에 반드시 "## 참고 문헌" 섹션을 추가하세요
- 참고 문헌은 실제 검색 결과를 기반으로 논문, 기관 자료, 의학 정보 사이트 등을 포함하세요
- 각 참고 문헌은 마크다운 링크 형식으로 작성: - [출처 제목](URL)
- 참고 문헌은 최소 3개 이상 포함하세요

주제: ${topic}

마크다운 블로그 글을 작성해주세요.`,
    config: {
      tools: [{googleSearch: {}}],
    },
  });

  let text = response.text ?? "";

  // grounding metadata에서 추가 참고 문헌 추출
  const groundingChunks =
    response.candidates?.[0]?.groundingMetadata?.groundingChunks;

  // AI 텍스트에서 이미 포함된 URL 추출
  const existingUrls = new Set<string>();
  const urlRegex = /\[.*?\]\((https?:\/\/[^)]+)\)/g;
  let match;
  while ((match = urlRegex.exec(text)) !== null) {
    existingUrls.add(match[1]);
  }

  // grounding metadata에서 중복되지 않는 추가 참고 문헌 수집
  if (groundingChunks && groundingChunks.length > 0) {
    const additionalRefs: string[] = [];

    for (const chunk of groundingChunks) {
      const uri = chunk.web?.uri;
      const title = chunk.web?.title;
      if (uri && !existingUrls.has(uri)) {
        existingUrls.add(uri);
        additionalRefs.push(`- [${title || uri}](${uri})`);
      }
    }

    if (additionalRefs.length > 0) {
      // AI 텍스트에 "참고 문헌" 섹션이 이미 있으면 그 아래에 추가
      const refSectionRegex = /## 참고 문헌\s*\n/;
      if (refSectionRegex.test(text)) {
        text = text.trimEnd() + "\n" + additionalRefs.join("\n");
      } else {
        // 없으면 새로 생성
        text =
          text.trimEnd() +
          "\n\n---\n\n## 참고 문헌\n\n" +
          additionalRefs.join("\n");
      }
    }
  }

  return text;
}

// 텍스트만 생성 (이미지 없음)
export const generatePost = onCall(
  {
    secrets: [apiKey],
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

    const ai = new GoogleGenAI({apiKey: apiKey.value()});
    const rawMarkdown = await generateBlogText(ai, topic);

    const titleMatch = rawMarkdown.match(/^#\s+(.+)$/m);
    const title = titleMatch?.[1] ?? topic;
    // 제목(h1)을 content에서 제거 (title 필드에 별도 저장되므로 중복 방지)
    const content = rawMarkdown.replace(/^#\s+.+\n*/m, "").trimStart();
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
    contents: `당신은 정신건강 전문 블로그 작성자입니다.
아래 기존 블로그 글을 사용자의 수정 지시사항에 따라 수정해주세요.

중요: "해람", "해람정신건강의학과", "저희 병원", "저희 의원", "저희 클리닉" 등 특정 병원/의원을 절대 언급하지 마세요. "해람"이라는 단어가 글 어디에도 등장하면 안 됩니다. "~에서 알려드립니다" 같은 표현도 금지입니다.

규칙:
- 기존 글의 형식(마크다운, h2 소제목 구조)을 유지하세요
- 수정 지시사항에 해당하는 부분만 변경하고, 나머지는 최대한 보존하세요
- 첫 부분(인트로)은 반드시 3개의 독립된 문단(빈 줄로 구분)으로 작성하세요. 이탤릭 한 문단으로 쓰면 안 됩니다.
- 인트로에 이탤릭(*...*) 서식을 사용하지 마세요. 일반 텍스트로만 작성하세요.
- 문단과 문단 사이에 반드시 빈 줄을 넣어 간격을 만드세요
- 전문적이지만 친근한 어조를 유지하세요
- 제목(h1)은 첫 줄에 # 으로 작성하세요
- 웹 검색을 통해 최신 정보를 반영하세요
- "## 참고 문헌" 섹션을 유지하거나 업데이트하세요
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

  let text = response.text ?? "";

  const groundingChunks =
    response.candidates?.[0]?.groundingMetadata?.groundingChunks;

  const existingUrls = new Set<string>();
  const urlRegex = /\[.*?\]\((https?:\/\/[^)]+)\)/g;
  let match;
  while ((match = urlRegex.exec(text)) !== null) {
    existingUrls.add(match[1]);
  }

  if (groundingChunks && groundingChunks.length > 0) {
    const additionalRefs: string[] = [];
    for (const chunk of groundingChunks) {
      const uri = chunk.web?.uri;
      const title = chunk.web?.title;
      if (uri && !existingUrls.has(uri)) {
        existingUrls.add(uri);
        additionalRefs.push(`- [${title || uri}](${uri})`);
      }
    }
    if (additionalRefs.length > 0) {
      const refSectionRegex = /## 참고 문헌\s*\n/;
      if (refSectionRegex.test(text)) {
        text = text.trimEnd() + "\n" + additionalRefs.join("\n");
      } else {
        text =
          text.trimEnd() +
          "\n\n---\n\n## 참고 문헌\n\n" +
          additionalRefs.join("\n");
      }
    }
  }

  return text;
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
