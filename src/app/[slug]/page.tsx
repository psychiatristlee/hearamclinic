import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebaseAdmin";
import Link from "next/link";
import Image from "next/image";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import EditLink from "@/components/EditLink";

export const revalidate = 60;

// Decode percent-encoded slugs to Unicode (handles legacy encoded slugs)
function safeDecodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

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

interface RecommendedPost {
  slug: string;
  title: string;
  featuredImage: string;
  categories: string[];
  excerpt: string;
}

async function getRandomPost(excludeSlug: string): Promise<RecommendedPost | null> {
  const snapshot = await adminDb.collection("posts").orderBy("date", "desc").get();
  const others = snapshot.docs.filter((d) => d.data().slug !== excludeSlug);
  if (others.length === 0) return null;

  const doc = others[Math.floor(Math.random() * others.length)];
  const data = doc.data();
  const plain = (data.content ?? "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]*)\]\(.*?\)/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/[*_~`>]/g, "")
    .replace(/\n+/g, " ")
    .trim();

  return {
    slug: data.slug ?? "",
    title: data.title ?? "",
    featuredImage: data.featuredImage ?? "",
    categories: data.categories ?? [],
    excerpt: plain.length > 80 ? plain.slice(0, 80).replace(/\s+\S*$/, "") + "…" : plain,
  };
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  let post = await getPost(decodedSlug);
  if (!post) {
    const encodedSlug = encodeURIComponent(decodedSlug).toLowerCase();
    if (encodedSlug !== decodedSlug) {
      post = await getPost(encodedSlug);
    }
  }

  if (!post) return {};

  const description = post.content
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]*)\]\(.*?\)/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/[*_~`>]/g, "")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, 160);

  return {
    title: post.title,
    description,
    openGraph: {
      title: `${post.title} - 해람정신건강의학과`,
      description,
      url: `https://hearam.kr/${encodeURIComponent(post.slug)}`,
      siteName: "해람정신건강의학과",
      locale: "ko_KR",
      type: "article",
      ...(post.featuredImage && {
        images: [{ url: post.featuredImage, alt: post.title }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      ...(post.featuredImage && { images: [post.featuredImage] }),
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  let post = await getPost(decodedSlug);

  // Fallback: old posts have percent-encoded slugs (lowercase hex) in Firestore
  if (!post) {
    const encodedSlug = encodeURIComponent(decodedSlug).toLowerCase();
    if (encodedSlug !== decodedSlug) {
      post = await getPost(encodedSlug);
    }
  }

  if (!post) {
    notFound();
  }

  const recommended = await getRandomPost(post.slug);

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

      {recommended && (
        <div className="mt-16 pt-8 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-500 mb-4">
            이런 글은 어떠세요?
          </p>
          <Link
            href={`/${encodeURIComponent(safeDecodeSlug(recommended.slug))}`}
            className="block border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-lg transition group"
          >
            <div className="flex flex-col sm:flex-row">
              {recommended.featuredImage && (
                <div className="relative w-full sm:w-48 h-40 sm:h-auto flex-shrink-0">
                  <Image
                    src={recommended.featuredImage}
                    alt={recommended.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 192px"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-5 flex flex-col justify-center">
                <p className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                  {recommended.title}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {recommended.excerpt}
                </p>
                {recommended.categories.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {recommended.categories.map((cat) => (
                      <span
                        key={cat}
                        className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Link>
        </div>
      )}
    </article>
  );
}
