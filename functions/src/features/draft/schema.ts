import {z} from "zod";

// 임시 저장 입력 스키마
export const SaveDraftInputSchema = z.object({
  title: z.string().min(1).describe("글 제목"),
  content: z.string().optional().describe("글 내용"),
  slug: z.string().optional().describe("URL 슬러그"),
  featuredImage: z.string().optional().describe("대표 이미지 URL"),
  topic: z.string().optional().describe("주제"),
});

export type SaveDraftInput = z.infer<typeof SaveDraftInputSchema>;

// 임시 저장 출력 스키마
export const SaveDraftOutputSchema = z.object({
  success: z.boolean().describe("저장 성공 여부"),
});

export type SaveDraftOutput = z.infer<typeof SaveDraftOutputSchema>;

// 임시 저장 불러오기 출력 스키마
export const LoadDraftOutputSchema = z.object({
  exists: z.boolean().describe("임시 저장 존재 여부"),
  title: z.string().optional().describe("글 제목"),
  content: z.string().optional().describe("글 내용"),
  slug: z.string().optional().describe("URL 슬러그"),
  featuredImage: z.string().optional().describe("대표 이미지 URL"),
  topic: z.string().optional().describe("주제"),
  updatedAt: z.string().nullable().optional().describe("마지막 수정 시간"),
});

export type LoadDraftOutput = z.infer<typeof LoadDraftOutputSchema>;

// 임시 저장 삭제 출력 스키마
export const DeleteDraftOutputSchema = z.object({
  success: z.boolean().describe("삭제 성공 여부"),
});

export type DeleteDraftOutput = z.infer<typeof DeleteDraftOutputSchema>;
