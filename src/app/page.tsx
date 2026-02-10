import { adminDb } from "@/lib/firebaseAdmin";
import PostList, { type PostSummary } from "@/components/PostList";

export const revalidate = 60; // ISR: 60초마다 재생성

async function getPosts(): Promise<PostSummary[]> {
  const snapshot = await adminDb
    .collection("posts")
    .orderBy("date", "desc")
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title ?? "",
      slug: data.slug ?? "",
      excerpt: data.excerpt ?? "",
      dateSeconds: data.date?.seconds ?? 0,
      categories: data.categories ?? [],
      featuredImage: data.featuredImage ?? "",
    };
  });
}

export default async function Home() {
  const posts = await getPosts();

  return <PostList posts={posts} />;
}
