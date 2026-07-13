import {onCall, HttpsError} from "firebase-functions/https";
import {getFirestore, Timestamp} from "firebase-admin/firestore";

function requireAdmin(
  request: {auth?: {token: Record<string, unknown>} | null},
): void {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "인증이 필요합니다.");
  }
  if (request.auth.token.admin !== true) {
    throw new HttpsError("permission-denied", "관리자 권한이 필요합니다.");
  }
}

interface FeedbackItem {
  id: string;
  message: string;
  category: string;
  email: string;
  path: string;
  uid: string;
  status: string;
  createdAt: number | null;
}

// 피드백 목록 조회 (admin 전용).
// 단일 정렬(createdAt desc)만 사용해 복합 인덱스 없이 동작.
// 상태 필터는 클라이언트에서 처리한다.
export const listFeedback = onCall(
  {region: "asia-northeast3"},
  async (request) => {
    requireAdmin(request);

    const max = Math.min(
      typeof request.data?.max === "number" ? request.data.max : 200,
      500,
    );

    const db = getFirestore();
    const snap = await db.collection("feedback")
      .orderBy("createdAt", "desc")
      .limit(max)
      .get();

    const items: FeedbackItem[] = snap.docs.map((d) => {
      const data = d.data();
      const created = data.createdAt as Timestamp | undefined;
      return {
        id: d.id,
        message: (data.message as string) ?? "",
        category: (data.category as string) ?? "other",
        email: (data.email as string) ?? "",
        path: (data.path as string) ?? "",
        uid: (data.uid as string) ?? "",
        status: (data.status as string) ?? "new",
        createdAt: created ? created.toMillis() : null,
      };
    });

    const newCount = items.filter((it) => it.status === "new").length;
    return {items, newCount};
  },
);

// 피드백 상태 변경 (admin 전용): new → resolved / archived 등
export const updateFeedbackStatus = onCall(
  {region: "asia-northeast3"},
  async (request) => {
    requireAdmin(request);

    const id = request.data?.id as string | undefined;
    const status = request.data?.status as string | undefined;
    if (!id || typeof id !== "string") {
      throw new HttpsError("invalid-argument", "id가 필요합니다.");
    }
    const ALLOWED = ["new", "resolved", "archived"];
    if (!status || !ALLOWED.includes(status)) {
      throw new HttpsError("invalid-argument", "유효한 status가 아닙니다.");
    }

    const db = getFirestore();
    await db.collection("feedback").doc(id).update({
      status,
      updatedAt: Timestamp.now(),
    });
    return {ok: true};
  },
);
