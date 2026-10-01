import {HttpsError} from "firebase-functions/https";

const ALLOWED_EMAIL = "psychiatristlee@gmail.com";

type AuthRequest = {auth?: {token: Record<string, unknown>} | null};
type AuthenticatedRequest = {auth: {token: Record<string, unknown>}};

export function verifyAllowedAccount(
  request: AuthRequest,
): asserts request is AuthenticatedRequest {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "인증이 필요합니다.");
  }
  const firebaseClaim = request.auth.token.firebase as
    Record<string, unknown> | undefined;
  if (
    request.auth.token.email !== ALLOWED_EMAIL ||
    request.auth.token.email_verified !== true ||
    firebaseClaim?.sign_in_provider !== "google.com"
  ) {
    throw new HttpsError("permission-denied", "허용되지 않은 계정입니다.");
  }
}

// 권한 검증 헬퍼
export function verifyEditorAuth(
  request: AuthRequest,
): void {
  verifyAllowedAccount(request);
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
