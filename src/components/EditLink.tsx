"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";

export default function EditLink({ slug }: { slug: string }) {
  const { claims } = useAuth();

  if (!claims.admin && !claims.editor) return null;

  return (
    <Link
      href={`/${encodeURIComponent(slug)}/edit`}
      className="ml-auto text-purple-600 hover:text-purple-800"
    >
      수정
    </Link>
  );
}
