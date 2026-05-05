import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const app = initializeApp({
  credential: applicationDefault(),
  projectId: "hearamclinic-ef507",
});

async function init() {
  const db = getFirestore(app);
  const ref = db.doc("adminConfig/blogAutoPublish");
  await ref.set(
    {
      enabled: true,
      publishHour: 9,
      defaultAuthor: "해람정신건강의학과",
    },
    { merge: true }
  );
  const snap = await ref.get();
  console.log("adminConfig/blogAutoPublish:", snap.data());
}

init().catch((err) => {
  console.error(err);
  process.exit(1);
});
