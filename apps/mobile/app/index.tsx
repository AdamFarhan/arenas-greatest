import { useEffect, useMemo, useState } from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
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
  type ScoreEventType,
  type ScoreReason,
  type WinningPoint
} from "@riftbound/core";
import { LEGENDS } from "@riftbound/legends";
import { Button, Card, Field } from "@/components/primitives";
import { getMobileSupabase, hasSupabaseConfig } from "@/lib/supabase";
import { colors, radius } from "@/lib/theme";

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
          <View style={styles.matchMeta}>
            <Text style={styles.matchBarText}>
              Game {activeGame?.gameNumber ?? match.games.length + 1} · Match {match.wins.player}-{match.wins.opponent}
            </Text>
            {activeGame ? (
              <Text style={styles.matchSubtext}>
                First: {activeGame.startingPlayer === "player" ? "You" : "Opponent"} · To {activeGame.winningPoint}
              </Text>
            ) : (
              <Text style={styles.matchSubtext}>Set up the next game</Text>
            )}
          </View>
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
  const canEdit = !disabled;

  return (
    <View style={[styles.panel, inverted && styles.inverted]}>
      <View style={styles.playerHeader}>
        <Text style={styles.playerLabel}>{label}</Text>
        {canEdit ? <Text style={styles.playerStatus}>Tap score to edit</Text> : null}
      </View>
      <View style={styles.playerMain}>
        <Pressable onPress={onEdit} disabled={disabled} style={[styles.scorePad, disabled && styles.disabled]}>
          <Text style={styles.score}>{score}</Text>
        </Pressable>
      </View>
      <View style={styles.scoreControls}>
        <View style={styles.primaryScoreActions}>
          <ScoreButton reason="holding" onPress={() => onScore("holding")} disabled={disabled} />
          <ScoreButton reason="conquering" onPress={() => onScore("conquering")} disabled={disabled} />
        </View>
        <ScoreButton reason="ability" compact onPress={() => onScore("ability")} disabled={disabled} />
      </View>
    </View>
  );
}

function ScoreButton({
  reason,
  compact = false,
  onPress,
  disabled
}: {
  reason: ScoreReason;
  compact?: boolean;
  onPress: () => void;
  disabled: boolean;
}) {
  const config = SCORE_REASON_META[reason];

  return (
    <Pressable
      style={[
        compact ? styles.compactScoreButton : styles.scoreButton,
        { borderColor: config.color },
        disabled && styles.disabled
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <MaterialCommunityIcons
        name={config.icon}
        size={compact ? 24 : 36}
        color={config.color}
      />
      <Text style={[styles.scoreButtonText, compact && styles.compactScoreButtonText]}>{config.label}</Text>
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
  const activeGame = useMemo(() => {
    try {
      return getActiveGame(match);
    } catch {
      return undefined;
    }
  }, [match]);
  const history = useMemo(() => {
    try {
      return activeGame ? getCurrentGameHistory(activeGame) : [];
    } catch {
      return [];
    }
  }, [activeGame]);

  return (
    <Modal visible={open} animationType="fade" transparent>
      <View style={styles.sheetBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.title}>Current game history</Text>
              <Text style={styles.muted}>
                {activeGame
                  ? `Game ${activeGame.gameNumber} · ${activeGame.score.player}-${activeGame.score.opponent} · To ${activeGame.winningPoint}`
                  : "No active game"}
              </Text>
            </View>
          </View>
          <ScrollView style={styles.historyList}>
            {history.length ? (
              history.map((row) => (
                <View key={row.id} style={styles.historyRow}>
                  <View style={styles.historyPrimary}>
                    <View style={[styles.historyDot, { backgroundColor: getEventColor(row.type) }]} />
                    <View>
                      <Text style={styles.historyTitle}>{row.player === "player" ? "You" : "Opponent"}</Text>
                      <Text style={styles.muted}>{row.label}</Text>
                    </View>
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

const SCORE_REASON_META: Record<
  ScoreReason,
  { label: string; color: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }
> = {
  holding: {
    label: "Hold",
    color: colors.holding,
    icon: "shield"
  },
  conquering: {
    label: "Conquer",
    color: colors.conquering,
    icon: "sword-cross"
  },
  ability: {
    label: "Ability",
    color: colors.ability,
    icon: "lightning-bolt"
  }
};

function getEventColor(type: ScoreEventType) {
  if (type === "manual_adjustment") {
    return colors.ring;
  }

  return SCORE_REASON_META[type].color;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 13,
    backgroundColor: colors.background,
    position: "relative"
  },
  inverted: {
    transform: [{ rotate: "180deg" }],
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  playerLabel: {
    color: colors.mutedForeground,
    fontSize: 15,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  playerHeader: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  playerStatus: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontWeight: "700"
  },
  scorePad: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: -28 }]
  },
  playerMain: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 0,
    marginBottom: 0
  },
  score: {
    color: colors.foreground,
    fontSize: 104,
    lineHeight: 108,
    fontWeight: "800"
  },
  scoreControls: {
    width: "100%",
    maxWidth: 292,
    height: 124,
    alignItems: "center",
    justifyContent: "flex-start",
    position: "relative"
  },
  primaryScoreActions: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  scoreButton: {
    width: 104,
    height: 104,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  compactScoreButton: {
    position: "absolute",
    left: "50%",
    bottom: 0,
    transform: [{ translateX: -31 }],
    width: 62,
    height: 62,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    gap: 4
  },
  scoreButtonText: {
    color: colors.secondaryForeground,
    fontSize: 12,
    fontWeight: "800"
  },
  compactScoreButtonText: {
    fontSize: 8
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card
  },
  matchBar: {
    minHeight: 60,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  matchBarText: {
    color: colors.foreground,
    fontWeight: "800"
  },
  matchMeta: {
    gap: 3
  },
  matchSubtext: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: "700"
  },
  historyButton: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.card
  },
  historyButtonText: {
    color: colors.cardForeground,
    fontWeight: "800",
    fontSize: 12
  },
  title: {
    color: colors.foreground,
    fontSize: 22,
    fontWeight: "800"
  },
  muted: {
    color: colors.mutedForeground,
    fontSize: 14
  },
  sectionLabel: {
    color: colors.foreground,
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
    backgroundColor: colors.backdrop
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "72%",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.backdrop
  },
  sheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.ring
  },
  historyList: {
    maxHeight: 360
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  historyRow: {
    minHeight: 62,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  historyPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 999
  },
  historyTitle: {
    color: colors.foreground,
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
    color: colors.foreground,
    fontSize: 56,
    fontWeight: "800"
  },
  stepperButtonText: {
    color: colors.cardForeground,
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
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.card
  },
  legendChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary
  },
  legendChipText: {
    color: colors.cardForeground,
    fontWeight: "700"
  },
  legendChipTextActive: {
    color: colors.primaryForeground
  },
  disabled: {
    opacity: 0.45
  }
});
