import {onCall, HttpsError} from "firebase-functions/https";
import {getAuth} from "firebase-admin/auth";

export const setRole = onCall(
  {region: "asia-northeast3"},
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "인증이 필요합니다.");
    }

    if (request.auth.token.admin !== true) {
      throw new HttpsError("permission-denied", "관리자 권한이 필요합니다.");
    }

    const {uid, role, value} = request.data;
    if (!uid || typeof uid !== "string") {
      throw new HttpsError("invalid-argument", "유효한 사용자 ID가 필요합니다.");
    }
    if (role !== "editor") {
      throw new HttpsError("invalid-argument", "유효한 역할이 아닙니다.");
    }
    if (typeof value !== "boolean") {
      throw new HttpsError("invalid-argument", "value는 boolean이어야 합니다.");
    }

    const user = await getAuth().getUser(uid);
    const currentClaims = user.customClaims || {};
    await getAuth().setCustomUserClaims(uid, {
      ...currentClaims,
      [role]: value,
    });

    return {success: true};
  },
);
