import {HttpsError} from "firebase-functions/https";

// 권한 검증 헬퍼
export function verifyEditorAuth(
  request: {auth?: {token: Record<string, unknown>} | null},
): void {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "인증이 필요합니다.");
  }
  if (
    request.auth.token.admin !== true &&
    request.auth.token.editor !== true
  ) {
    throw new HttpsError(
      "permission-denied",
      "editor 또는 admin 권한이 필요합니다.",
    );
  }
}
