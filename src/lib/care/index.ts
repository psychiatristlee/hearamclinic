"use client";

import {
  addDoc,
  collection,
  Timestamp,
} from "firebase/firestore";
import { db, auth, functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";
import { getDailyLog, todayKst } from "@/lib/daily-log";

export type CareToolType =
  | "breathing"
  | "thought-record"
  | "gratitude"
  | "mindfulness"
  | "chat";

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export interface ChatResponse {
  reply: string;
  crisisDetected: boolean;
}

export async function callChat(
  message: string,
  history: ChatMessage[],
): Promise<ChatResponse> {
  const fn = httpsCallable<
    { message: string; history: ChatMessage[] },
    ChatResponse
  >(functions, "chatWithCounselor");
  const res = await fn({ message, history });
  return res.data;
}

export interface CareUserContext {
  recentMood?: number;
  recentSleepHours?: number;
  recentSleepQuality?: number;
  recentStress?: number;
  recentEnergy?: number;
  recentNote?: string;
  recentTestSummary?: string;
}

// 로그인된 사용자라면 오늘 daily log를 가져와 context 구성
export async function buildUserContext(): Promise<CareUserContext> {
  const user = auth.currentUser;
  if (!user) return {};
  const log = await getDailyLog(user.uid, todayKst());
  if (!log) return {};
  return {
    recentMood: log.mood ?? undefined,
    recentSleepHours: log.sleepHours ?? undefined,
    recentSleepQuality: log.sleepQuality ?? undefined,
    recentStress: log.stress ?? undefined,
    recentEnergy: log.energy ?? undefined,
    recentNote: log.note?.slice(0, 200),
  };
}

export async function savePracticeSession(
  type: CareToolType,
  input: Record<string, unknown>,
  output: unknown,
): Promise<{ saved: boolean }> {
  const user = auth.currentUser;
  if (!user) return { saved: false };
  try {
    await addDoc(collection(db, "users", user.uid, "practiceSessions"), {
      type,
      input,
      output,
      createdAt: Timestamp.now(),
    });
    return { saved: true };
  } catch (err) {
    console.error("[savePracticeSession] 실패:", err);
    return { saved: false };
  }
}

// Cloud Functions 호출 헬퍼
export async function callBreathingGuide(
  context: CareUserContext,
): Promise<BreathingResult> {
  const fn = httpsCallable<{ context: CareUserContext }, BreathingResult>(
    functions,
    "generateBreathingGuide",
  );
  const res = await fn({ context });
  return res.data;
}

export async function callThoughtRecord(input: {
  situation: string;
  automaticThought: string;
  emotion?: string;
  context?: CareUserContext;
}): Promise<ThoughtRecordResult> {
  const fn = httpsCallable<typeof input, ThoughtRecordResult>(
    functions,
    "generateThoughtRecord",
  );
  const res = await fn(input);
  return res.data;
}

export async function callGratitudePrompts(
  context: CareUserContext,
): Promise<GratitudeResult> {
  const fn = httpsCallable<{ context: CareUserContext }, GratitudeResult>(
    functions,
    "generateGratitudePrompts",
  );
  const res = await fn({ context });
  return res.data;
}

export async function callMindfulnessScript(input: {
  minutes: number;
  focus: string;
  context?: CareUserContext;
}): Promise<MindfulnessResult> {
  const fn = httpsCallable<typeof input, MindfulnessResult>(
    functions,
    "generateMindfulnessScript",
  );
  const res = await fn(input);
  return res.data;
}

// === 응답 타입들 ===
export interface BreathingStep {
  label: string;
  instruction: string;
  seconds: number;
}
export interface BreathingResult {
  title: string;
  intro: string;
  technique: string;
  steps: BreathingStep[];
  totalSeconds: number;
  afterCare: string;
}

export interface ThoughtRecordResult {
  validation: string;
  distortions: Array<{ name: string; explain: string }>;
  questions: string[];
  balancedThought: string;
  smallAction: string;
  gentleNote: string;
}

export interface GratitudeResult {
  intro: string;
  prompts: Array<{ question: string; hint: string }>;
  closing: string;
}

export interface MindfulnessSegment {
  phase: string;
  text: string;
  approxSeconds: number;
}
export interface MindfulnessResult {
  title: string;
  duration: number;
  focus: string;
  segments: MindfulnessSegment[];
}
