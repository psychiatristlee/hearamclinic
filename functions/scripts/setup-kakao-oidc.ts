/**
 * 카카오 OIDC 공급자를 Firebase Auth(Identity Platform)에 등록/갱신한다.
 * 공급자 ID는 프런트엔드(AuthContext)의 KAKAO_PROVIDER_ID 와 동일한 "oidc.kakao".
 *
 * 사전 준비(카카오 개발자 콘솔):
 *  - 카카오 로그인 활성화 + OpenID Connect 활성화
 *  - Redirect URI: https://hearamclinic-ef507.firebaseapp.com/__/auth/handler
 *  - REST API 키(= client_id), 보안 > Client Secret(코드 발급/활성화)
 *
 * 실행:
 *  cd functions
 *  KAKAO_REST_API_KEY=xxxx KAKAO_CLIENT_SECRET=yyyy \
 *    GOOGLE_APPLICATION_CREDENTIALS="$HOME/.config/gcloud/application_default_credentials.json" \
 *    npx tsx scripts/setup-kakao-oidc.ts
 */
import {initializeApp, applicationDefault} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";

const PROJECT_ID = "hearamclinic-ef507";
const PROVIDER_ID = "oidc.kakao";
const ISSUER = "https://kauth.kakao.com";

const clientId = process.env.KAKAO_REST_API_KEY;
const clientSecret = process.env.KAKAO_CLIENT_SECRET;
if (!clientId) {
  console.error("KAKAO_REST_API_KEY 환경변수가 필요합니다 (카카오 REST API 키).");
  process.exit(1);
}
if (!clientSecret) {
  console.error("KAKAO_CLIENT_SECRET 환경변수가 필요합니다 (카카오 로그인 > 보안 > Client Secret).");
  process.exit(1);
}

initializeApp({credential: applicationDefault(), projectId: PROJECT_ID});

const config = {
  providerId: PROVIDER_ID,
  displayName: "Kakao",
  enabled: true,
  clientId,
  issuer: ISSUER,
  clientSecret, // 인증 코드 흐름(code flow)
  responseType: {code: true},
} as const;

async function run() {
  const auth = getAuth();
  try {
    const existing = await auth.getProviderConfig(PROVIDER_ID);
    console.log(`기존 공급자 발견(${existing.providerId}) → 갱신합니다.`);
    const updated = await auth.updateProviderConfig(PROVIDER_ID, {
      displayName: config.displayName,
      enabled: config.enabled,
      clientId: config.clientId,
      issuer: config.issuer,
      clientSecret: config.clientSecret,
      responseType: config.responseType,
    });
    console.log("✓ 갱신 완료:", updated.providerId, updated.issuer);
  } catch (e) {
    const code = (e as {code?: string}).code || "";
    if (code.includes("not-found") || code.includes("no-such")) {
      const created = await auth.createProviderConfig(config);
      console.log("✓ 신규 등록 완료:", created.providerId, created.issuer);
    } else {
      console.error("실패:", code, (e as Error).message);
      console.error(
        "→ Identity Platform(GCIP)이 비활성일 수 있습니다. Firebase 콘솔 > Authentication 에서 활성화 후 다시 실행하세요.",
      );
      process.exit(1);
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
