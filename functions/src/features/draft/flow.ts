import {onCall, HttpsError} from "firebase-functions/https";
import {getStorage} from "firebase-admin/storage";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {verifyEditorAuth} from "../../shared";

// 임시 저장
export const saveDraft = onCall(
  {
    timeoutSeconds: 30,
    memory: "256MiB",
    region: "asia-northeast3",
  },
  async (request) => {
    verifyEditorAuth(request);

    const userId = request.auth!.uid;
    const {title, content, slug, featuredImage, topic} = request.data || {};

    if (!title || typeof title !== "string") {
      throw new HttpsError("invalid-argument", "제목이 필요합니다.");
    }

    const db = getFirestore();
    const draftRef = db.collection("drafts").doc(userId);

    await draftRef.set({
      title,
      content: content || "",
      slug: slug || "",
      featuredImage: featuredImage || "",
      topic: topic || "",
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {success: true};
  },
);

// 임시 저장 불러오기
export const loadDraft = onCall(
  {
    timeoutSeconds: 30,
    memory: "256MiB",
    region: "asia-northeast3",
  },
  async (request) => {
    verifyEditorAuth(request);

    const userId = request.auth!.uid;
    const db = getFirestore();
    const draftDoc = await db.collection("drafts").doc(userId).get();

    if (!draftDoc.exists) {
      return {exists: false};
    }

    const data = draftDoc.data();
    return {
      exists: true,
      title: data?.title || "",
      content: data?.content || "",
      slug: data?.slug || "",
      featuredImage: data?.featuredImage || "",
      topic: data?.topic || "",
      updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || null,
    };
  },
);

// 임시 저장 삭제
export const deleteDraft = onCall(
  {
    timeoutSeconds: 30,
    memory: "256MiB",
    region: "asia-northeast3",
  },
  async (request) => {
    verifyEditorAuth(request);

    const userId = request.auth!.uid;
    const db = getFirestore();

    // Firestore에서 임시 저장 삭제
    await db.collection("drafts").doc(userId).delete();

    // Storage에서 해당 사용자의 temp 폴더 삭제
    const bucket = getStorage().bucket();
    const [files] = await bucket.getFiles({prefix: `temp/${userId}/`});
    for (const file of files) {
      try {
        await file.delete();
      } catch (err) {
        console.error(`임시 파일 삭제 실패: ${file.name}`, err);
      }
    }

    return {success: true};
  },
);
