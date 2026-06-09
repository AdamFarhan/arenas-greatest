import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useAuth, useUser } from "@clerk/expo";

type AppUser = {
  id: string;
  email: string | null;
};

type SessionContextValue = {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: AppUser | null;
  getSupabaseAccessToken: () => Promise<string | null>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { getToken, isLoaded: authLoaded, isSignedIn, signOut } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();

  const value = useMemo<SessionContextValue>(
    () => ({
      isLoaded: authLoaded && (!isSignedIn || userLoaded),
      isSignedIn: Boolean(isSignedIn),
      user: user
        ? {
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress ?? null
          }
        : null,
      getSupabaseAccessToken: () => getToken(),
      signOut
    }),
    [authLoaded, getToken, isSignedIn, signOut, user, userLoaded]
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
