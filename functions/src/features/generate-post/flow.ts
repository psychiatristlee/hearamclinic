import {onCall, HttpsError} from "firebase-functions/https";
import {defineSecret} from "firebase-functions/params";
import {getStorage} from "firebase-admin/storage";
import {GoogleGenAI} from "@google/genai";
import {randomUUID} from "crypto";
import {verifyEditorAuth, createGenkitInstance, uploadImage, makeDownloadUrl} from "../../shared";
import {generateImage} from "../generate-image";

const apiKey = defineSecret("GOOGLE_GENAI_API_KEY");

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
    contents: `당신은 해람정신건강의학과의 블로그 작성자입니다. 정신건강 관련 블로그 글을 작성합니다.
웹 검색을 통해 최신 의학 정보와 근거를 바탕으로 글을 작성하세요.

아래 형식을 반드시 따라주세요:
- 첫 문단은 *이탤릭*으로 주제를 부드럽게 소개
- h2(##)로 소제목 3~4개를 만들고 각 소제목 아래에 2~3개 문단 작성
- 각 섹션의 마지막 문단은 **볼드**로 핵심 내용 강조
- 전문적이지만 친근한 어조 사용
- 마크다운 형식으로 작성
- 제목(h1)은 첫 줄에 # 으로 작성
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
    const slug = encodeURIComponent(
      title.replace(/\s+/g, "-").toLowerCase().slice(0, 100),
    );

    return {
      title,
      content: rawMarkdown,
      featuredImage: "",
      slug,
    };
  },
);

// 이미지 별도 생성 (각 h2 섹션 하단에 삽입)
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
    const [existingFiles] = await bucket.getFiles({prefix: `temp/${userId}/${slug}/`});
    for (const file of existingFiles) {
      try {
        await file.delete();
        console.log("[generatePostImages] 기존 이미지 삭제:", file.name);
      } catch (err) {
        console.error("[generatePostImages] 기존 이미지 삭제 실패:", file.name, err);
      }
    }

    const genkitAi = createGenkitInstance(apiKey.value());
    const sections = splitSections(content);

    const sectionsWithImages: string[] = [];
    // 첫 섹션(인트로)은 이미지 없이 추가
    if (sections.length > 0) {
      sectionsWithImages.push(sections[0]);
    }

    // h2 섹션들에 이미지 생성
    for (let i = 1; i < sections.length; i++) {
      let section = sections[i];
      // "참고 문헌/참고 자료" 섹션은 이미지 생성 건너뛰기
      if (
        section.startsWith("## 참고 문헌") ||
        section.startsWith("## 참고 자료")
      ) {
        sectionsWithImages.push(section);
        continue;
      }

      // 이미 이미지가 있으면 제거 (재생성 대비)
      section = section.replace(/\n\n!\[[^\]]*\]\([^)]+\)$/, "");

      const imageBuffer = await generateImage(genkitAi, section);
      if (imageBuffer) {
        const imageUrl = await uploadImage(imageBuffer, userId, slug, i);
        sectionsWithImages.push(section + `\n\n![](${imageUrl})`);
      } else {
        sectionsWithImages.push(section);
      }
    }

    const finalMarkdown = sectionsWithImages.join("\n\n");

    const firstImageMatch = finalMarkdown.match(
      /!\[.*?\]\((https:\/\/firebasestorage\.googleapis\.com\/[^)]+)\)/,
    );
    const featuredImage = firstImageMatch?.[1] ?? "";

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
        const urlEncodedPath = tempPath.replace(/\//g, "%2F");
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
      /!\[.*?\]\((https:\/\/firebasestorage\.googleapis\.com\/[^)]+)\)/,
    );
    const featuredImage = firstImageMatch?.[1] ?? "";

    return {
      content: updatedContent,
      featuredImage,
    };
  },
);
