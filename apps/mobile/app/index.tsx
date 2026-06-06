import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import {
  addScore,
  createMatch,
  getActiveGame,
  getCurrentGameHistory,
  manuallyAdjustScore,
  startGame,
  type MatchState,
  type PlayerSide,
  type ScoreReason,
  type WinningPoint
} from "@riftbound/core";
import { LEGENDS } from "@riftbound/legends";
import { Button, Card, Field } from "@/components/primitives";
import { getMobileSupabase, hasSupabaseConfig } from "@/lib/supabase";

type SetupDraft = {
  startingPlayer: PlayerSide;
  winningPoint: WinningPoint;
};

export default function ScorerScreen() {
  const [email, setEmail] = useState("");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [match, setMatch] = useState<MatchState>(() => createMatch());
  const [setupOpen, setSetupOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [manualEditPlayer, setManualEditPlayer] = useState<PlayerSide | null>(null);
  const [setupDraft, setSetupDraft] = useState<SetupDraft>({
    startingPlayer: "player",
    winningPoint: 8
  });
  const [playerLegendId, setPlayerLegendId] = useState(LEGENDS[0]?.id ?? "");
  const [opponentLegendId, setOpponentLegendId] = useState(LEGENDS[1]?.id ?? LEGENDS[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    if (!hasSupabaseConfig()) return;

    const supabase = getMobileSupabase();
    supabase.auth.getSession().then(({ data }) => setIsSignedIn(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session));
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const activeGame = useMemo(() => {
    try {
      return getActiveGame(match);
    } catch {
      return undefined;
    }
  }, [match]);

  useEffect(() => {
    if (match.winner) {
      setReviewOpen(true);
      return;
    }

    if (match.games.length > 0 && match.games.at(-1)?.winner) {
      setSetupOpen(true);
    }
  }, [match]);

  async function signIn() {
    if (!hasSupabaseConfig()) {
      setIsSignedIn(true);
      return;
    }

    const supabase = getMobileSupabase();
    const { error } = await supabase.auth.signInWithOtp({ email });
    Alert.alert(error ? "Sign in failed" : "Check your email", error?.message ?? "Open the magic link to continue.");
  }

  function confirmGameSetup() {
    setMatch((current) => startGame(current, setupDraft.startingPlayer, setupDraft.winningPoint));
    setSetupOpen(false);
  }

  function score(player: PlayerSide, reason: ScoreReason) {
    setMatch((current) => addScore(current, player, reason));
  }

  function adjustScore(player: PlayerSide, nextScore: number) {
    setMatch((current) => manuallyAdjustScore(current, player, Math.max(0, nextScore)));
  }

  async function saveMatch() {
    if (!match.winner) {
      return;
    }

    if (!playerLegendId || !opponentLegendId) {
      Alert.alert("Legends required", "Choose both legends before saving.");
      return;
    }

    if (!hasSupabaseConfig()) {
      setSaveStatus("Saved locally for demo mode. Add Supabase env vars to persist cloud data.");
      return;
    }

    const supabase = getMobileSupabase();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
      Alert.alert("Sign in required", "Sign in before saving a cloud match.");
      return;
    }

    const { data: insertedMatch, error: matchError } = await supabase
      .from("matches")
      .insert({
        user_id: userId,
        player_legend_id: playerLegendId,
        opponent_legend_id: opponentLegendId,
        notes,
        winner: match.winner,
        player_game_wins: match.wins.player,
        opponent_game_wins: match.wins.opponent
      })
      .select("id")
      .single();

    if (matchError || !insertedMatch) {
      Alert.alert("Save failed", matchError?.message ?? "Could not create match.");
      return;
    }

    for (const game of match.games) {
      if (!game.winner) continue;

      const { data: insertedGame, error: gameError } = await supabase
        .from("games")
        .insert({
          match_id: insertedMatch.id,
          game_number: game.gameNumber,
          starting_player: game.startingPlayer,
          winning_point: game.winningPoint,
          winner: game.winner,
          player_score: game.score.player,
          opponent_score: game.score.opponent
        })
        .select("id")
        .single();

      if (gameError || !insertedGame) {
        Alert.alert("Save failed", gameError?.message ?? "Could not create game.");
        return;
      }

      if (game.events.length) {
        const { error: eventsError } = await supabase.from("score_events").insert(
          game.events.map((event) => ({
            game_id: insertedGame.id,
            player_side: event.player,
            event_type: event.type,
            points_delta: event.pointsDelta,
            resulting_player_score: event.resultingScore.player,
            resulting_opponent_score: event.resultingScore.opponent,
            previous_score: event.previousScore ?? null,
            adjusted_score: event.adjustedScore ?? null,
            created_at: event.createdAt
          }))
        );

        if (eventsError) {
          Alert.alert("Save failed", eventsError.message);
          return;
        }
      }
    }

    setSaveStatus("Match saved.");
  }

  function resetMatch() {
    setMatch(createMatch());
    setNotes("");
    setSaveStatus("");
    setReviewOpen(false);
    setSetupOpen(true);
  }

  if (!isSignedIn) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centered}>
          <Card>
            <Text style={styles.title}>Riftbound Tracker</Text>
            <Text style={styles.muted}>Sign in to save match history to your account.</Text>
            <Field value={email} onChangeText={setEmail} placeholder="you@example.com" />
            <Button onPress={signIn} disabled={!email && hasSupabaseConfig()}>
              {hasSupabaseConfig() ? "Send magic link" : "Continue in demo mode"}
            </Button>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.scoreboard}>
        <PlayerPanel
          inverted
          label="Opponent"
          score={activeGame?.score.opponent ?? 0}
          onScore={(reason) => score("opponent", reason)}
          onEdit={() => setManualEditPlayer("opponent")}
          disabled={!activeGame || Boolean(match.winner)}
        />

        <View style={styles.matchBar}>
          <Text style={styles.matchBarText}>
            Game {activeGame?.gameNumber ?? match.games.length + 1} · Match {match.wins.player}-{match.wins.opponent}
          </Text>
          <Pressable style={styles.historyButton} onPress={() => setHistoryOpen(true)}>
            <Text style={styles.historyButtonText}>History</Text>
          </Pressable>
        </View>

        <PlayerPanel
          label="You"
          score={activeGame?.score.player ?? 0}
          onScore={(reason) => score("player", reason)}
          onEdit={() => setManualEditPlayer("player")}
          disabled={!activeGame || Boolean(match.winner)}
        />
      </View>

      <GameSetupModal
        open={setupOpen}
        draft={setupDraft}
        onChange={setSetupDraft}
        onConfirm={confirmGameSetup}
        gameNumber={match.games.length + 1}
      />
      <HistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} match={match} />
      <ManualEditModal
        player={manualEditPlayer}
        activeScore={manualEditPlayer && activeGame ? activeGame.score[manualEditPlayer] : 0}
        onClose={() => setManualEditPlayer(null)}
        onAdjust={(player, scoreValue) => adjustScore(player, scoreValue)}
      />
      <ReviewModal
        open={reviewOpen}
        match={match}
        playerLegendId={playerLegendId}
        opponentLegendId={opponentLegendId}
        notes={notes}
        saveStatus={saveStatus}
        onPlayerLegendChange={setPlayerLegendId}
        onOpponentLegendChange={setOpponentLegendId}
        onNotesChange={setNotes}
        onSave={saveMatch}
        onReset={resetMatch}
      />
    </SafeAreaView>
  );
}

function PlayerPanel({
  label,
  score,
  inverted = false,
  disabled,
  onScore,
  onEdit
}: {
  label: string;
  score: number;
  inverted?: boolean;
  disabled: boolean;
  onScore: (reason: ScoreReason) => void;
  onEdit: () => void;
}) {
  return (
    <View style={[styles.panel, inverted && styles.inverted]}>
      <Text style={styles.playerLabel}>{label}</Text>
      <Text style={styles.score}>{score}</Text>
      <View style={styles.scoreControls}>
        <ScoreButton label="Holding" onPress={() => onScore("holding")} disabled={disabled} />
        <ScoreButton label="Conquering" onPress={() => onScore("conquering")} disabled={disabled} />
        <ScoreButton label="Ability" onPress={() => onScore("ability")} disabled={disabled} />
        <Pressable style={styles.iconButton} onPress={onEdit} disabled={disabled}>
          <Text style={styles.iconButtonText}>Edit</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ScoreButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled: boolean }) {
  return (
    <Pressable style={[styles.scoreButton, disabled && styles.disabled]} onPress={onPress} disabled={disabled}>
      <Text style={styles.scoreButtonIcon}>+</Text>
      <Text style={styles.scoreButtonText}>{label}</Text>
    </Pressable>
  );
}

function GameSetupModal({
  open,
  draft,
  gameNumber,
  onChange,
  onConfirm
}: {
  open: boolean;
  draft: SetupDraft;
  gameNumber: number;
  onChange: (draft: SetupDraft) => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={open} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <Card>
          <Text style={styles.title}>Game {gameNumber} setup</Text>
          <Text style={styles.sectionLabel}>Starting player</Text>
          <View style={styles.row}>
            {(["player", "opponent"] as const).map((side) => (
              <Button
                key={side}
                variant={draft.startingPlayer === side ? "primary" : "outline"}
                onPress={() => onChange({ ...draft, startingPlayer: side })}
              >
                {side === "player" ? "You" : "Opponent"}
              </Button>
            ))}
          </View>
          <Text style={styles.sectionLabel}>Winning point</Text>
          <View style={styles.row}>
            {([8, 9, 10] as const).map((point) => (
              <Button
                key={point}
                variant={draft.winningPoint === point ? "primary" : "outline"}
                onPress={() => onChange({ ...draft, winningPoint: point })}
              >
                {point}
              </Button>
            ))}
          </View>
          <Button onPress={onConfirm}>Start game</Button>
        </Card>
      </View>
    </Modal>
  );
}

function HistoryModal({ open, onClose, match }: { open: boolean; onClose: () => void; match: MatchState }) {
  const history = useMemo(() => {
    try {
      return getCurrentGameHistory(getActiveGame(match));
    } catch {
      return [];
    }
  }, [match]);

  return (
    <Modal visible={open} animationType="slide" transparent>
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.title}>Current game history</Text>
        <ScrollView style={styles.historyList}>
          {history.length ? (
            history.map((row) => (
              <View key={row.id} style={styles.historyRow}>
                <View>
                  <Text style={styles.historyTitle}>{row.player === "player" ? "You" : "Opponent"}</Text>
                  <Text style={styles.muted}>{row.label}</Text>
                </View>
                <View style={styles.historyMeta}>
                  <Text style={styles.historyTitle}>{row.pointsDelta > 0 ? `+${row.pointsDelta}` : row.pointsDelta}</Text>
                  <Text style={styles.muted}>{row.score}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.muted}>No events yet.</Text>
          )}
        </ScrollView>
        <Button variant="outline" onPress={onClose}>Close</Button>
      </View>
    </Modal>
  );
}

function ManualEditModal({
  player,
  activeScore,
  onClose,
  onAdjust
}: {
  player: PlayerSide | null;
  activeScore: number;
  onClose: () => void;
  onAdjust: (player: PlayerSide, scoreValue: number) => void;
}) {
  const [draft, setDraft] = useState(activeScore);

  useEffect(() => {
    setDraft(activeScore);
  }, [activeScore, player]);

  if (!player) return null;

  return (
    <Modal visible animationType="fade" transparent>
      <View style={styles.modalBackdrop}>
        <Card>
            <Text style={styles.title}>Edit {player === "player" ? "your" : "opponent"} score</Text>
          <View style={styles.stepper}>
            <Pressable style={styles.iconButton} onPress={() => setDraft(Math.max(0, draft - 1))}>
              <Text style={styles.stepperButtonText}>-</Text>
            </Pressable>
            <Text style={styles.stepperValue}>{draft}</Text>
            <Pressable style={styles.iconButton} onPress={() => setDraft(draft + 1)}>
              <Text style={styles.stepperButtonText}>+</Text>
            </Pressable>
          </View>
          <View style={styles.row}>
            <Button variant="outline" onPress={onClose}>Cancel</Button>
            <Button
              onPress={() => {
                onAdjust(player, draft);
                onClose();
              }}
            >
              Save
            </Button>
          </View>
        </Card>
      </View>
    </Modal>
  );
}

function ReviewModal({
  open,
  match,
  playerLegendId,
  opponentLegendId,
  notes,
  saveStatus,
  onPlayerLegendChange,
  onOpponentLegendChange,
  onNotesChange,
  onSave,
  onReset
}: {
  open: boolean;
  match: MatchState;
  playerLegendId: string;
  opponentLegendId: string;
  notes: string;
  saveStatus: string;
  onPlayerLegendChange: (id: string) => void;
  onOpponentLegendChange: (id: string) => void;
  onNotesChange: (notes: string) => void;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <Modal visible={open} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <ScrollView style={styles.reviewCard}>
          <Card>
            <Text style={styles.title}>Match complete</Text>
            <Text style={styles.muted}>
              {match.winner === "player" ? "You won" : "Opponent won"} {match.wins.player}-{match.wins.opponent}
            </Text>
            <LegendPicker label="Your legend" value={playerLegendId} onChange={onPlayerLegendChange} />
            <LegendPicker label="Opponent legend" value={opponentLegendId} onChange={onOpponentLegendChange} />
            <Field value={notes} onChangeText={onNotesChange} placeholder="Match notes" multiline />
            <Button onPress={onSave}>Save match</Button>
            <Button variant="outline" onPress={onReset}>New match</Button>
            {saveStatus ? <Text style={styles.muted}>{saveStatus}</Text> : null}
          </Card>
        </ScrollView>
      </View>
    </Modal>
  );
}

function LegendPicker({ label, value, onChange }: { label: string; value: string; onChange: (id: string) => void }) {
  return (
    <View style={styles.legendPicker}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.legendGrid}>
        {LEGENDS.map((legend) => (
          <Pressable
            key={legend.id}
            onPress={() => onChange(legend.id)}
            style={[styles.legendChip, value === legend.id && styles.legendChipActive]}
          >
            <Text style={[styles.legendChipText, value === legend.id && styles.legendChipTextActive]}>
              {legend.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fafafa"
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    padding: 16
  },
  scoreboard: {
    flex: 1
  },
  panel: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 16,
    backgroundColor: "#ffffff"
  },
  inverted: {
    transform: [{ rotate: "180deg" }],
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0"
  },
  playerLabel: {
    color: "#64748b",
    fontSize: 15,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  score: {
    color: "#0f172a",
    fontSize: 108,
    lineHeight: 118,
    fontWeight: "800"
  },
  scoreControls: {
    width: "100%",
    maxWidth: 420,
    flexDirection: "row",
    gap: 8,
    alignItems: "center"
  },
  scoreButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    gap: 2
  },
  scoreButtonText: {
    color: "#0f172a",
    fontSize: 11,
    fontWeight: "800"
  },
  scoreButtonIcon: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "900"
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff"
  },
  iconButtonText: {
    color: "#0f172a",
    fontSize: 11,
    fontWeight: "800"
  },
  matchBar: {
    minHeight: 52,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fafafa",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  matchBarText: {
    color: "#0f172a",
    fontWeight: "800"
  },
  historyButton: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#ffffff"
  },
  historyButtonText: {
    color: "#0f172a",
    fontWeight: "800",
    fontSize: 12
  },
  title: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "800"
  },
  muted: {
    color: "#64748b",
    fontSize: 14
  },
  sectionLabel: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "800"
  },
  row: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center"
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
    backgroundColor: "rgba(15, 23, 42, 0.32)"
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "72%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: "#ffffff",
    padding: 16,
    gap: 12
  },
  sheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#cbd5e1"
  },
  historyList: {
    maxHeight: 360
  },
  historyRow: {
    minHeight: 58,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  historyTitle: {
    color: "#0f172a",
    fontWeight: "800"
  },
  historyMeta: {
    alignItems: "flex-end"
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  stepperValue: {
    color: "#0f172a",
    fontSize: 56,
    fontWeight: "800"
  },
  stepperButtonText: {
    color: "#0f172a",
    fontSize: 24,
    fontWeight: "900"
  },
  reviewCard: {
    maxHeight: "92%"
  },
  legendPicker: {
    gap: 8
  },
  legendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  legendChip: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#ffffff"
  },
  legendChipActive: {
    borderColor: "#0f172a",
    backgroundColor: "#0f172a"
  },
  legendChipText: {
    color: "#0f172a",
    fontWeight: "700"
  },
  legendChipTextActive: {
    color: "#f8fafc"
  },
  disabled: {
    opacity: 0.45
  }
});
