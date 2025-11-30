import { createContext, useContext, useEffect, useState, useMemo } from "react";
import type { ReactNode } from "react";
import PocketBase, { type RecordModel } from "pocketbase";

// User shape based on PocketBase auth record
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  verified: boolean;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, name?: string) => Promise<User>;
  signOut: () => void;
  signInWithOAuth: (provider: "github" | "google" | "discord") => Promise<User>;
  pb: PocketBase;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Convert PocketBase record to User type
function recordToUser(record: RecordModel): User {
  return {
    id: record.id,
    email: record.email as string,
    name: record.name as string | undefined,
    avatar: record.avatar as string | undefined,
    verified: record.verified as boolean,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const pb = useMemo(
    () => new PocketBase(import.meta.env.VITE_POCKETBASE_URL as string),
    [],
  );

  const [user, setUser] = useState<User | null>(() => {
    // Initialize from existing auth store
    if (pb.authStore.isValid && pb.authStore.record) {
      return recordToUser(pb.authStore.record);
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Subscribe to auth store changes
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      if (record) {
        setUser(recordToUser(record));
      } else {
        setUser(null);
      }
    });

    // Mark loading as complete
    setLoading(false);

    return () => {
      unsubscribe();
    };
  }, [pb]);


  const signIn = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const authData = await pb
        .collection("users")
        .authWithPassword(email, password);
      const loggedInUser = recordToUser(authData.record);
      setUser(loggedInUser);
      return loggedInUser;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name?: string,
  ): Promise<User> => {
    setLoading(true);
    try {
      // Create user
      await pb.collection("users").create({
        email,
        password,
        passwordConfirm: password,
        name: name || "",
      });
      // Auto login after registration
      return await signIn(email, password);
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    pb.authStore.clear();
    setUser(null);
  };

  const signInWithOAuth = async (
    provider: "github" | "google" | "discord",
  ): Promise<User> => {
    setLoading(true);
    try {
      const authData = await pb
        .collection("users")
        .authWithOAuth2({ provider });
      const loggedInUser = recordToUser(authData.record);
      setUser(loggedInUser);
      return loggedInUser;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithOAuth,
      
        pb,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default AuthProvider;
