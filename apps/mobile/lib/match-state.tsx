import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
const MATCH_DRAFT_STORAGE_KEY = "riftbound.active-match-draft.v1";
const PLAYER_LEGEND_STORAGE_KEY = "riftbound.last-player-legend-id";
const OPPONENT_LEGEND_STORAGE_KEY = "riftbound.last-opponent-legend-id";

type StoredMatchDraft = {
  version: 1;
  match: MatchState;
  matchStartedAt: number;
  matchEndedAt: number | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPlayerSide(value: unknown): value is PlayerSide {
  return value === "player" || value === "opponent";
}

function isValidScore(value: unknown) {
  return (
    isRecord(value) &&
    Number.isInteger(value.player) &&
    Number.isInteger(value.opponent) &&
    Number(value.player) >= 0 &&
    Number(value.opponent) >= 0
  );
}

function isValidScoreEvent(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    Number.isInteger(value.gameNumber) &&
    isPlayerSide(value.player) &&
    ["holding", "conquering", "ability", "manual_adjustment"].includes(
      String(value.type),
    ) &&
    typeof value.pointsDelta === "number" &&
    isValidScore(value.resultingScore) &&
    typeof value.createdAt === "string"
  );
}

function isValidGame(value: unknown) {
  return (
    isRecord(value) &&
    Number.isInteger(value.gameNumber) &&
    isPlayerSide(value.startingPlayer) &&
    [8, 9, 10].includes(Number(value.winningPoint)) &&
    isValidScore(value.score) &&
    Array.isArray(value.events) &&
    value.events.every(isValidScoreEvent) &&
    (value.winner === undefined || isPlayerSide(value.winner))
  );
}

function isValidMatch(value: unknown): value is MatchState {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    Array.isArray(value.games) &&
    value.games.length > 0 &&
    value.games.every(isValidGame) &&
    isValidScore(value.wins) &&
    (value.winner === undefined || isPlayerSide(value.winner))
  );
}

function parseStoredMatchDraft(value: string | null): StoredMatchDraft | null {
  if (!value) return null;

  try {
    const draft: unknown = JSON.parse(value);

    if (
      !isRecord(draft) ||
      draft.version !== 1 ||
      !isValidMatch(draft.match) ||
      typeof draft.matchStartedAt !== "number" ||
      !Number.isFinite(draft.matchStartedAt) ||
      !(
        draft.matchEndedAt === null ||
        (typeof draft.matchEndedAt === "number" &&
          Number.isFinite(draft.matchEndedAt))
      )
    ) {
      return null;
    }

    return draft as StoredMatchDraft;
  } catch {
    return null;
  }
}

function parseTimestamp(value: string | undefined) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

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
  const [matchDraftLoaded, setMatchDraftLoaded] = useState(false);
  const draftWriteQueue = useRef(Promise.resolve());

  const queueDraftWrite = useCallback((operation: () => Promise<void>) => {
    draftWriteQueue.current = draftWriteQueue.current.then(operation, operation);
  }, []);

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

  useEffect(() => {
    let cancelled = false;

    async function loadStoredMatchDraft() {
      let storedDraft: string | null = null;

      try {
        storedDraft = await getStoredItem(MATCH_DRAFT_STORAGE_KEY);
        const draft = parseStoredMatchDraft(storedDraft);

        if (cancelled) return;

        if (draft) {
          setMatch(draft.match);
          setMatchStartedAt(draft.matchStartedAt);
          setMatchEndedAt(draft.matchEndedAt);
          setNow(Date.now());
        } else if (storedDraft) {
          await deleteStoredItem(MATCH_DRAFT_STORAGE_KEY);
        }
      } catch {
        await deleteStoredItem(MATCH_DRAFT_STORAGE_KEY).catch(() => {});
      } finally {
        if (!cancelled) {
          setMatchDraftLoaded(true);
        }
      }
    }

    void loadStoredMatchDraft();

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
    if (!matchDraftLoaded) return;

    if (match.games.length === 0) {
      queueDraftWrite(() => deleteStoredItem(MATCH_DRAFT_STORAGE_KEY));
      return;
    }

    const storedMatchStartedAt =
      matchStartedAt ?? parseTimestamp(match.games[0]?.startedAt);

    if (!storedMatchStartedAt) return;

    const storedMatchEndedAt = match.winner
      ? (matchEndedAt ?? parseTimestamp(match.games.at(-1)?.endedAt))
      : null;
    const draft: StoredMatchDraft = {
      version: 1,
      match,
      matchStartedAt: storedMatchStartedAt,
      matchEndedAt: storedMatchEndedAt,
    };

    queueDraftWrite(() =>
      setStoredItem(MATCH_DRAFT_STORAGE_KEY, JSON.stringify(draft)),
    );
  }, [
    match,
    matchDraftLoaded,
    matchEndedAt,
    matchStartedAt,
    queueDraftWrite,
  ]);

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
        queueDraftWrite(() => deleteStoredItem(MATCH_DRAFT_STORAGE_KEY));
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
      queueDraftWrite,
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
