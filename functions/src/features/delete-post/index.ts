import {onCall, HttpsError} from "firebase-functions/https";
import {getFirestore} from "firebase-admin/firestore";
import {getStorage} from "firebase-admin/storage";
import {verifyEditorAuth} from "../../shared";

export const deletePost = onCall(
  {
    region: "asia-northeast3",
  },
  async (request) => {
    verifyEditorAuth(request);

    const postId = request.data?.postId;
    const slug = request.data?.slug;

    if (!postId || typeof postId !== "string") {
      throw new HttpsError("invalid-argument", "postId가 필요합니다.");
    }
    if (!slug || typeof slug !== "string") {
      throw new HttpsError("invalid-argument", "slug이 필요합니다.");
    }

    const db = getFirestore();
    const bucket = getStorage().bucket();

    // 1. Firestore 문서 삭제
    await db.collection("posts").doc(postId).delete();

    // 2. Storage 이미지 삭제 (blog-images/posts/{slug}/)
    try {
      const [files] = await bucket.getFiles({
        prefix: `blog-images/posts/${slug}/`,
      });
      for (const file of files) {
        await file.delete();
        console.log("[deletePost] 이미지 삭제:", file.name);
      }
      console.log(`[deletePost] ${files.length}개 이미지 삭제 완료`);
    } catch (err) {
      console.error("[deletePost] Storage 이미지 삭제 실패:", err);
      // Firestore 문서는 이미 삭제되었으므로 Storage 실패는 무시
    }

    // 3. temp 이미지도 삭제 (있을 경우)
    try {
      const uid = request.auth!.uid;
      const [tempFiles] = await bucket.getFiles({
        prefix: `temp/${uid}/${slug}/`,
      });
      for (const file of tempFiles) {
        await file.delete();
      }
    } catch {
      // temp 파일 없으면 무시
    }

    return {success: true};
  },
);
