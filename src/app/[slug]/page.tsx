import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebaseAdmin";
import Link from "next/link";
import Image from "next/image";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import EditLink from "@/components/EditLink";

export const revalidate = 60;

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  dateSeconds: number;
  categories: string[];
  featuredImage: string;
  author: string;
}

async function getPost(slug: string): Promise<Post | null> {
  const snapshot = await adminDb
    .collection("posts")
    .where("slug", "==", slug)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title ?? "",
    slug: data.slug ?? "",
    content: data.content ?? "",
    dateSeconds: data.date?.seconds ?? 0,
    categories: data.categories ?? [],
    featuredImage: data.featuredImage ?? "",
    author: data.author ?? "",
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const post = await getPost(decodedSlug);

  if (!post) {
    notFound();
  }

  return (
    <article>
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-purple-500 hover:text-purple-700"
        >
          &larr; 블로그 목록
        </Link>
      </div>

      {post.featuredImage && (
        <div className="relative w-full h-96 mb-8">
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            sizes="(max-width: 896px) 100vw, 896px"
            className="object-cover rounded-lg"
            priority
          />
        </div>
      )}

      <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>

      <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 pb-4 border-b">
        <span>{post.author}</span>
        <span>
          {new Date(post.dateSeconds * 1000).toLocaleDateString("ko-KR")}
        </span>
        {post.categories.length > 0 && (
          <span>{post.categories.join(", ")}</span>
        )}
        <EditLink slug={post.slug} />
      </div>

      <div className="prose prose-lg max-w-none prose-a:text-purple-600 prose-a:hover:text-purple-800">
        <Markdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            a: ({ href, children, ...props }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            ),
          }}
        >
          {post.content}
        </Markdown>
      </div>
    </article>
  );
}
