import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { listSavedMatches, type SavedMatchSummary } from "@riftbound/db";
import { getMobileSupabase, hasSupabaseConfig } from "@/lib/supabase";
import { useSession } from "@/lib/session";

type SavedMatchesContextValue = {
  matches: SavedMatchSummary[];
  status: string;
  isLoaded: boolean;
  refreshMatches: () => Promise<void>;
  loadMatchesIfNeeded: () => Promise<void>;
  upsertCachedMatch: (match: SavedMatchSummary) => void;
  clearMatches: () => void;
};

const SavedMatchesContext = createContext<SavedMatchesContextValue | undefined>(undefined);

export function SavedMatchesProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const userId = session.user?.id ?? null;
  const [matches, setMatches] = useState<SavedMatchSummary[]>([]);
  const [status, setStatus] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const fetchPromise = useRef<Promise<void> | null>(null);

  const clearMatches = useCallback(() => {
    setMatches([]);
    setStatus("");
    setIsLoaded(false);
    setLoadedUserId(null);
  }, []);

  useEffect(() => {
    if (!session.isLoaded) {
      return;
    }

    if (!session.isSignedIn || !userId) {
      clearMatches();
      setIsLoaded(true);
      setStatus("Sign in to view saved matches.");
      return;
    }

    if (loadedUserId && loadedUserId !== userId) {
      clearMatches();
    }
  }, [clearMatches, loadedUserId, session.isLoaded, session.isSignedIn, userId]);

  const refreshMatches = useCallback(async () => {
    if (fetchPromise.current) {
      return fetchPromise.current;
    }

    fetchPromise.current = (async () => {
      if (!hasSupabaseConfig()) {
        setMatches([]);
        setStatus("Cloud history is unavailable until Supabase environment variables are configured.");
        setIsLoaded(true);
        setLoadedUserId(userId);
        return;
      }

      if (!session.isSignedIn || !userId) {
        setMatches([]);
        setStatus("Sign in to view saved matches.");
        setIsLoaded(true);
        setLoadedUserId(null);
        return;
      }

      const { data, error } = await listSavedMatches(getMobileSupabase(session.getSupabaseAccessToken));

      if (error) {
        setStatus(error.message);
        setIsLoaded(true);
        setLoadedUserId(userId);
        return;
      }

      setMatches(data ?? []);
      setStatus(data?.length ? "" : "No saved matches yet.");
      setIsLoaded(true);
      setLoadedUserId(userId);
    })().finally(() => {
      fetchPromise.current = null;
    });

    return fetchPromise.current;
  }, [session.getSupabaseAccessToken, session.isSignedIn, userId]);

  const loadMatchesIfNeeded = useCallback(async () => {
    if (!isLoaded || loadedUserId !== userId) {
      await refreshMatches();
    }
  }, [isLoaded, loadedUserId, refreshMatches, userId]);

  const upsertCachedMatch = useCallback(
    (match: SavedMatchSummary) => {
      if (match.user_id !== userId) {
        return;
      }

      setMatches((current) =>
        [match, ...current.filter((cachedMatch) => cachedMatch.id !== match.id)].sort(
          (left, right) => new Date(right.played_at).getTime() - new Date(left.played_at).getTime(),
        ),
      );
      setStatus("");
      setIsLoaded(true);
      setLoadedUserId(userId);
    },
    [userId],
  );

  const value = useMemo<SavedMatchesContextValue>(
    () => ({
      matches,
      status,
      isLoaded,
      refreshMatches,
      loadMatchesIfNeeded,
      upsertCachedMatch,
      clearMatches,
    }),
    [clearMatches, isLoaded, loadMatchesIfNeeded, matches, refreshMatches, status, upsertCachedMatch],
  );

  return <SavedMatchesContext.Provider value={value}>{children}</SavedMatchesContext.Provider>;
}

export function useSavedMatches() {
  const context = useContext(SavedMatchesContext);

  if (!context) {
    throw new Error("useSavedMatches must be used within SavedMatchesProvider.");
  }

  return context;
}
