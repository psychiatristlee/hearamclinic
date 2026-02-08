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
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

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
      value={{ user, claims, loading, signInWithGoogle, signOut, refreshClaims }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
