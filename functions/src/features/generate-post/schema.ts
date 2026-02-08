import {z} from "zod";

// 포스트 생성 입력 스키마
export const GeneratePostInputSchema = z.object({
  topic: z.string().min(1).describe("블로그 글의 주제"),
});

export type GeneratePostInput = z.infer<typeof GeneratePostInputSchema>;

// 포스트 생성 출력 스키마
export const GeneratePostOutputSchema = z.object({
  title: z.string().describe("생성된 글 제목"),
  content: z.string().describe("마크다운 형식의 글 내용"),
  featuredImage: z.string().describe("대표 이미지 URL"),
  slug: z.string().describe("URL용 슬러그"),
});

export type GeneratePostOutput = z.infer<typeof GeneratePostOutputSchema>;

// 포스트 이미지 생성 입력 스키마
export const GeneratePostImagesInputSchema = z.object({
  content: z.string().describe("마크다운 콘텐츠"),
  slug: z.string().describe("포스트 슬러그"),
});

export type GeneratePostImagesInput = z.infer<typeof GeneratePostImagesInputSchema>;

// 포스트 이미지 생성 출력 스키마
export const GeneratePostImagesOutputSchema = z.object({
  content: z.string().describe("이미지가 삽입된 마크다운 콘텐츠"),
  featuredImage: z.string().describe("대표 이미지 URL"),
});

export type GeneratePostImagesOutput = z.infer<typeof GeneratePostImagesOutputSchema>;

// 포스트 이미지 최종화 입력 스키마
export const FinalizePostImagesInputSchema = z.object({
  content: z.string().describe("마크다운 콘텐츠"),
  slug: z.string().describe("포스트 슬러그"),
});

export type FinalizePostImagesInput = z.infer<typeof FinalizePostImagesInputSchema>;

// 포스트 이미지 최종화 출력 스키마
export const FinalizePostImagesOutputSchema = z.object({
  content: z.string().describe("최종 이미지 URL로 업데이트된 콘텐츠"),
  featuredImage: z.string().describe("대표 이미지 URL"),
});

export type FinalizePostImagesOutput = z.infer<typeof FinalizePostImagesOutputSchema>;
