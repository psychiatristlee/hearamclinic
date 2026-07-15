import {onDocumentCreated} from "firebase-functions/firestore";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {logger} from "firebase-functions";

/**
 * 검사 결과 문서에서 집계할 metric들을 추출해 testStats/{type}에
 * count/sum/sumSq를 원자적으로 누적한다. (평균·표준편차 인크리먼탈 유지)
 */
async function aggregate(
  data: Record<string, unknown> | undefined,
  source: string,
): Promise<void> {
  if (!data) return;
  const type = data.type as string | undefined;
  const result = (data.result as Record<string, unknown>) || {};
  if (!type) return;

  // 어떤 metric을 집계할지 결정
  const metrics: Record<string, number> = {};

  // 설문 검사 — totalSum
  if (typeof result.totalSum === "number") {
    metrics.total = result.totalSum;
  }

  // 집중력/인지 검사 — score / meanTime
  if (typeof result.score === "number") {
    metrics.score = result.score;
  }
  if (typeof result.meanTime === "number") {
    metrics.meanTime = result.meanTime;
  }

  // percents 객체 (각 차원별) — Big5/DISC/RIASEC/IQ 등
  if (
    result.percents &&
    typeof result.percents === "object" &&
    !Array.isArray(result.percents)
  ) {
    for (const [dim, val] of Object.entries(
      result.percents as Record<string, unknown>,
    )) {
      if (typeof val === "number") {
        metrics[`dim_${dim}`] = val;
      }
    }
  }

  // 심리도식 — domainScores 객체
  if (
    result.domainScores &&
    typeof result.domainScores === "object" &&
    !Array.isArray(result.domainScores)
  ) {
    for (const [dim, val] of Object.entries(
      result.domainScores as Record<string, unknown>,
    )) {
      if (typeof val === "number") {
        metrics[`dom_${dim}`] = val;
      }
    }
  }

  // 애착 유형 — 불안/회피 두 축
  if (typeof result.anxietyPercent === "number") {
    metrics.anxiety = result.anxietyPercent;
  }
  if (typeof result.avoidancePercent === "number") {
    metrics.avoidance = result.avoidancePercent;
  }

  if (Object.keys(metrics).length === 0) {
    logger.info(`[testStats:${source}] ${type}: 집계할 metric이 없습니다.`);
    return;
  }

  const db = getFirestore();
  const ref = db.collection("testStats").doc(type);

  const updates: Record<string, unknown> = {
    lastUpdated: FieldValue.serverTimestamp(),
    type,
  };

  for (const [metricKey, value] of Object.entries(metrics)) {
    updates[`metrics.${metricKey}.count`] = FieldValue.increment(1);
    updates[`metrics.${metricKey}.sum`] = FieldValue.increment(value);
    updates[`metrics.${metricKey}.sumSq`] = FieldValue.increment(value * value);
  }

  try {
    await ref.set(updates, {merge: true});
    logger.info(`[testStats:${source}] ${type} 갱신 완료, metrics: ${Object.keys(metrics).join(", ")}`);
  } catch (err) {
    logger.error(`[testStats:${source}] ${type} 갱신 실패:`, err);
  }
}

/** 로그인 사용자의 testResults 생성 시 집계 */
export const onTestResultCreated = onDocumentCreated(
  {
    document: "users/{uid}/testResults/{resultId}",
    region: "asia-northeast3",
  },
  async (event) => {
    await aggregate(event.data?.data(), "user");
  },
);

/**
 * 비로그인 수검자의 익명 결과(anonTestResults) 생성 시 집계.
 * 규준(표준화) 표본을 넓히기 위한 경로 — 개인 식별 정보 없음.
 * 로그인 사용자는 위 트리거가 집계하므로 클라이언트에서 중복 제출하지 않는다.
 */
export const onAnonTestResultCreated = onDocumentCreated(
  {
    document: "anonTestResults/{resultId}",
    region: "asia-northeast3",
  },
  async (event) => {
    await aggregate(event.data?.data(), "anon");
  },
);
