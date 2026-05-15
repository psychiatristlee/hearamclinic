"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export interface DailyLog {
  date: string; // YYYY-MM-DD (KST)
  mood: number | null; // 1-5
  sleepHours: number | null; // 0-12
  sleepQuality: number | null; // 1-5
  stress: number | null; // 1-5
  energy: number | null; // 1-5
  note?: string;
}

export interface DailyLogRecord extends DailyLog {
  updatedAt: Date;
}

// KST 기준 오늘 YYYY-MM-DD
export function todayKst(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function saveDailyLog(log: DailyLog): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  try {
    await setDoc(
      doc(db, "users", user.uid, "dailyLogs", log.date),
      {
        ...log,
        updatedAt: Timestamp.now(),
      },
      { merge: true },
    );
    return true;
  } catch (err) {
    console.error("[saveDailyLog] 실패:", err);
    return false;
  }
}

export async function getDailyLog(
  uid: string,
  date: string,
): Promise<DailyLogRecord | null> {
  try {
    const snap = await getDoc(doc(db, "users", uid, "dailyLogs", date));
    if (!snap.exists()) return null;
    const data = snap.data() as DocumentData;
    return {
      date: data.date as string,
      mood: (data.mood as number) ?? null,
      sleepHours: (data.sleepHours as number) ?? null,
      sleepQuality: (data.sleepQuality as number) ?? null,
      stress: (data.stress as number) ?? null,
      energy: (data.energy as number) ?? null,
      note: (data.note as string) ?? "",
      updatedAt: (data.updatedAt as Timestamp).toDate(),
    };
  } catch (err) {
    console.error("[getDailyLog] 실패:", err);
    return null;
  }
}

export async function listRecentDailyLogs(
  uid: string,
  max = 60,
): Promise<DailyLogRecord[]> {
  const q = query(
    collection(db, "users", uid, "dailyLogs"),
    orderBy("date", "desc"),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as DocumentData;
    return {
      date: data.date as string,
      mood: (data.mood as number) ?? null,
      sleepHours: (data.sleepHours as number) ?? null,
      sleepQuality: (data.sleepQuality as number) ?? null,
      stress: (data.stress as number) ?? null,
      energy: (data.energy as number) ?? null,
      note: (data.note as string) ?? "",
      updatedAt: (data.updatedAt as Timestamp).toDate(),
    };
  });
}
