"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, type User } from "@/lib/api";

type Session = {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<User>("/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      setUser,
      logout: async () => {
        await api("/auth/logout", "POST");
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession must be used inside SessionProvider");
  return session;
}
