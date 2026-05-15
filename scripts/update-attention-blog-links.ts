import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const app = initializeApp({
  credential: applicationDefault(),
  projectId: "hearamclinic-ef507",
});

const SLUG = "attention-tests-nback-digitspan-tmt";

async function run() {
  const db = getFirestore(app);
  const ref = db.collection("posts").doc(SLUG);
  const snap = await ref.get();
  if (!snap.exists) {
    console.error("post not found:", SLUG);
    process.exit(1);
  }

  const data = snap.data()!;
  let content = data.content as string;

  const replacements: Array<[RegExp, string]> = [
    [/\[\/test\/n-back\]\(\/test\/n-back\)\s*에서/g, "[여기](/test/n-back)에서"],
    [/\[\/test\/digit-span\]\(\/test\/digit-span\)\s*에서/g, "[여기](/test/digit-span)에서"],
    [/\[\/test\/trail-making\]\(\/test\/trail-making\)\s*에서/g, "[여기](/test/trail-making)에서"],
  ];

  for (const [pattern, replacement] of replacements) {
    content = content.replace(pattern, replacement);
  }

  const excerpt = content
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/#+\s/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, 200);

  await ref.update({
    content,
    excerpt,
    updatedAt: Timestamp.now(),
  });

  console.log("updated:", SLUG);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
