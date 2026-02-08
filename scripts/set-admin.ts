import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const app = initializeApp({
  credential: applicationDefault(),
  projectId: "hearamclinic-ef507",
});

async function setAdmin(email: string) {
  const auth = getAuth(app);
  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, { admin: true, editor: true });
  console.log(`${email} (${user.uid}) 에게 admin + editor 권한 부여 완료`);
}

setAdmin("psychiatristlee@gmail.com").catch(console.error);
