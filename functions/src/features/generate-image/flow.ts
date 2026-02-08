import {GenkitInstance} from "../../shared";

// 섹션별 이미지 생성 (Dotprompt 사용)
export async function generateImage(
  ai: GenkitInstance,
  sectionText: string,
): Promise<Buffer | null> {
  try {
    const generateImagePrompt = ai.prompt("generate-image/generateImage");
    const response = await generateImagePrompt({
      sectionText: sectionText.slice(0, 500),
    });

    // media에서 이미지 데이터 추출
    if (response.media?.url) {
      // data:image/png;base64,... 형식에서 base64 데이터 추출
      const base64Match = response.media.url.match(/^data:[^;]+;base64,(.+)$/);
      if (base64Match) {
        return Buffer.from(base64Match[1], "base64");
      }
    }
    return null;
  } catch (err) {
    console.error("이미지 생성 실패:", err);
    return null;
  }
}
