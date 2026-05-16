import {onDocumentCreated} from "firebase-functions/firestore";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {logger} from "firebase-functions";

/**
 * testResults가 생성될 때 testStats 집계 문서를 원자적으로 갱신.
 *
 * testStats/{testType}.metrics.{metricKey} = { count, sum, sumSq }
 * count, sum, sumSq로 평균과 표준편차를 인크리먼탈하게 유지.
 */
export const onTestResultCreated = onDocumentCreated(
  {
    document: "users/{uid}/testResults/{resultId}",
    region: "asia-northeast3",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const data = snap.data();
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

    // 집중력 검사 — score / meanTime (단, 검사들이 result에 score 저장 시)
    if (typeof result.score === "number") {
      metrics.score = result.score;
    }
    if (typeof result.meanTime === "number") {
      metrics.meanTime = result.meanTime;
    }

    // Big 5 / Enneagram — percents 객체 (각 차원별)
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

    // 애착 유형 — 불안/회피 두 축
    if (typeof result.anxietyPercent === "number") {
      metrics.anxiety = result.anxietyPercent;
    }
    if (typeof result.avoidancePercent === "number") {
      metrics.avoidance = result.avoidancePercent;
    }

    if (Object.keys(metrics).length === 0) {
      logger.info(`[testStats] ${type}: 집계할 metric이 없습니다.`);
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
      logger.info(`[testStats] ${type} 갱신 완료, metrics: ${Object.keys(metrics).join(", ")}`);
    } catch (err) {
      logger.error(`[testStats] ${type} 갱신 실패:`, err);
    }
  },
);
