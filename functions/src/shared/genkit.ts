import {genkit} from "genkit";
import {googleAI} from "@genkit-ai/google-genai";

// Genkit 인스턴스 생성 함수 (런타임에 API 키로 초기화)
export function createGenkitInstance(apiKeyValue: string) {
  return genkit({
    plugins: [googleAI({apiKey: apiKeyValue})],
    promptDir: "./lib/features",
  });
}

export type GenkitInstance = ReturnType<typeof createGenkitInstance>;
