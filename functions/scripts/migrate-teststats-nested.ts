/**
 * testStats 문서의 통짜 필드명("metrics.X.count" 리터럴)을 중첩 맵으로 마이그레이션.
 * (기존 트리거가 set+merge에 점 표기를 써서 경로가 아닌 필드명으로 저장된 버그 복구)
 *
 * - 이미 중첩된 metrics 값이 있으면 flat 값을 합산해 병합
 * - 완료 후 문서를 중첩 구조로 전체 교체(set, merge 없음) → flat 키 제거
 *
 * 실행: cd functions && GOOGLE_APPLICATION_CREDENTIALS=... npx tsx scripts/migrate-teststats-nested.ts
 */
import {initializeApp, applicationDefault} from "firebase-admin/app";
import {getFirestore, Timestamp} from "firebase-admin/firestore";

initializeApp({credential: applicationDefault(), projectId: "hearamclinic-ef507"});

interface Agg { count: number; sum: number; sumSq: number }

async function run() {
  const db = getFirestore();
  const snap = await db.collection("testStats").get();
  console.log(`testStats 문서 ${snap.size}개`);

  for (const doc of snap.docs) {
    const data = doc.data() as Record<string, unknown>;
    const metrics: Record<string, Agg> = {};

    // 1) 이미 중첩된 metrics 반영
    const nested = data.metrics as Record<string, Partial<Agg>> | undefined;
    if (nested && typeof nested === "object") {
      for (const [k, v] of Object.entries(nested)) {
        metrics[k] = {
          count: Number(v?.count ?? 0),
          sum: Number(v?.sum ?? 0),
          sumSq: Number(v?.sumSq ?? 0),
        };
      }
    }

    // 2) flat 리터럴 키("metrics.X.field") 합산
    let flatCount = 0;
    for (const [key, value] of Object.entries(data)) {
      const m = key.match(/^metrics\.(.+)\.(count|sum|sumSq)$/);
      if (!m || typeof value !== "number") continue;
      flatCount++;
      const [, metricKey, field] = m;
      if (!metrics[metricKey]) metrics[metricKey] = {count: 0, sum: 0, sumSq: 0};
      metrics[metricKey][field as keyof Agg] += value;
    }

    if (flatCount === 0 && nested) {
      console.log(`  ${doc.id}: 이미 정상(중첩만 존재), 건너뜀`);
      continue;
    }

    await doc.ref.set({
      type: (data.type as string) ?? doc.id,
      lastUpdated: Timestamp.now(),
      metrics,
    });
    console.log(
      `  ✓ ${doc.id}: flat ${flatCount}필드 → 중첩 metrics ${Object.keys(metrics).length}개 (` +
      Object.entries(metrics).map(([k, v]) => `${k}:n${v.count}`).join(", ") + ")",
    );
  }
  console.log("마이그레이션 완료");
}

run().catch((e) => { console.error(e); process.exit(1); });
