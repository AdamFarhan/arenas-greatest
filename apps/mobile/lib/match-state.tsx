import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction
} from "react";
import { createMatch, type MatchState, type PlayerSide, type WinningPoint } from "@riftbound/core";
import { LEGENDS } from "@riftbound/legends";
import { deleteStoredItem, getStoredItem, setStoredItem } from "@/lib/persistent-storage";

export type SaveState = "idle" | "saving" | "saved" | "failed";

export type SetupDraft = {
  startingPlayer: PlayerSide;
  winningPoint: WinningPoint;
};

type MatchContextValue = {
  match: MatchState;
  setMatch: Dispatch<SetStateAction<MatchState>>;
  setupOpen: boolean;
  setSetupOpen: (open: boolean) => void;
  historyOpen: boolean;
  setHistoryOpen: (open: boolean) => void;
  reviewOpen: boolean;
  setReviewOpen: (open: boolean) => void;
  manualEditPlayer: PlayerSide | null;
  setManualEditPlayer: (player: PlayerSide | null) => void;
  setupDraft: SetupDraft;
  setSetupDraft: (draft: SetupDraft) => void;
  playerLegendId: string;
  setPlayerLegendId: (id: string) => void;
  opponentLegendId: string;
  setOpponentLegendId: (id: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  saveState: SaveState;
  setSaveState: (state: SaveState) => void;
  saveStatus: string;
  setSaveStatus: (status: string) => void;
  elapsedSeconds: number;
  matchStartedAt: string | null;
  resetMatch: () => void;
};

const MatchContext = createContext<MatchContextValue | undefined>(undefined);
const PLAYER_LEGEND_STORAGE_KEY = "riftbound.last-player-legend-id";
const OPPONENT_LEGEND_STORAGE_KEY = "riftbound.last-opponent-legend-id";

function isKnownLegendId(id: string | null): id is string {
  return Boolean(id && LEGENDS.some((legend) => legend.id === id));
}

export function MatchProvider({ children }: { children: ReactNode }) {
  const [match, setMatch] = useState<MatchState>(() => createMatch());
  const [setupOpen, setSetupOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [manualEditPlayer, setManualEditPlayer] = useState<PlayerSide | null>(null);
  const [setupDraft, setSetupDraft] = useState<SetupDraft>({
    startingPlayer: "player",
    winningPoint: 8
  });
  const [playerLegendId, setPlayerLegendIdState] = useState(LEGENDS[0]?.id ?? "");
  const [opponentLegendId, setOpponentLegendIdState] = useState(LEGENDS[1]?.id ?? LEGENDS[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveStatus, setSaveStatus] = useState("");
  const [matchStartedAt, setMatchStartedAt] = useState<number | null>(null);
  const [matchEndedAt, setMatchEndedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;

    async function loadStoredLegends() {
      try {
        const [storedPlayerLegendId, storedOpponentLegendId] = await Promise.all([
          getStoredItem(PLAYER_LEGEND_STORAGE_KEY),
          getStoredItem(OPPONENT_LEGEND_STORAGE_KEY)
        ]);

        if (cancelled) return;
        if (isKnownLegendId(storedPlayerLegendId)) {
          setPlayerLegendIdState(storedPlayerLegendId);
        }
        if (isKnownLegendId(storedOpponentLegendId)) {
          setOpponentLegendIdState(storedOpponentLegendId);
        }
      } catch {
        await Promise.allSettled([
          deleteStoredItem(PLAYER_LEGEND_STORAGE_KEY),
          deleteStoredItem(OPPONENT_LEGEND_STORAGE_KEY)
        ]);
      }
    }

    void loadStoredLegends();

    return () => {
      cancelled = true;
    };
  }, []);

  const setPlayerLegendId = useCallback((id: string) => {
    if (!isKnownLegendId(id)) return;
    setPlayerLegendIdState(id);
    void setStoredItem(PLAYER_LEGEND_STORAGE_KEY, id).catch(() => {});
  }, []);

  const setOpponentLegendId = useCallback((id: string) => {
    if (!isKnownLegendId(id)) return;
    setOpponentLegendIdState(id);
    void setStoredItem(OPPONENT_LEGEND_STORAGE_KEY, id).catch(() => {});
  }, []);

  useEffect(() => {
    if (matchStartedAt || match.games.length === 0) return;
    setMatchStartedAt(Date.now());
  }, [match.games.length, matchStartedAt]);

  useEffect(() => {
    if (!match.winner || matchEndedAt) return;
    setMatchEndedAt(Date.now());
  }, [match.winner, matchEndedAt]);

  useEffect(() => {
    if (!matchStartedAt || matchEndedAt) return;

    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [matchEndedAt, matchStartedAt]);

  const elapsedSeconds = useMemo(() => {
    if (!matchStartedAt) return 0;
    return Math.max(0, Math.floor(((matchEndedAt ?? now) - matchStartedAt) / 1000));
  }, [matchEndedAt, matchStartedAt, now]);

  const value = useMemo<MatchContextValue>(
    () => ({
      match,
      setMatch,
      setupOpen,
      setSetupOpen,
      historyOpen,
      setHistoryOpen,
      reviewOpen,
      setReviewOpen,
      manualEditPlayer,
      setManualEditPlayer,
      setupDraft,
      setSetupDraft,
      playerLegendId,
      setPlayerLegendId,
      opponentLegendId,
      setOpponentLegendId,
      notes,
      setNotes,
      saveState,
      setSaveState,
      saveStatus,
      setSaveStatus,
      elapsedSeconds,
      matchStartedAt: matchStartedAt ? new Date(matchStartedAt).toISOString() : null,
      resetMatch() {
        setMatch(createMatch());
        setNotes("");
        setSaveState("idle");
        setSaveStatus("");
        setReviewOpen(false);
        setHistoryOpen(false);
        setManualEditPlayer(null);
        setSetupOpen(false);
        setMatchStartedAt(null);
        setMatchEndedAt(null);
        setNow(Date.now());
      }
    }),
    [
      elapsedSeconds,
      historyOpen,
      matchStartedAt,
      manualEditPlayer,
      match,
      notes,
      opponentLegendId,
      playerLegendId,
      reviewOpen,
      saveState,
      saveStatus,
      setOpponentLegendId,
      setPlayerLegendId,
      setupDraft,
      setupOpen
    ]
  );

  return <MatchContext.Provider value={value}>{children}</MatchContext.Provider>;
}

export function useMatchState() {
  const context = useContext(MatchContext);

  if (!context) {
    throw new Error("useMatchState must be used within MatchProvider.");
  }

  return context;
}
