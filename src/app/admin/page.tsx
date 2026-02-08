"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { httpsCallable } from "firebase/functions";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { db, functions } from "@/lib/firebase";

interface UserInfo {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  customClaims: { admin?: boolean; editor?: boolean };
}

interface CategoryDoc {
  id: string;
  name: string;
  order: number;
}

export default function AdminPage() {
  const { user, claims, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [foundUser, setFoundUser] = useState<UserInfo | null>(null);
  const [searching, setSearching] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // 카테고리 관련 state
  const [categories, setCategories] = useState<CategoryDoc[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 카테고리 불러오기
  useEffect(() => {
    async function fetchCategories() {
      try {
        const q = query(
          collection(db, "categories"),
          orderBy("order", "asc")
        );
        const snap = await getDocs(q);
        setCategories(
          snap.docs.map((d) => ({
            id: d.id,
            name: d.data().name as string,
            order: (d.data().order as number) ?? 0,
          }))
        );
      } catch (err) {
        console.error("카테고리 불러오기 실패:", err);
      } finally {
        setLoadingCategories(false);
      }
    }
    fetchCategories();
  }, []);

  async function handleAddCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    if (categories.some((c) => c.name === name)) {
      alert("이미 존재하는 카테고리입니다.");
      return;
    }

    setAddingCategory(true);
    try {
      const docRef = await addDoc(collection(db, "categories"), {
        name,
        order: categories.length,
        createdAt: Timestamp.now(),
      });
      setCategories((prev) => [
        ...prev,
        { id: docRef.id, name, order: categories.length },
      ]);
      setNewCategoryName("");
    } catch {
      alert("카테고리 추가에 실패했습니다.");
    } finally {
      setAddingCategory(false);
    }
  }

  async function handleDeleteCategory(cat: CategoryDoc) {
    if (!confirm(`"${cat.name}" 카테고리를 삭제하시겠습니까?`)) return;
    setDeletingId(cat.id);
    try {
      await deleteDoc(doc(db, "categories", cat.id));
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    } catch {
      alert("카테고리 삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/admin");
    }
  }, [loading, user, router]);

  if (loading) return <p className="text-gray-500">로딩 중...</p>;
  if (!user) return null;
  if (!claims.admin) {
    return <p className="text-gray-500">관리자 권한이 필요합니다.</p>;
  }

  async function handleSearch() {
    if (!email.trim()) return;
    setSearching(true);
    setError("");
    setFoundUser(null);
    setMessage("");
    try {
      const fn = httpsCallable<{ email: string }, UserInfo>(
        functions,
        "getUserByEmail"
      );
      const result = await fn({ email: email.trim() });
      setFoundUser(result.data);
    } catch {
      setError("사용자를 찾을 수 없습니다.");
    } finally {
      setSearching(false);
    }
  }

  async function handleToggleEditor() {
    if (!foundUser) return;
    setToggling(true);
    setMessage("");
    setError("");
    try {
      const fn = httpsCallable(functions, "setRole");
      const newValue = !foundUser.customClaims?.editor;
      await fn({ uid: foundUser.uid, role: "editor", value: newValue });
      setFoundUser({
        ...foundUser,
        customClaims: { ...foundUser.customClaims, editor: newValue },
      });
      setMessage(
        newValue
          ? "Editor 권한을 부여했습니다."
          : "Editor 권한을 해제했습니다."
      );
    } catch {
      setError("권한 변경에 실패했습니다.");
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="space-y-12">
      {/* ========== 사용자 관리 ========== */}
      <section>
        <h1 className="text-2xl font-bold mb-6">사용자 관리</h1>

        <div className="flex gap-2 mb-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일로 사용자 검색..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={searching || !email.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
          >
            {searching ? "검색 중..." : "검색"}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {message && <p className="text-green-600 text-sm mb-4">{message}</p>}

        {foundUser && (
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              {foundUser.photoURL && (
                <img
                  src={foundUser.photoURL}
                  alt=""
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <p className="font-semibold text-gray-900">
                  {foundUser.displayName || "이름 없음"}
                </p>
                <p className="text-sm text-gray-500">{foundUser.email}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Editor 권한
                </p>
                <p className="text-xs text-gray-400">
                  블로그 글 작성 및 수정 가능
                </p>
              </div>
              <button
                onClick={handleToggleEditor}
                disabled={toggling}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  foundUser.customClaims?.editor
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-green-100 text-green-700 hover:bg-green-200"
                } disabled:opacity-50`}
              >
                {toggling
                  ? "변경 중..."
                  : foundUser.customClaims?.editor
                    ? "권한 해제"
                    : "권한 부여"}
              </button>
            </div>

            {foundUser.customClaims?.admin && (
              <p className="mt-3 text-xs text-purple-600">관리자 계정</p>
            )}
          </div>
        )}
      </section>

      {/* ========== 카테고리 관리 ========== */}
      <section>
        <h2 className="text-2xl font-bold mb-6">카테고리 관리</h2>

        {/* 카테고리 추가 */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="새 카테고리 이름..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
          />
          <button
            onClick={handleAddCategory}
            disabled={addingCategory || !newCategoryName.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
          >
            {addingCategory ? "추가 중..." : "추가"}
          </button>
        </div>

        {/* 카테고리 목록 */}
        {loadingCategories ? (
          <p className="text-gray-400 text-sm">불러오는 중...</p>
        ) : categories.length === 0 ? (
          <p className="text-gray-400 text-sm">
            등록된 카테고리가 없습니다. 위에서 추가해주세요.
          </p>
        ) : (
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <span className="text-gray-800">{cat.name}</span>
                <button
                  onClick={() => handleDeleteCategory(cat)}
                  disabled={deletingId === cat.id}
                  className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50 transition"
                >
                  {deletingId === cat.id ? "삭제 중..." : "삭제"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
