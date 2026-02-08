import {onCall, HttpsError} from "firebase-functions/https";
import {getAuth} from "firebase-admin/auth";

export const getUserByEmail = onCall(
  {region: "asia-northeast3"},
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "인증이 필요합니다.");
    }

    if (request.auth.token.admin !== true) {
      throw new HttpsError("permission-denied", "관리자 권한이 필요합니다.");
    }

    const {email} = request.data;
    if (!email || typeof email !== "string") {
      throw new HttpsError("invalid-argument", "이메일을 입력해주세요.");
    }

    try {
      const user = await getAuth().getUserByEmail(email);
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        customClaims: user.customClaims || {},
      };
    } catch {
      throw new HttpsError(
        "not-found",
        "해당 이메일의 사용자를 찾을 수 없습니다.",
      );
    }
  },
);
