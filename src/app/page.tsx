import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <h1 className="text-4xl font-bold text-gray-900">해람연구소</h1>
      <p className="text-lg text-gray-600">정신건강 블로그</p>
      <Link
        href="/blog"
        className="mt-4 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition"
      >
        블로그 보기
      </Link>
    </div>
  );
}
