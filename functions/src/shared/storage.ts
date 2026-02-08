import {getStorage} from "firebase-admin/storage";
import {randomUUID} from "crypto";

// Firebase Storage download URL 생성 헬퍼
export function makeDownloadUrl(
  bucketName: string,
  storagePath: string,
  token: string,
): string {
  const encodedPath = encodeURIComponent(storagePath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${token}`;
}

// 이미지를 Storage 임시 경로(temp/)에 업로드 → download token URL 반환
export async function uploadImage(
  imageBuffer: Buffer,
  userId: string,
  postSlug: string,
  index: number,
): Promise<string> {
  const bucket = getStorage().bucket();
  const storagePath = `temp/${userId}/${postSlug}/section-${index}.png`;
  console.log("[uploadImage] bucket:", bucket.name);
  console.log("[uploadImage] storagePath:", storagePath);
  const file = bucket.file(storagePath);
  const downloadToken = randomUUID();
  await file.save(imageBuffer, {
    metadata: {
      contentType: "image/png",
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
      },
    },
  });
  const url = makeDownloadUrl(bucket.name, storagePath, downloadToken);
  console.log("[uploadImage] url:", url);
  return url;
}
