"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

// 카카오 OIDC 공급자가 Firebase Auth에 등록되기 전까지는 버튼을 숨기기 위한 플래그.
// 공급자 등록 후 apphosting.yaml 에 NEXT_PUBLIC_KAKAO_LOGIN: "on" 을 추가하면 노출된다.
export const KAKAO_LOGIN_ENABLED = process.env.NEXT_PUBLIC_KAKAO_LOGIN === "on";
// Firebase Auth 에 등록할 OIDC 공급자 ID (등록 스크립트와 동일해야 함)
const KAKAO_PROVIDER_ID = "oidc.kakao";

interface AuthClaims {
  admin: boolean;
  editor: boolean;
}

interface AuthContextType {
  user: User | null;
  claims: AuthClaims;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithKakao: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshClaims: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  claims: { admin: false, editor: false },
  loading: true,
  signInWithGoogle: async () => {},
  signInWithKakao: async () => {},
  signOut: async () => {},
  refreshClaims: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<AuthClaims>({
    admin: false,
    editor: false,
  });
  const [loading, setLoading] = useState(true);

  const extractClaims = useCallback(async (u: User) => {
    const tokenResult = await u.getIdTokenResult();
    setClaims({
      admin: tokenResult.claims.admin === true,
      editor: tokenResult.claims.editor === true,
    });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await extractClaims(u);
      } else {
        setClaims({ admin: false, editor: false });
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [extractClaims]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithKakao = async () => {
    // 카카오 OIDC 공급자. openid 로 sub, profile_nickname 으로 표시 이름을 받는다.
    // (이메일까지 받으려면 카카오 동의항목에서 account_email 활성화 후 스코프 추가)
    const provider = new OAuthProvider(KAKAO_PROVIDER_ID);
    provider.addScope("openid");
    provider.addScope("profile_nickname");
    await signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const refreshClaims = async () => {
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true);
      await extractClaims(auth.currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        claims,
        loading,
        signInWithGoogle,
        signInWithKakao,
        signOut,
        refreshClaims,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
