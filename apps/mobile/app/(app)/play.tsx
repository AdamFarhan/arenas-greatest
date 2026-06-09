import { useEffect, useMemo, useState } from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  addScore,
  getActiveGame,
  getCurrentGameHistory,
  manuallyAdjustScore,
  startGame,
  type MatchState,
  type PlayerSide,
  type ScoreEventType,
  type ScoreReason,
} from "@riftbound/core";
import { buildCompletedMatchPayload, saveCompletedMatch } from "@riftbound/db";
import { LEGENDS } from "@riftbound/legends";
import { BottomMenu } from "@/components/bottom-menu";
import { Button, Card, Field } from "@/components/primitives";
import { getMobileSupabase, hasSupabaseConfig } from "@/lib/supabase";
import { useMatchState, type SetupDraft } from "@/lib/match-state";
import { useSavedMatches } from "@/lib/saved-matches";
import { useSession } from "@/lib/session";
import { colors, radius } from "@/lib/theme";

type MatchResult = PlayerSide | "tie";

export default function ScorerScreen() {
  const router = useRouter();
  const session = useSession();
  const { upsertCachedMatch } = useSavedMatches();
  const {
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
    setSaveStatus,
    elapsedSeconds,
    matchStartedAt,
    resetMatch,
  } = useMatchState();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newMatchOpen, setNewMatchOpen] = useState(false);
  const [manualEndOpen, setManualEndOpen] = useState(false);
  const [manualResult, setManualResult] = useState<MatchResult>("tie");

  const activeGame = useMemo(() => {
    try {
      return getActiveGame(match);
    } catch {
      return undefined;
    }
  }, [match]);
  const lastGame = match.games.at(-1);
  const displayGame = activeGame ?? lastGame;
  const hasStartedMatch = match.games.length > 0;
  const isBetweenGames = Boolean(lastGame?.winner && !match.winner);

  useEffect(() => {
    if (match.winner) {
      setReviewOpen(true);
    }
  }, [match]);

  function confirmGameSetup() {
    setMatch((current) =>
      startGame(current, setupDraft.startingPlayer, setupDraft.winningPoint),
    );
    setSetupOpen(false);
  }

  function score(player: PlayerSide, reason: ScoreReason) {
    setMatch((current) => addScore(current, player, reason));
  }

  function adjustScore(player: PlayerSide, nextScore: number) {
    setMatch((current) =>
      manuallyAdjustScore(current, player, Math.max(0, nextScore)),
    );
  }

  async function saveMatch(result: MatchResult | undefined = match.winner) {
    if (saveState === "saving") {
      return false;
    }

    if (saveState === "saved") {
      setSaveStatus("This match is already saved.");
      return true;
    }

    if (!result) {
      return false;
    }

    if (!playerLegendId || !opponentLegendId) {
      Alert.alert("Legends required", "Choose both legends before saving.");
      return false;
    }

    if (!hasSupabaseConfig()) {
      setSaveState("failed");
      setSaveStatus(
        "Cloud save is unavailable until Supabase env vars are configured.",
      );
      return false;
    }

    setSaveState("saving");
    setSaveStatus("Saving match...");

    const userId = session.user?.id;

    if (!userId) {
      setSaveState("failed");
      setSaveStatus("Sign in before saving a cloud match.");
      Alert.alert("Sign in required", "Sign in before saving a cloud match.");
      return false;
    }

    const tokenResult = await session.getSupabaseAccessToken().then(
      (token) => ({ token, error: null }),
      (error: unknown) => ({
        token: null,
        error: toError(error, "Could not get account token."),
      }),
    );

    if (tokenResult.error) {
      setSaveState("failed");
      setSaveStatus("Save failed while preparing your account session.");
      Alert.alert("Save failed", getErrorDetail(tokenResult.error));
      return false;
    }

    const supabase = getMobileSupabase(tokenResult.token);
    const payload = buildCompletedMatchPayload(match, {
      userId,
      playerLegendId,
      opponentLegendId,
      notes,
      winner: result,
      playedAt: matchStartedAt ?? new Date().toISOString(),
      durationSeconds: elapsedSeconds,
    });

    const { data: savedMatch, error } = await saveCompletedMatch(supabase, payload).catch(
      (error: unknown) => ({
        data: null,
        error: toError(error, "Could not save match."),
      }),
    );

    if (error || !savedMatch) {
      setSaveState("failed");
      setSaveStatus(
        "Save failed. Keep this screen open and try again when you have service.",
      );
      Alert.alert("Save failed", getErrorDetail(error ?? new Error("Could not save match.")));
      return false;
    }

    setSaveState("saved");
    setSaveStatus("Match saved.");
    upsertCachedMatch(savedMatch);
    return true;
  }

  async function saveMatchAndReturnToPlay(
    result: MatchResult | undefined = match.winner,
    onSaved?: () => void,
  ) {
    const saved = await saveMatch(result);

    if (saved) {
      onSaved?.();
      resetMatch();
      router.replace("/play");
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      {hasStartedMatch ? (
        <View style={styles.scoreboard}>
          <PlayerPanel
            inverted
            label="Opponent"
            score={displayGame?.score.opponent ?? 0}
            onScore={(reason) => score("opponent", reason)}
            onEdit={() => setManualEditPlayer("opponent")}
            disabled={!activeGame || Boolean(match.winner)}
          />

          <View style={styles.matchBar}>
            <Pressable
              style={styles.settingsButton}
              onPress={() => setSettingsOpen(true)}
            >
              <MaterialCommunityIcons
                name="cog"
                size={22}
                color={colors.cardForeground}
              />
            </Pressable>
            {isBetweenGames ? (
              <Pressable
                style={styles.nextGameButton}
                onPress={() => setSetupOpen(true)}
              >
                <Text style={styles.nextGameButtonText}>Start next game</Text>
              </Pressable>
            ) : (
              <View style={styles.statusPill}>
                <View style={styles.timerRow}>
                  <MaterialCommunityIcons
                    name="timer-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.timerText}>
                    {formatElapsed(elapsedSeconds)}
                  </Text>
                </View>
                <Text style={styles.matchBarText}>
                  Game {displayGame?.gameNumber ?? match.games.length + 1} ·
                  Match {match.wins.player}-{match.wins.opponent}
                </Text>
              </View>
            )}
            <Pressable
              style={styles.historyButton}
              onPress={() => setHistoryOpen(true)}
            >
              <Text style={styles.historyButtonText}>History</Text>
            </Pressable>
          </View>

          <PlayerPanel
            label="You"
            score={displayGame?.score.player ?? 0}
            onScore={(reason) => score("player", reason)}
            onEdit={() => setManualEditPlayer("player")}
            disabled={!activeGame || Boolean(match.winner)}
          />
        </View>
      ) : (
        <PlayEmptyState onStart={() => setSetupOpen(true)} />
      )}

      <GameSetupModal
        open={setupOpen}
        draft={setupDraft}
        onChange={setSetupDraft}
        onConfirm={confirmGameSetup}
        onClose={() => setSetupOpen(false)}
        dismissible={!hasStartedMatch || isBetweenGames}
        gameNumber={match.games.length + 1}
      />
      <HistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        match={match}
      />
      <MatchSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onEndMatch={() => {
          setSettingsOpen(false);
          setManualEndOpen(true);
        }}
        onNewMatch={() => {
          setSettingsOpen(false);
          setNewMatchOpen(true);
        }}
      />
      <ConfirmNewMatchModal
        open={newMatchOpen}
        hasUnsavedMatch={saveState === "failed"}
        onClose={() => setNewMatchOpen(false)}
        onConfirm={() => {
          setNewMatchOpen(false);
          resetMatch();
          setSetupOpen(true);
        }}
      />
      <ManualEndModal
        open={manualEndOpen}
        result={manualResult}
        playerLegendId={playerLegendId}
        opponentLegendId={opponentLegendId}
        notes={notes}
        onResultChange={setManualResult}
        onPlayerLegendChange={setPlayerLegendId}
        onOpponentLegendChange={setOpponentLegendId}
        onNotesChange={setNotes}
        onClose={() => setManualEndOpen(false)}
        onDiscard={() => {
          setManualEndOpen(false);
          resetMatch();
        }}
        onSave={() =>
          saveMatchAndReturnToPlay(manualResult, () => setManualEndOpen(false))
        }
      />
      <ManualEditModal
        player={manualEditPlayer}
        activeScore={
          manualEditPlayer && displayGame
            ? displayGame.score[manualEditPlayer]
            : 0
        }
        onClose={() => setManualEditPlayer(null)}
        onAdjust={(player, scoreValue) => adjustScore(player, scoreValue)}
      />
      <ReviewModal
        open={reviewOpen}
        match={match}
        playerLegendId={playerLegendId}
        opponentLegendId={opponentLegendId}
        notes={notes}
        saveState={saveState}
        onPlayerLegendChange={setPlayerLegendId}
        onOpponentLegendChange={setOpponentLegendId}
        onNotesChange={setNotes}
        onSave={saveMatchAndReturnToPlay}
        onReset={resetMatch}
      />
      <BottomMenu />
    </SafeAreaView>
  );
}

function toError(error: unknown, fallbackMessage = "Could not save match.") {
  if (error instanceof Error) {
    return error;
  }

  return new Error(typeof error === "string" ? error : fallbackMessage);
}

function getErrorDetail(error: Error) {
  return __DEV__ && error.stack ? error.stack : error.message;
}

function PlayerPanel({
  label,
  score,
  inverted = false,
  disabled,
  onScore,
  onEdit,
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
        {canEdit ? (
          <Text style={styles.playerStatus}>Tap score to edit</Text>
        ) : null}
      </View>
      <View style={styles.playerMain}>
        <Pressable
          onPress={onEdit}
          disabled={disabled}
          style={[styles.scorePad, disabled && styles.disabled]}
        >
          <Text style={styles.score}>{score}</Text>
        </Pressable>
      </View>
      <View style={styles.scoreControls}>
        <View style={styles.primaryScoreActions}>
          <ScoreButton
            reason="holding"
            onPress={() => onScore("holding")}
            disabled={disabled}
          />
          <ScoreButton
            reason="conquering"
            onPress={() => onScore("conquering")}
            disabled={disabled}
          />
        </View>
        <ScoreButton
          reason="ability"
          compact
          onPress={() => onScore("ability")}
          disabled={disabled}
        />
      </View>
    </View>
  );
}

function PlayEmptyState({ onStart }: { onStart: () => void }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyCard}>
        <MaterialCommunityIcons
          name="cards-playing-outline"
          size={40}
          color={colors.primary}
        />
        <Text style={styles.emptyTitle}>Ready to play?</Text>
        <Text style={styles.emptyText}>
          Start a best-of-3 match when both players are ready.
        </Text>
        <Button onPress={onStart}>Start match</Button>
      </View>
    </View>
  );
}

function ScoreButton({
  reason,
  compact = false,
  onPress,
  disabled,
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
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <MaterialCommunityIcons
        name={config.icon}
        size={compact ? 24 : 36}
        color={config.color}
      />
      <Text
        style={[
          styles.scoreButtonText,
          compact && styles.compactScoreButtonText,
        ]}
      >
        {config.label}
      </Text>
    </Pressable>
  );
}

function GameSetupModal({
  open,
  draft,
  gameNumber,
  onChange,
  onConfirm,
  onClose,
  dismissible,
}: {
  open: boolean;
  draft: SetupDraft;
  gameNumber: number;
  onChange: (draft: SetupDraft) => void;
  onConfirm: () => void;
  onClose: () => void;
  dismissible: boolean;
}) {
  const sheetProgress = useBottomSheetProgress(open);
  const visible = useModalVisibility(open);

  return (
    <Modal visible={visible} animationType="none" transparent>
      <Animated.View style={[styles.sheetBackdrop, { opacity: sheetProgress }]}>
        {dismissible ? (
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        ) : null}
        <Animated.View
          style={[styles.gameSetupSheet, getSheetAnimationStyle(sheetProgress)]}
        >
          <View style={styles.sheetHandle} />
          {dismissible ? (
            <Pressable style={styles.setupCloseButton} onPress={onClose}>
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={colors.cardForeground}
              />
            </Pressable>
          ) : null}
          <View style={styles.setupHero}>
            <View style={styles.setupIcon}>
              <MaterialCommunityIcons
                name="flag"
                size={28}
                color={colors.primary}
              />
            </View>
            <Text style={styles.setupTitle}>Game {gameNumber} setup</Text>
            <Text style={styles.setupSubtitle}>
              Choose the opener and the winning point.
            </Text>
          </View>
          <Text style={styles.sectionLabel}>Starting player</Text>
          <View style={styles.setupChoiceGrid}>
            {(["player", "opponent"] as const).map((side) => {
              const active = draft.startingPlayer === side;

              return (
                <Pressable
                  key={side}
                  style={[
                    styles.setupChoice,
                    active && styles.setupChoiceActive,
                  ]}
                  onPress={() => onChange({ ...draft, startingPlayer: side })}
                >
                  <MaterialCommunityIcons
                    name={side === "player" ? "account" : "account-group"}
                    size={30}
                    color={
                      active ? colors.primaryForeground : colors.mutedForeground
                    }
                  />
                  <Text
                    style={[
                      styles.setupChoiceTitle,
                      active && styles.setupChoiceTitleActive,
                    ]}
                  >
                    {side === "player" ? "You" : "Opponent"}
                  </Text>
                  <Text
                    style={[
                      styles.setupChoiceText,
                      active && styles.setupChoiceTextActive,
                    ]}
                  >
                    {side === "player"
                      ? "Take the first turn"
                      : "Opponent starts"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.sectionLabel}>Winning point</Text>
          <View style={styles.pointRow}>
            {([8, 9, 10] as const).map((point) => {
              const active = draft.winningPoint === point;

              return (
                <Pressable
                  key={point}
                  style={[
                    styles.pointButton,
                    active && styles.pointButtonActive,
                  ]}
                  onPress={() => onChange({ ...draft, winningPoint: point })}
                >
                  <Text
                    style={[
                      styles.pointButtonText,
                      active && styles.pointButtonTextActive,
                    ]}
                  >
                    {point}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.setupFooter}>
            <Button onPress={onConfirm}>Start game</Button>
            {dismissible ? (
              <Button variant="outline" onPress={onClose}>
                Cancel
              </Button>
            ) : null}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function HistoryModal({
  open,
  onClose,
  match,
}: {
  open: boolean;
  onClose: () => void;
  match: MatchState;
}) {
  const sheetProgress = useBottomSheetProgress(open);
  const visible = useModalVisibility(open);
  const displayGame = useMemo(() => {
    try {
      return getActiveGame(match);
    } catch {
      return match.games.at(-1);
    }
  }, [match]);
  const history = useMemo(() => {
    try {
      return displayGame ? getCurrentGameHistory(displayGame) : [];
    } catch {
      return [];
    }
  }, [displayGame]);

  return (
    <Modal visible={visible} animationType="none" transparent>
      <Animated.View style={[styles.sheetBackdrop, { opacity: sheetProgress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[styles.sheet, getSheetAnimationStyle(sheetProgress)]}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.title}>Current game history</Text>
              <Text style={styles.muted}>
                {displayGame
                  ? `Game ${displayGame.gameNumber} · ${displayGame.score.player}-${displayGame.score.opponent} · To ${displayGame.winningPoint}`
                  : "No active game"}
              </Text>
            </View>
          </View>
          <ScrollView style={styles.historyList}>
            {history.length ? (
              history.map((row) => (
                <View key={row.id} style={styles.historyRow}>
                  <View style={styles.historyPrimary}>
                    <View
                      style={[
                        styles.historyDot,
                        { backgroundColor: getEventColor(row.type) },
                      ]}
                    />
                    <View>
                      <Text style={styles.historyTitle}>
                        {row.player === "player" ? "You" : "Opponent"}
                      </Text>
                      <Text style={styles.muted}>{row.label}</Text>
                    </View>
                  </View>
                  <View style={styles.historyMeta}>
                    <Text style={styles.historyTitle}>
                      {row.pointsDelta > 0
                        ? `+${row.pointsDelta}`
                        : row.pointsDelta}
                    </Text>
                    <Text style={styles.muted}>{row.score}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.muted}>No events yet.</Text>
            )}
          </ScrollView>
          <Button variant="outline" onPress={onClose}>
            Close
          </Button>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function MatchSettingsModal({
  open,
  onClose,
  onEndMatch,
  onNewMatch,
}: {
  open: boolean;
  onClose: () => void;
  onEndMatch: () => void;
  onNewMatch: () => void;
}) {
  const sheetProgress = useBottomSheetProgress(open);
  const visible = useModalVisibility(open);

  return (
    <Modal visible={visible} animationType="none" transparent>
      <Animated.View style={[styles.sheetBackdrop, { opacity: sheetProgress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[styles.settingsSheet, getSheetAnimationStyle(sheetProgress)]}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.title}>Match settings</Text>
          <Text style={styles.muted}>Manage the current table-side match.</Text>
          <Button variant="outline" onPress={onNewMatch}>
            New match
          </Button>
          <Button variant="outline" onPress={onEndMatch}>
            End match
          </Button>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function ConfirmNewMatchModal({
  open,
  hasUnsavedMatch,
  onClose,
  onConfirm,
}: {
  open: boolean;
  hasUnsavedMatch: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const sheetProgress = useBottomSheetProgress(open);
  const visible = useModalVisibility(open);

  return (
    <Modal visible={visible} animationType="none" transparent>
      <Animated.View style={[styles.sheetBackdrop, { opacity: sheetProgress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[styles.settingsSheet, getSheetAnimationStyle(sheetProgress)]}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.title}>Start new match?</Text>
          <Text style={styles.muted}>
            {hasUnsavedMatch
              ? "This match has not uploaded. Starting a new match discards this retryable result."
              : "This discards the current match and starts again at Game 1."}
          </Text>
          <Button variant="outline" onPress={onConfirm}>
            New match
          </Button>
          <Button onPress={onClose}>Cancel</Button>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function ManualEndModal({
  open,
  result,
  playerLegendId,
  opponentLegendId,
  notes,
  onResultChange,
  onPlayerLegendChange,
  onOpponentLegendChange,
  onNotesChange,
  onClose,
  onDiscard,
  onSave,
}: {
  open: boolean;
  result: MatchResult;
  playerLegendId: string;
  opponentLegendId: string;
  notes: string;
  onResultChange: (result: MatchResult) => void;
  onPlayerLegendChange: (id: string) => void;
  onOpponentLegendChange: (id: string) => void;
  onNotesChange: (notes: string) => void;
  onClose: () => void;
  onDiscard: () => void;
  onSave: () => void | Promise<void>;
}) {
  const sheetProgress = useBottomSheetProgress(open);
  const visible = useModalVisibility(open);

  return (
    <Modal visible={visible} animationType="none" transparent>
      <Animated.View style={[styles.sheetBackdrop, { opacity: sheetProgress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[styles.manualEndSheet, getSheetAnimationStyle(sheetProgress)]}
        >
          <View style={styles.sheetHandle} />
          <ScrollView style={styles.manualEndScroll}>
            <View style={styles.manualEndContent}>
              <Text style={styles.title}>End match</Text>
              <Text style={styles.muted}>
                Save the current match with a manual result, or discard it.
              </Text>
              <Text style={styles.sectionLabel}>Result</Text>
              <View style={styles.resultGrid}>
                {(["player", "opponent", "tie"] as const).map((option) => (
                  <Button
                    key={option}
                    variant={result === option ? "primary" : "outline"}
                    onPress={() => onResultChange(option)}
                  >
                    {getResultLabel(option)}
                  </Button>
                ))}
              </View>
              <LegendPicker
                label="Your legend"
                value={playerLegendId}
                onChange={onPlayerLegendChange}
              />
              <LegendPicker
                label="Opponent legend"
                value={opponentLegendId}
                onChange={onOpponentLegendChange}
              />
              <Field
                value={notes}
                onChangeText={onNotesChange}
                placeholder="Match notes"
                multiline
              />
              <Button onPress={onSave}>Save match</Button>
              <Button variant="outline" onPress={onDiscard}>
                Discard match
              </Button>
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function ManualEditModal({
  player,
  activeScore,
  onClose,
  onAdjust,
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
          <Text style={styles.title}>
            Edit {player === "player" ? "your" : "opponent"} score
          </Text>
          <View style={styles.stepper}>
            <Pressable
              style={styles.iconButton}
              onPress={() => setDraft(Math.max(0, draft - 1))}
            >
              <Text style={styles.stepperButtonText}>-</Text>
            </Pressable>
            <Text style={styles.stepperValue}>{draft}</Text>
            <Pressable
              style={styles.iconButton}
              onPress={() => setDraft(draft + 1)}
            >
              <Text style={styles.stepperButtonText}>+</Text>
            </Pressable>
          </View>
          <View style={styles.row}>
            <Button variant="outline" onPress={onClose}>
              Cancel
            </Button>
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
  saveState,
  onPlayerLegendChange,
  onOpponentLegendChange,
  onNotesChange,
  onSave,
  onReset,
}: {
  open: boolean;
  match: MatchState;
  playerLegendId: string;
  opponentLegendId: string;
  notes: string;
  saveState: "idle" | "saving" | "saved" | "failed";
  onPlayerLegendChange: (id: string) => void;
  onOpponentLegendChange: (id: string) => void;
  onNotesChange: (notes: string) => void;
  onSave: () => void;
  onReset: () => void;
}) {
  const saveButtonLabel =
    saveState === "saving"
      ? "Saving..."
      : saveState === "failed"
        ? "Try saving again"
        : saveState === "saved"
          ? "Saved"
          : "Save match";

  return (
    <Modal visible={open} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <ScrollView style={styles.reviewCard}>
          <Card>
            <Text style={styles.title}>Match complete</Text>
            <Text style={styles.muted}>
              {match.winner === "player" ? "You won" : "Opponent won"}{" "}
              {match.wins.player}-{match.wins.opponent}
            </Text>
            <LegendPicker
              label="Your legend"
              value={playerLegendId}
              onChange={onPlayerLegendChange}
            />
            <LegendPicker
              label="Opponent legend"
              value={opponentLegendId}
              onChange={onOpponentLegendChange}
            />
            <Field
              value={notes}
              onChangeText={onNotesChange}
              placeholder="Match notes"
              multiline
            />
            <Button
              onPress={onSave}
              disabled={saveState === "saved"}
              loading={saveState === "saving"}
            >
              {saveButtonLabel}
            </Button>
            <Button
              variant="outline"
              onPress={onReset}
              disabled={saveState === "saving"}
            >
              {saveState === "saved" ? "Finish" : "Finish without saving"}
            </Button>
          </Card>
        </ScrollView>
      </View>
    </Modal>
  );
}

function LegendPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <View style={styles.legendPicker}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.legendGrid}>
        {LEGENDS.map((legend) => (
          <Pressable
            key={legend.id}
            onPress={() => onChange(legend.id)}
            style={[
              styles.legendChip,
              value === legend.id && styles.legendChipActive,
            ]}
          >
            <Text
              style={[
                styles.legendChipText,
                value === legend.id && styles.legendChipTextActive,
              ]}
            >
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
  {
    label: string;
    color: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
  }
> = {
  holding: {
    label: "Hold",
    color: colors.holding,
    icon: "shield",
  },
  conquering: {
    label: "Conquer",
    color: colors.conquering,
    icon: "sword-cross",
  },
  ability: {
    label: "Ability",
    color: colors.ability,
    icon: "lightning-bolt",
  },
};

function getEventColor(type: ScoreEventType) {
  if (type === "manual_adjustment") {
    return colors.ring;
  }

  return SCORE_REASON_META[type].color;
}

function getResultLabel(result: MatchResult) {
  if (result === "player") return "You won";
  if (result === "opponent") return "Opponent won";
  return "Tie";
}

function useBottomSheetProgress(open: boolean) {
  const progress = useMemo(() => new Animated.Value(open ? 1 : 0), []);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [open, progress]);

  return progress;
}

function useModalVisibility(open: boolean) {
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setVisible(true);
      return;
    }

    const timeout = setTimeout(() => setVisible(false), 190);
    return () => clearTimeout(timeout);
  }, [open]);

  return visible;
}

function getSheetAnimationStyle(progress: Animated.Value) {
  return {
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [280, 0],
        }),
      },
    ],
  };
}

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
    paddingBottom: 112,
  },
  authView: {
    flex: 1,
  },
  scoreboard: {
    flex: 1,
    paddingTop: 22,
    paddingBottom: 82,
  },
  emptyState: {
    flex: 1,
    padding: 16,
    paddingBottom: 112,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    width: "100%",
    maxWidth: 420,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    padding: 18,
    gap: 12,
    alignItems: "center",
  },
  emptyTitle: {
    color: colors.foreground,
    fontSize: 24,
    fontWeight: "900",
  },
  emptyText: {
    color: colors.mutedForeground,
    fontSize: 14,
    textAlign: "center",
  },
  panel: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 13,
    backgroundColor: colors.background,
    position: "relative",
  },
  inverted: {
    transform: [{ rotate: "180deg" }],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  playerLabel: {
    color: colors.mutedForeground,
    fontSize: 15,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  playerHeader: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  playerStatus: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontWeight: "700",
  },
  scorePad: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: -18 }],
  },
  playerMain: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 0,
    marginBottom: 0,
  },
  score: {
    color: colors.foreground,
    fontSize: 152,
    lineHeight: 156,
    fontWeight: "800",
  },
  scoreControls: {
    width: "100%",
    maxWidth: 292,
    height: 124,
    alignItems: "center",
    justifyContent: "flex-start",
    position: "relative",
    transform: [{ translateY: 14 }],
  },
  primaryScoreActions: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  scoreButton: {
    width: 104,
    height: 104,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
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
    gap: 4,
  },
  scoreButtonText: {
    color: colors.secondaryForeground,
    fontSize: 12,
    fontWeight: "800",
  },
  compactScoreButtonText: {
    fontSize: 8,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  matchBar: {
    minHeight: 70,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  statusPill: {
    width: 176,
    minHeight: 48,
    borderRadius: radius.xl,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: 12,
  },
  nextGameButton: {
    width: 190,
    minHeight: 48,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  nextGameButtonText: {
    color: colors.primaryForeground,
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timerText: {
    color: colors.foreground,
    fontSize: 17,
    fontWeight: "900",
  },
  matchBarText: {
    color: colors.foreground,
    fontWeight: "800",
  },
  matchMeta: {
    gap: 3,
  },
  matchSubtext: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: "700",
  },
  settingsButton: {
    position: "absolute",
    left: 14,
    top: 14,
    width: 42,
    height: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  historyButton: {
    position: "absolute",
    right: 14,
    top: 14,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.card,
  },
  historyButtonText: {
    color: colors.cardForeground,
    fontWeight: "800",
    fontSize: 12,
  },
  title: {
    color: colors.foreground,
    fontSize: 22,
    fontWeight: "800",
  },
  muted: {
    color: colors.mutedForeground,
    fontSize: 14,
  },
  sectionLabel: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: "800",
  },
  row: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
    backgroundColor: colors.backdrop,
  },
  modalCardLayer: {
    position: "relative",
  },
  modalCloseButton: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  gameSetupSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "78%",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 16,
  },
  setupCloseButton: {
    position: "absolute",
    right: 16,
    top: 16,
    width: 42,
    height: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  setupHero: {
    alignItems: "center",
    gap: 10,
    paddingTop: 20,
    paddingBottom: 8,
  },
  setupIcon: {
    width: 70,
    height: 70,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  setupTitle: {
    color: colors.foreground,
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    textTransform: "uppercase",
  },
  setupSubtitle: {
    color: colors.mutedForeground,
    fontSize: 15,
    textAlign: "center",
  },
  setupChoiceGrid: {
    flexDirection: "row",
    gap: 12,
  },
  setupChoice: {
    flex: 1,
    minHeight: 150,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
  },
  setupChoiceActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  setupChoiceTitle: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: "900",
  },
  setupChoiceTitleActive: {
    color: colors.primaryForeground,
  },
  setupChoiceText: {
    color: colors.mutedForeground,
    fontSize: 12,
    textAlign: "center",
  },
  setupChoiceTextActive: {
    color: colors.primaryForeground,
  },
  pointRow: {
    flexDirection: "row",
    gap: 10,
  },
  pointButton: {
    flex: 1,
    minHeight: 70,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  pointButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  pointButtonText: {
    color: colors.foreground,
    fontSize: 24,
    fontWeight: "900",
  },
  pointButtonTextActive: {
    color: colors.primaryForeground,
  },
  setupFooter: {
    marginTop: "auto",
    gap: 10,
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
    gap: 12,
  },
  settingsSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  manualEndSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "86%",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  manualEndScroll: {
    maxHeight: "100%",
  },
  manualEndContent: {
    gap: 12,
    paddingBottom: 4,
  },
  resultGrid: {
    flexDirection: "row",
    gap: 8,
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.backdrop,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.ring,
  },
  historyList: {
    maxHeight: 360,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  historyRow: {
    minHeight: 62,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  historyPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  historyTitle: {
    color: colors.foreground,
    fontWeight: "800",
  },
  historyMeta: {
    alignItems: "flex-end",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepperValue: {
    color: colors.foreground,
    fontSize: 56,
    fontWeight: "800",
  },
  stepperButtonText: {
    color: colors.cardForeground,
    fontSize: 24,
    fontWeight: "900",
  },
  reviewCard: {
    maxHeight: "92%",
  },
  legendPicker: {
    gap: 8,
  },
  legendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  legendChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.card,
  },
  legendChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  legendChipText: {
    color: colors.cardForeground,
    fontWeight: "700",
  },
  legendChipTextActive: {
    color: colors.primaryForeground,
  },
  disabled: {
    opacity: 0.45,
  },
});
