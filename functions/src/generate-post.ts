import {onCall, HttpsError} from "firebase-functions/https";
import {defineSecret} from "firebase-functions/params";
import {getStorage} from "firebase-admin/storage";
import {GoogleGenAI, Modality} from "@google/genai";

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

// 블로그 텍스트 생성
async function generateBlogText(
  ai: GoogleGenAI,
  topic: string,
): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `당신은 해람정신건강의학과의 블로그 작성자입니다. 정신건강 관련 블로그 글을 작성합니다.

아래 형식을 반드시 따라주세요:
- 첫 문단은 *이탤릭*으로 주제를 부드럽게 소개
- h2(##)로 소제목 3~4개를 만들고 각 소제목 아래에 2~3개 문단 작성
- 각 섹션의 마지막 문단은 **볼드**로 핵심 내용 강조
- 전문적이지만 친근한 어조 사용
- 마크다운 형식으로 작성
- 제목(h1)은 첫 줄에 # 으로 작성

주제: ${topic}

마크다운 블로그 글을 작성해주세요.`,
  });

  return response.text ?? "";
}

// 섹션별 이미지 생성
async function generateImage(
  ai: GoogleGenAI,
  sectionText: string,
): Promise<Buffer | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `Generate a Korean webtoon style illustration for this mental health blog section.
The image should be warm, comforting, and professional. Use soft pastel colors typical of Korean webtoon art style.
Do NOT include any text or letters in the image.

Section content: ${sectionText.slice(0, 500)}`,
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          return Buffer.from(part.inlineData.data, "base64");
        }
      }
    }
    return null;
  } catch (err) {
    console.error("이미지 생성 실패:", err);
    return null;
  }
}

// 이미지를 Storage에 업로드
async function uploadImage(
  imageBuffer: Buffer,
  postSlug: string,
  index: number,
): Promise<string> {
  const bucket = getStorage().bucket();
  const storagePath =
    `blog-images/generated/${postSlug}/section-${index}.png`;
  const file = bucket.file(storagePath);
  await file.save(imageBuffer, {
    metadata: {contentType: "image/png"},
    public: true,
  });
  return `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
}

export const generatePost = onCall(
  {
    secrets: [apiKey],
    timeoutSeconds: 300,
    memory: "1GiB",
    region: "asia-northeast3",
  },
  async (request) => {
    const topic = request.data?.topic;
    if (!topic || typeof topic !== "string") {
      throw new HttpsError("invalid-argument", "주제를 입력해주세요.");
    }

    const ai = new GoogleGenAI({apiKey: apiKey.value()});

    // 1. 블로그 텍스트 생성
    const rawMarkdown = await generateBlogText(ai, topic);

    // 제목 추출
    const titleMatch = rawMarkdown.match(/^#\s+(.+)$/m);
    const title = titleMatch?.[1] ?? topic;

    // 2. 섹션 분리
    const sections = splitSections(rawMarkdown);

    // 3. 각 섹션에 이미지 생성 및 삽입
    const slug = encodeURIComponent(
      title.replace(/\s+/g, "-").toLowerCase().slice(0, 100),
    );

    const sectionsWithImages: string[] = [];
    // 첫 섹션(인트로)은 이미지 없이 추가
    if (sections.length > 0) {
      sectionsWithImages.push(sections[0]);
    }

    // h2 섹션들에 이미지 생성
    for (let i = 1; i < sections.length; i++) {
      const section = sections[i];
      const imageBuffer = await generateImage(ai, section);

      if (imageBuffer) {
        const imageUrl = await uploadImage(imageBuffer, slug, i);
        sectionsWithImages.push(section + `\n\n![](${imageUrl})`);
      } else {
        sectionsWithImages.push(section);
      }
    }

    const finalMarkdown = sectionsWithImages.join("\n\n");

    // 첫 번째 이미지를 featuredImage로 사용
    const firstImageMatch = finalMarkdown.match(
      /!\[.*?\]\((https:\/\/storage\.googleapis\.com\/[^)]+)\)/,
    );
    const featuredImage = firstImageMatch?.[1] ?? "";

    return {
      title,
      content: finalMarkdown,
      featuredImage,
      slug,
    };
  },
);
