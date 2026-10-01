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
  deleteUser,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export const ALLOWED_LOGIN_EMAIL = "psychiatristlee@gmail.com";

function isAllowedUser(user: User): boolean {
  return user.email?.toLowerCase() === ALLOWED_LOGIN_EMAIL &&
    user.providerData.some((provider) => provider.providerId === "google.com");
}

interface AuthClaims {
  admin: boolean;
  editor: boolean;
}

interface AuthContextType {
  user: User | null;
  claims: AuthClaims;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshClaims: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  claims: { admin: false, editor: false },
  loading: true,
  signInWithGoogle: async () => {},
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
      if (u && !isAllowedUser(u)) {
        try {
          await deleteUser(u);
        } catch {
          await firebaseSignOut(auth);
        }
        setUser(null);
        setClaims({ admin: false, editor: false });
        setLoading(false);
        return;
      }
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
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(auth, provider);
    if (!isAllowedUser(result.user)) {
      try {
        await deleteUser(result.user);
      } finally {
        await firebaseSignOut(auth);
      }
      throw new Error("허용되지 않은 계정입니다.");
    }
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
        signOut,
        refreshClaims,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
