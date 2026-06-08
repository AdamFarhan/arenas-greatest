import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Linking } from "react-native";
import type { User } from "@supabase/supabase-js";
import { getAuthRedirectUrl, getMobileSupabase, hasSupabaseConfig } from "@/lib/supabase";

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
    const handleUrl = async (url: string | null) => {
      if (!url) return;

      const params = getAuthParamsFromUrl(url);
      if (params.error) {
        console.warn("Supabase auth redirect failed:", params.error);
        return;
      }

      if (!params.accessToken || !params.refreshToken) return;

      const { error } = await supabase.auth.setSession({
        access_token: params.accessToken,
        refresh_token: params.refreshToken
      });

      if (error) {
        console.warn("Could not restore Supabase session from redirect:", error.message);
      }
    };
    const subscription = Linking.addEventListener("url", (event) => {
      handleUrl(event.url);
    });

    Linking.getInitialURL().then(handleUrl);

    return () => {
      data.subscription.unsubscribe();
      subscription.remove();
    };
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
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: getAuthRedirectUrl()
          }
        });
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

function getAuthParamsFromUrl(url: string) {
  const paramsText = url.includes("#") ? url.split("#")[1] : url.split("?")[1];
  const params = new URLSearchParams(paramsText ?? "");

  return {
    accessToken: params.get("access_token"),
    refreshToken: params.get("refresh_token"),
    error: params.get("error_description") ?? params.get("error")
  };
}
