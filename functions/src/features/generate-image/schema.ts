import {z} from "zod";

// 이미지 생성 입력 스키마
export const GenerateImageInputSchema = z.object({
  sectionText: z.string().describe("이미지를 생성할 섹션 텍스트"),
});

export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

// 이미지 생성 출력 스키마
export const GenerateImageOutputSchema = z.object({
  imageBuffer: z.instanceof(Buffer).nullable().describe("생성된 이미지 버퍼"),
});

export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;
