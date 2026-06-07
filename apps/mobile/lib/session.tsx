import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { getMobileSupabase, hasSupabaseConfig } from "@/lib/supabase";

type SessionContextValue = {
  email: string;
  setEmail: (email: string) => void;
  isSignedIn: boolean;
  user: User | null;
  signIn: () => Promise<{ error?: string; demo?: boolean }>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [demoSignedIn, setDemoSignedIn] = useState(false);

  useEffect(() => {
    if (!hasSupabaseConfig()) return;

    const supabase = getMobileSupabase();
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      email,
      setEmail,
      user,
      isSignedIn: hasSupabaseConfig() ? Boolean(user) : demoSignedIn,
      async signIn() {
        if (!hasSupabaseConfig()) {
          setDemoSignedIn(true);
          return { demo: true };
        }

        const supabase = getMobileSupabase();
        const { error } = await supabase.auth.signInWithOtp({ email });
        return { error: error?.message };
      },
      async signOut() {
        if (hasSupabaseConfig()) {
          await getMobileSupabase().auth.signOut();
        }
        setUser(null);
        setDemoSignedIn(false);
      }
    }),
    [demoSignedIn, email, user]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used within SessionProvider.");
  }

  return context;
}
