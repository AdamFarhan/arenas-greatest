import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { LEGENDS, getLegendById } from "@riftbound/legends";
import {
  deleteSavedMatch,
  getSavedMatch,
  updateSavedMatch,
  type SavedMatchDetail,
  type SavedMatchSummary,
} from "@riftbound/db";
import { MenuScreen } from "@/components/bottom-menu";
import { Button, Field } from "@/components/primitives";
import {
  ScoreHistoryTable,
  type ScoreHistoryEntry,
} from "@/components/score-history-table";
import { getLegendArtSource } from "@/lib/legend-art";
import { useSavedMatches } from "@/lib/saved-matches";
import { getMobileSupabase, hasSupabaseConfig } from "@/lib/supabase";
import { useSession } from "@/lib/session";
import { colors, radius } from "@/lib/theme";

type DetailStatus = "idle" | "loading" | "loaded" | "failed";

export default function MatchDetailScreen() {
  const router = useRouter();
  const session = useSession();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    matches,
    loadMatchesIfNeeded,
    removeCachedMatch,
    upsertCachedMatch,
    status: savedMatchesStatus,
  } = useSavedMatches();
  const [detail, setDetail] = useState<SavedMatchDetail | null>(null);
  const [detailStatus, setDetailStatus] = useState<DetailStatus>("idle");
  const [detailError, setDetailError] = useState("");
  const [actionError, setActionError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const cachedMatch = useMemo(
    () => matches.find((savedMatch) => savedMatch.id === id) ?? null,
    [id, matches],
  );
  const match = detail ?? cachedMatch;
  const isLoading = detailStatus === "loading";
  const isLoadingDetailFallback = isLoading && !detail;

  useEffect(() => {
    loadMatchesIfNeeded();
  }, [loadMatchesIfNeeded]);

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      if (!id || !session.isLoaded) {
        return;
      }

      if (!hasSupabaseConfig()) {
        setDetailStatus("failed");
        setDetailError(
          "Saved match history is unavailable right now.",
        );
        return;
      }

      if (!session.isSignedIn) {
        setDetailStatus("failed");
        setDetailError("Sign in to view this match breakdown.");
        return;
      }

      setDetailStatus("loading");
      setDetailError("");

      const { data, error } = await getSavedMatch(
        getMobileSupabase(session.getSupabaseAccessToken),
        id,
      );

      if (cancelled) {
        return;
      }

      if (error || !data) {
        setDetailStatus("failed");
        setDetailError(error?.message ?? "Match not found.");
        return;
      }

      setDetail(data);
      setDetailStatus("loaded");
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [
    id,
    session.getSupabaseAccessToken,
    session.isLoaded,
    session.isSignedIn,
  ]);

  async function deleteMatch() {
    if (!id || isDeleting) {
      return;
    }

    setActionError("");
    setDeleteConfirmOpen(false);

    if (!hasSupabaseConfig()) {
      const message = "Saved match history is unavailable right now.";
      setActionError(message);
      return;
    }

    if (!session.isSignedIn) {
      const message = "Sign in to delete this match.";
      setActionError(message);
      return;
    }

    setIsDeleting(true);
    const { error } = await deleteSavedMatch(
      getMobileSupabase(session.getSupabaseAccessToken),
      id,
    );

    if (error) {
      setIsDeleting(false);
      setActionError(error.message);
      return;
    }

    removeCachedMatch(id);
    router.replace("/matches");
  }

  function confirmDeleteMatch() {
    if (isDeleting) {
      return;
    }

    setSettingsOpen(false);
    setDeleteConfirmOpen(true);
  }

  async function saveMatchEdit({
    playerLegendId,
    opponentLegendId,
    notes,
  }: {
    playerLegendId: string;
    opponentLegendId: string;
    notes: string;
  }) {
    if (!id || isSavingEdit) return;

    if (!hasSupabaseConfig()) {
      setActionError("Saved match history is unavailable right now.");
      return;
    }

    if (!session.isSignedIn) {
      setActionError("Sign in to edit this match.");
      return;
    }

    setActionError("");
    setIsSavingEdit(true);
    const { data: updatedMatch, error } = await updateSavedMatch(
      getMobileSupabase(session.getSupabaseAccessToken),
      id,
      {
        player_legend_id: playerLegendId,
        opponent_legend_id: opponentLegendId,
        notes,
      },
    );
    setIsSavingEdit(false);

    if (error || !updatedMatch) {
      setActionError(error?.message ?? "Could not update match.");
      return;
    }

    upsertCachedMatch(updatedMatch);
    setDetail((current) => (current ? { ...current, ...updatedMatch } : current));
    setEditOpen(false);
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <MenuScreen
        title="Match Details"
        subtitle="Review the full saved battle."
        headerRight={
          <MatchSettingsButton
            isOpen={settingsOpen}
            isBusy={isDeleting || isSavingEdit}
            onOpen={() => setSettingsOpen(true)}
            onClose={() => setSettingsOpen(false)}
            onEdit={() => {
              setSettingsOpen(false);
              setEditOpen(true);
            }}
            onDelete={confirmDeleteMatch}
          />
        }
      >
        <DeleteMatchDialog
          isOpen={deleteConfirmOpen}
          isDeleting={isDeleting}
          onCancel={() => setDeleteConfirmOpen(false)}
          onConfirm={() => {
            void deleteMatch();
          }}
        />
        <EditMatchDialog
          isOpen={editOpen}
          isSaving={isSavingEdit}
          match={match}
          onCancel={() => setEditOpen(false)}
          onSave={saveMatchEdit}
        />
        <ScrollView contentContainerStyle={styles.content}>
          {!match && isLoading ? <DetailSkeleton /> : null}

          {match ? (
            <>
              <MatchHero match={match} />
              {actionError ? (
                <StatusCard title="Action failed" message={actionError} />
              ) : null}
              {detailError ? (
                <StatusCard title="Limited details" message={detailError} />
              ) : null}
              {isLoadingDetailFallback ? <DetailSkeleton showHero={false} /> : null}
              {!isLoadingDetailFallback && match.notes ? (
                <NotesCard notes={match.notes} />
              ) : null}
              {detail ? <GamesSection match={detail} /> : null}
            </>
          ) : null}

          {!match && !isLoading ? (
            <StatusCard
              title="Match not loaded"
              message={
                detailError ||
                savedMatchesStatus ||
                "Open this match from Match History and try again."
              }
            />
          ) : null}
        </ScrollView>
      </MenuScreen>
    </>
  );
}

function DeleteMatchDialog({
  isOpen,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onCancel}
    >
      <View style={styles.dialogBackdrop}>
        <View style={styles.dialogCard}>
          <Text style={styles.dialogTitle}>Delete match?</Text>
          <Text style={styles.dialogText}>
            This removes the match and its game history. This cannot be undone.
          </Text>
          <View style={styles.dialogActions}>
            <Pressable
              accessibilityRole="button"
              disabled={isDeleting}
              onPress={onCancel}
              style={({ pressed }) => [
                styles.dialogButton,
                styles.cancelButton,
                pressed && !isDeleting && styles.pressed,
                isDeleting && styles.disabled,
              ]}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isDeleting}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.dialogButton,
                styles.deleteButton,
                pressed && !isDeleting && styles.pressed,
                isDeleting && styles.disabled,
              ]}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={styles.deleteButtonText}>Delete Match</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function MatchSettingsButton({
  isOpen,
  isBusy,
  onOpen,
  onClose,
  onEdit,
  onDelete,
}: {
  isOpen: boolean;
  isBusy: boolean;
  onOpen: () => void;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open match settings"
        disabled={isBusy}
        onPress={onOpen}
        style={({ pressed }) => [
          styles.settingsButton,
          pressed && !isBusy && styles.pressed,
          isBusy && styles.disabled,
        ]}
      >
        {isBusy ? (
          <ActivityIndicator size="small" color={colors.foreground} />
        ) : (
          <MaterialCommunityIcons
            name="cog"
            size={20}
            color={colors.mutedForeground}
          />
        )}
      </Pressable>
      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={onClose}
      >
        <Pressable style={styles.menuBackdrop} onPress={onClose}>
          <View style={styles.settingsMenu}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit match"
              disabled={isBusy}
              onPress={onEdit}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && !isBusy && styles.pressed,
                isBusy && styles.disabled,
              ]}
            >
              <MaterialCommunityIcons
                name="pencil-outline"
                size={20}
                color={colors.foreground}
              />
              <Text style={styles.menuItemText}>Edit Match</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete match"
              disabled={isBusy}
              onPress={onDelete}
              style={({ pressed }) => [
                styles.deleteMenuItem,
                pressed && !isBusy && styles.pressed,
                isBusy && styles.disabled,
              ]}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={20}
                color={colors.destructive}
              />
              <Text style={styles.deleteMenuText}>Delete Match</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function EditMatchDialog({
  isOpen,
  isSaving,
  match,
  onCancel,
  onSave,
}: {
  isOpen: boolean;
  isSaving: boolean;
  match: SavedMatchSummary | null;
  onCancel: () => void;
  onSave: (values: {
    playerLegendId: string;
    opponentLegendId: string;
    notes: string;
  }) => void;
}) {
  const [playerLegendId, setPlayerLegendId] = useState("");
  const [opponentLegendId, setOpponentLegendId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!isOpen || !match) return;
    setPlayerLegendId(match.player_legend_id);
    setOpponentLegendId(match.opponent_legend_id);
    setNotes(match.notes ?? "");
  }, [isOpen, match]);

  if (!isOpen || !match) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.editBackdrop}>
        <ScrollView contentContainerStyle={styles.editScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.editCard}>
            <Text style={styles.dialogTitle}>Edit match</Text>
            <Text style={styles.dialogText}>Update the legends and notes for this saved match.</Text>
            <LegendPicker label="Your legend" value={playerLegendId} onChange={setPlayerLegendId} />
            <LegendPicker label="Opponent legend" value={opponentLegendId} onChange={setOpponentLegendId} />
            <Field value={notes} onChangeText={setNotes} placeholder="Match notes" multiline />
            <Button
              onPress={() => onSave({ playerLegendId, opponentLegendId, notes })}
              disabled={isSaving || !playerLegendId || !opponentLegendId}
              loading={isSaving}
            >
              Save changes
            </Button>
            <Button variant="outline" onPress={onCancel} disabled={isSaving}>
              Cancel
            </Button>
          </View>
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
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedLegend = LEGENDS.find((legend) => legend.id === value);
  const filteredLegends = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return normalizedQuery
      ? LEGENDS.filter((legend) => legend.name.toLowerCase().includes(normalizedQuery))
      : LEGENDS;
  }, [query]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  return (
    <View style={styles.legendPicker}>
      <Text style={styles.legendPickerLabel}>{label}</Text>
      <Pressable onPress={() => setOpen(true)} style={({ pressed }) => [styles.legendSelect, pressed && styles.pressed]}>
        <Text style={styles.legendSelectText}>{selectedLegend?.name ?? "Choose legend"}</Text>
        <MaterialCommunityIcons name="chevron-right" size={22} color={colors.mutedForeground} />
      </Pressable>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.legendSelectScreen}>
          <View style={styles.legendSelectHeader}>
            <Pressable accessibilityLabel="Close legend picker" onPress={() => setOpen(false)} style={styles.legendSelectClose}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.foreground} />
            </Pressable>
            <Text style={styles.legendSelectTitle}>{label}</Text>
          </View>
          <TextInput value={query} onChangeText={setQuery} placeholder="Search legends" placeholderTextColor={colors.mutedForeground} autoCapitalize="none" autoCorrect={false} style={styles.legendSearch} />
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.legendSelectList}>
            {filteredLegends.map((legend) => {
              const isSelected = value === legend.id;
              return (
                <Pressable key={legend.id} onPress={() => { onChange(legend.id); setOpen(false); }} style={({ pressed }) => [styles.legendSelectOption, isSelected && styles.legendSelectOptionActive, pressed && styles.pressed]}>
                  <Text style={[styles.legendSelectOptionText, isSelected && styles.legendSelectOptionTextActive]}>{legend.name}</Text>
                  {isSelected ? <MaterialCommunityIcons name="check" size={22} color={colors.primaryForeground} /> : null}
                </Pressable>
              );
            })}
            {filteredLegends.length === 0 ? <Text style={styles.legendNoResults}>No legends found</Text> : null}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function MatchHero({ match }: { match: SavedMatchSummary }) {
  const playerLegend = getLegendById(match.player_legend_id);
  const opponentLegend = getLegendById(match.opponent_legend_id);
  const result = getMatchResult(match);

  return (
    <View style={styles.heroCard}>
      <View style={styles.heroTop}>
        <LegendAvatar
          legendId={match.player_legend_id}
          name={playerLegend?.name ?? match.player_legend_id}
          size={88}
        />
        <View style={styles.heroScoreWrap}>
          <Text style={styles.matchupTitle} numberOfLines={2}>
            {shortLegendName(playerLegend?.name ?? match.player_legend_id)} vs{" "}
            {shortLegendName(opponentLegend?.name ?? match.opponent_legend_id)}
          </Text>
          <Text style={styles.heroScore}>
            {match.player_game_wins}-{match.opponent_game_wins}
          </Text>
          <Text
            style={[
              styles.resultPill,
              result.kind === "win" && styles.winText,
              result.kind === "loss" && styles.lossText,
            ]}
          >
            {result.label}
          </Text>
        </View>
        <LegendAvatar
          legendId={match.opponent_legend_id}
          name={opponentLegend?.name ?? match.opponent_legend_id}
          size={88}
        />
      </View>

      <View style={styles.matchupText}>
        <Text style={styles.metaText}>{formatDateTime(match.played_at)}</Text>
        {match.duration_seconds !== null ? (
          <Text style={styles.metaText}>
            Duration {formatElapsed(match.duration_seconds)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function NotesCard({ notes }: { notes: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Notes</Text>
      <Text style={styles.notesText}>{notes}</Text>
    </View>
  );
}

function GamesSection({ match }: { match: SavedMatchDetail }) {
  if (!match.games.length) {
    return (
      <StatusCard
        title="No games saved"
        message="This match does not have saved game history."
      />
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Game History</Text>
      {match.games.map((game) => {
        const entries = toScoreHistoryEntries(game.events);
        const winnerLabel = getGameResultLabel(game);
        const winningEntryId = getConcessionWinningEntryId(game);

        return (
          <View key={game.id} style={styles.gameCard}>
            <View style={styles.gameHeader}>
              <View style={styles.gameHeaderText}>
                <Text style={styles.gameTitle}>Game {game.game_number}</Text>
                <Text style={styles.metaText}>
                  {winnerLabel} · First turn{" "}
                  {game.starting_player === "player" ? "you" : "opponent"} · To{" "}
                  {game.winning_point}
                </Text>
                {game.duration_seconds !== null ? (
                  <Text style={styles.metaText}>
                    Duration {formatElapsed(game.duration_seconds)}
                  </Text>
                ) : null}
              </View>
              <View style={styles.gameScoreBlock}>
                <Text style={styles.gameScore}>
                  {game.player_score}-{game.opponent_score}
                </Text>
                <Text style={styles.eventCount}>
                  {game.events.length}{" "}
                  {game.events.length === 1 ? "event" : "events"}
                </Text>
              </View>
            </View>

            {entries.length ? (
              <ScoreHistoryTable
                entries={entries}
                winningPoint={
                  game.end_reason === "concession"
                    ? undefined
                    : game.winning_point
                }
                winningEntryId={winningEntryId}
              />
            ) : (
              <Text style={styles.muted}>
                No score events saved for this game.
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

function StatusCard({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.muted}>{message}</Text>
    </View>
  );
}

function DetailSkeleton({ showHero = true }: { showHero?: boolean }) {
  const opacity = useRef(new Animated.Value(0.48)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.86,
          duration: 760,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.48,
          duration: 760,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <>
      {showHero ? (
        <View style={styles.skeletonHero}>
          <SkeletonBlock
            animatedOpacity={opacity}
            style={styles.skeletonAvatar}
          />
          <View style={styles.skeletonScoreStack}>
            <SkeletonBlock
              animatedOpacity={opacity}
              style={styles.skeletonTinyLine}
            />
            <SkeletonBlock
              animatedOpacity={opacity}
              style={styles.skeletonScore}
            />
          </View>
          <SkeletonBlock
            animatedOpacity={opacity}
            style={styles.skeletonAvatar}
          />
        </View>
      ) : null}
      <View style={styles.card}>
        <SkeletonBlock
          animatedOpacity={opacity}
          style={styles.skeletonSectionTitle}
        />
        <SkeletonBlock
          animatedOpacity={opacity}
          style={styles.skeletonNoteLine}
        />
        <SkeletonBlock
          animatedOpacity={opacity}
          style={styles.skeletonNoteShortLine}
        />
      </View>
      <View style={styles.section}>
        <SkeletonBlock
          animatedOpacity={opacity}
          style={styles.skeletonSectionTitle}
        />
        {[0, 1].map((gameIndex) => (
          <View key={gameIndex} style={styles.gameCard}>
            <View style={styles.gameHeader}>
              <View style={styles.gameHeaderText}>
                <SkeletonBlock
                  animatedOpacity={opacity}
                  style={styles.skeletonGameTitle}
                />
                <SkeletonBlock
                  animatedOpacity={opacity}
                  style={styles.skeletonGameMeta}
                />
              </View>
              <View style={styles.gameScoreBlock}>
                <SkeletonBlock
                  animatedOpacity={opacity}
                  style={styles.skeletonGameScore}
                />
                <SkeletonBlock
                  animatedOpacity={opacity}
                  style={styles.skeletonEventCount}
                />
              </View>
            </View>
            <View style={styles.skeletonHistoryTable}>
              <View style={styles.skeletonHistoryHeader}>
                <SkeletonBlock
                  animatedOpacity={opacity}
                  style={styles.skeletonHistoryHeaderCell}
                />
                <SkeletonBlock
                  animatedOpacity={opacity}
                  style={styles.skeletonHistoryHeaderCell}
                />
              </View>
              {[0, 1, 2].map((rowIndex) => (
                <View key={rowIndex} style={styles.skeletonHistoryRow}>
                  <View
                    style={[
                      styles.skeletonHistoryCell,
                      styles.skeletonHistoryLeftCell,
                    ]}
                  >
                    {rowIndex % 2 === 0 ? (
                      <SkeletonBlock
                        animatedOpacity={opacity}
                        style={styles.skeletonHistoryChip}
                      />
                    ) : null}
                  </View>
                  <View style={styles.skeletonHistoryCell}>
                    {rowIndex % 2 === 1 ? (
                      <SkeletonBlock
                        animatedOpacity={opacity}
                        style={styles.skeletonHistoryChip}
                      />
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

function SkeletonBlock({
  animatedOpacity,
  style,
}: {
  animatedOpacity: Animated.Value;
  style: object;
}) {
  return (
    <Animated.View
      style={[styles.skeletonBlock, style, { opacity: animatedOpacity }]}
    />
  );
}

function LegendAvatar({
  legendId,
  name,
  size,
}: {
  legendId: string;
  name: string;
  size: number;
}) {
  const art = getLegendArtSource(legendId);
  const initials = shortLegendName(name)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      {art ? (
        <Image source={art} style={styles.avatarImage} resizeMode="cover" />
      ) : (
        <View style={styles.avatarFallback}>
          <Text
            style={[
              styles.avatarInitials,
              { fontSize: Math.max(14, size * 0.28) },
            ]}
          >
            {initials}
          </Text>
        </View>
      )}
    </View>
  );
}

function toScoreHistoryEntries(
  events: SavedMatchDetail["games"][number]["events"],
): ScoreHistoryEntry[] {
  return events.map((event) => ({
    id: event.id,
    player: event.player_side,
    type: event.event_type,
    scoreValue:
      event.player_side === "player"
        ? event.resulting_player_score
        : event.resulting_opponent_score,
    previousScore: event.previous_score ?? undefined,
    adjustedScore: event.adjusted_score ?? undefined,
  }));
}

function getGameResultLabel(game: SavedMatchDetail["games"][number]) {
  if (game.end_reason === "concession") {
    return game.winner === "player" ? "Opponent conceded" : "You conceded";
  }

  return game.winner === "player" ? "You won" : "Opponent won";
}

function getConcessionWinningEntryId(game: SavedMatchDetail["games"][number]) {
  if (game.end_reason !== "concession") {
    return undefined;
  }

  const winner = game.winner;

  return [...game.events]
    .reverse()
    .find((event) => event.player_side === winner)?.id;
}

function getMatchResult(match: SavedMatchSummary) {
  if (match.winner === "player") return { kind: "win", label: "Victory" };
  if (match.winner === "opponent") return { kind: "loss", label: "Defeat" };
  return { kind: "tie", label: "Tie" };
}

function shortLegendName(name: string) {
  return name.split(",")[0] ?? name;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatElapsed(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
    paddingBottom: 8,
  },
  heroCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: 16,
    gap: 16,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  heroScoreWrap: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  resultPill: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  winText: {
    color: "#4ade80",
  },
  lossText: {
    color: colors.destructive,
  },
  heroScore: {
    color: colors.foreground,
    fontSize: 44,
    fontWeight: "900",
  },
  matchupText: {
    alignItems: "center",
    gap: 6,
  },
  matchupTitle: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 22,
    textAlign: "center",
  },
  metaText: {
    color: colors.mutedForeground,
    fontSize: 13,
    fontWeight: "700",
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: 16,
    gap: 10,
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.28)",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 96,
  },
  settingsMenu: {
    minWidth: 190,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: 6,
  },
  menuItem: {
    minHeight: 46,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
  },
  menuItemText: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "800",
  },
  deleteMenuItem: {
    minHeight: 46,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
  },
  deleteMenuText: {
    color: colors.destructive,
    fontSize: 14,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.78,
  },
  disabled: {
    opacity: 0.5,
  },
  dialogBackdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  editBackdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
  },
  editScroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  editCard: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    padding: 18,
    gap: 14,
  },
  dialogCard: {
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    padding: 18,
    gap: 14,
  },
  dialogTitle: {
    color: colors.foreground,
    fontSize: 22,
    fontWeight: "900",
  },
  dialogText: {
    color: colors.mutedForeground,
    fontSize: 15,
    lineHeight: 22,
  },
  dialogActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    paddingTop: 4,
  },
  dialogButton: {
    minHeight: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  deleteButton: {
    minWidth: 132,
    backgroundColor: colors.destructive,
  },
  cancelButtonText: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "800",
  },
  deleteButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: "900",
  },
  legendPicker: {
    gap: 8,
  },
  legendPickerLabel: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "800",
  },
  legendSelect: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 12,
  },
  legendSelectText: {
    flex: 1,
    color: colors.foreground,
    fontSize: 15,
    fontWeight: "700",
  },
  legendSelectScreen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 56,
  },
  legendSelectHeader: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
  },
  legendSelectClose: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  legendSelectTitle: {
    color: colors.foreground,
    fontSize: 19,
    fontWeight: "900",
  },
  legendSearch: {
    minHeight: 46,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    color: colors.foreground,
    fontSize: 15,
    paddingHorizontal: 12,
  },
  legendSelectList: {
    gap: 8,
    padding: 16,
    paddingBottom: 32,
  },
  legendSelectOption: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 14,
  },
  legendSelectOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  legendSelectOptionText: {
    flex: 1,
    color: colors.foreground,
    fontSize: 15,
    fontWeight: "700",
  },
  legendSelectOptionTextActive: {
    color: colors.primaryForeground,
  },
  legendNoResults: {
    color: colors.mutedForeground,
    fontSize: 15,
    textAlign: "center",
    paddingVertical: 24,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.foreground,
    fontSize: 17,
    fontWeight: "900",
  },
  notesText: {
    color: colors.foreground,
    fontSize: 14,
    lineHeight: 21,
  },
  muted: {
    color: colors.mutedForeground,
    fontSize: 14,
    lineHeight: 20,
  },
  gameCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: 12,
    gap: 12,
  },
  gameHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  gameHeaderText: {
    flex: 1,
    gap: 4,
  },
  gameTitle: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: "900",
  },
  gameScoreBlock: {
    alignItems: "flex-end",
    gap: 2,
  },
  gameScore: {
    color: colors.foreground,
    fontSize: 24,
    fontWeight: "900",
  },
  eventCount: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  avatar: {
    overflow: "hidden",
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatarImage: {
    position: "absolute",
    left: "-5%",
    top: "-8%",
    width: "110%",
    height: "154%",
  },
  avatarFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary,
  },
  avatarInitials: {
    color: colors.foreground,
    fontWeight: "900",
  },
  skeletonBlock: {
    backgroundColor: colors.muted,
  },
  skeletonHero: {
    minHeight: 170,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  skeletonAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: colors.border,
  },
  skeletonScoreStack: {
    flex: 1,
    alignItems: "center",
    gap: 10,
  },
  skeletonTinyLine: {
    width: 62,
    height: 12,
    borderRadius: radius.md,
  },
  skeletonScore: {
    width: 80,
    height: 44,
    borderRadius: radius.md,
  },
  skeletonSectionTitle: {
    width: 112,
    height: 20,
    borderRadius: radius.md,
  },
  skeletonNoteLine: {
    width: "100%",
    height: 16,
    borderRadius: radius.md,
  },
  skeletonNoteShortLine: {
    width: "68%",
    height: 16,
    borderRadius: radius.md,
  },
  skeletonGameTitle: {
    width: 76,
    height: 20,
    borderRadius: radius.md,
  },
  skeletonGameMeta: {
    width: "92%",
    height: 14,
    borderRadius: radius.md,
  },
  skeletonGameScore: {
    width: 52,
    height: 28,
    borderRadius: radius.md,
  },
  skeletonEventCount: {
    width: 58,
    height: 12,
    borderRadius: radius.md,
  },
  skeletonHistoryTable: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    overflow: "hidden",
  },
  skeletonHistoryHeader: {
    minHeight: 38,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 18,
  },
  skeletonHistoryHeaderCell: {
    flex: 1,
    height: 14,
    borderRadius: radius.md,
  },
  skeletonHistoryRow: {
    minHeight: 34,
    flexDirection: "row",
  },
  skeletonHistoryCell: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  skeletonHistoryLeftCell: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  skeletonHistoryChip: {
    width: "100%",
    height: 28,
    borderRadius: radius.md,
  },
});
