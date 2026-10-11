import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebaseAdmin";
import Link from "next/link";
import Image from "next/image";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import EditLink from "@/components/EditLink";
import ViewTracker from "@/components/blog/ViewTracker";
import { SoundaryRelatedCard, SoundaryRelatedInline } from "@/components/blog/SoundaryRelated";
import { formatViewCount } from "@/lib/blog-views/format";
import { formatPostDate } from "@/lib/format-date";
import { IconChevronLeft, IconEye } from "@/components/icons";

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
  viewCount: number;
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
    viewCount: typeof data.viewCount === "number" ? data.viewCount : 0,
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
  const date = formatPostDate(post.dateSeconds);

  return (
    <article>
      <div className="mb-6">
        <Link
          href="/"
          className="pressable inline-flex items-center gap-1 -ml-1 pl-1 pr-2 py-1 rounded-full text-sm font-medium text-purple-700 hover:bg-purple-50 hover:text-purple-900"
        >
          <IconChevronLeft className="w-4 h-4" />
          블로그 목록
        </Link>
      </div>

      {post.featuredImage && (
        <div className="relative w-full aspect-[16/9] mb-8 rounded-2xl overflow-hidden bg-purple-50 shadow-sm">
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            sizes="(max-width: 896px) 100vw, 896px"
            className="object-cover"
            priority
          />
        </div>
      )}

      <header className="mb-8 pb-5 border-b border-gray-200">
        {post.categories.length > 0 && (
          <p className="mb-3 flex flex-wrap gap-1.5">
            {post.categories.map((cat) => (
              <span
                key={cat}
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700"
              >
                {cat}
              </span>
            ))}
          </p>
        )}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">{post.title}</h1>

        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
          <span className="font-medium text-gray-700">{post.author}</span>
          {date.label && (
            <>
              <span className="text-gray-300" aria-hidden="true">·</span>
              <time dateTime={date.iso}>{date.label}</time>
            </>
          )}
          <span className="text-gray-300" aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <IconEye className="w-4 h-4" />
            조회 {formatViewCount(post.viewCount)}
          </span>
          <EditLink slug={post.slug} />
        </div>
      </header>
      <ViewTracker slug={post.id} />
      <SoundaryRelatedInline post={post} />

      <div className="prose prose-lg max-w-none prose-headings:tracking-tight prose-a:text-purple-700 prose-a:underline-offset-2 prose-a:hover:text-purple-900 prose-img:rounded-xl prose-blockquote:border-purple-200 prose-blockquote:text-gray-600">
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
          {post.content.replace(/^\s*#\s+.+\n*/, "").trimStart()}
        </Markdown>
      </div>

      <SoundaryRelatedCard post={post} />

      {recommended && (
        <div className="mt-16 pt-8 border-t border-gray-200">
          <p className="text-sm font-semibold text-gray-500 mb-4">
            이런 글은 어떠세요?
          </p>
          <Link
            href={`/${encodeURIComponent(safeDecodeSlug(recommended.slug))}`}
            className="surface surface-hover card-lift group block overflow-hidden"
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
                <p className="font-bold text-gray-900 group-hover:text-purple-800 transition-colors">
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
                        className="text-xs font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full"
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
