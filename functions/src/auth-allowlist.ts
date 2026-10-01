import {
  beforeUserCreated,
  beforeUserSignedIn,
  HttpsError,
  type AuthBlockingEvent,
} from "firebase-functions/v2/identity";

const ALLOWED_EMAIL = "psychiatristlee@gmail.com";

function verifyAllowlist(event: AuthBlockingEvent): void {
  const email = event.data?.email?.toLowerCase();
  const provider = event.credential?.providerId ??
    event.data?.providerData[0]?.providerId;
  if (email !== ALLOWED_EMAIL || provider !== "google.com") {
    throw new HttpsError(
      "permission-denied",
      "허용된 관리자 Google 계정만 로그인할 수 있습니다.",
    );
  }
}

export const allowlistedUserCreated = beforeUserCreated(
  {region: "us-central1"},
  (event) => verifyAllowlist(event),
);

export const allowlistedUserSignedIn = beforeUserSignedIn(
  {region: "us-central1"},
  (event) => verifyAllowlist(event),
);
