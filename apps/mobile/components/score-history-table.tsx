import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, Text, View } from "react-native";
import type { PlayerSide, ScoreEventType } from "@riftbound/core";
import { colors, radius } from "@/lib/theme";

export type ScoreHistoryEntry = {
  id: string;
  player: PlayerSide;
  type: ScoreEventType;
  scoreValue: number;
  previousScore?: number;
  adjustedScore?: number;
};

type ScoreHistoryTableProps = {
  entries: ScoreHistoryEntry[];
  winningPoint?: number;
  winningEntryId?: string;
  playerLabel?: string;
  opponentLabel?: string;
};

const SCORE_ENTRY_META: Record<
  Exclude<ScoreEventType, "manual_adjustment">,
  {
    color: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
  }
> = {
  holding: {
    color: colors.holding,
    icon: "shield",
  },
  conquering: {
    color: colors.conquering,
    icon: "sword-cross",
  },
  ability: {
    color: colors.ability,
    icon: "lightning-bolt",
  },
};

export function ScoreHistoryTable({
  entries,
  winningPoint,
  winningEntryId,
  playerLabel = "You",
  opponentLabel = "Opponent",
}: ScoreHistoryTableProps) {
  return (
    <View style={styles.table}>
      <View style={styles.headerRow}>
        <View style={[styles.headerCell, styles.leftCell]}>
          <Text style={styles.headerText}>{playerLabel}</Text>
        </View>
        <View style={[styles.headerCell, styles.rightCell]}>
          <Text style={styles.headerText}>{opponentLabel}</Text>
        </View>
      </View>
      <View style={styles.body}>
        {entries.map((entry) => (
          <View key={entry.id} style={styles.row}>
            <View style={[styles.cell, styles.leftCell]}>
              {entry.player === "player" ? (
                <ScoreEntry
                  entry={entry}
                  winningPoint={winningPoint}
                  winningEntryId={winningEntryId}
                />
              ) : null}
            </View>
            <View style={[styles.cell, styles.rightCell]}>
              {entry.player === "opponent" ? (
                <ScoreEntry
                  entry={entry}
                  winningPoint={winningPoint}
                  winningEntryId={winningEntryId}
                />
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function ScoreEntry({
  entry,
  winningPoint,
  winningEntryId,
}: {
  entry: ScoreHistoryEntry;
  winningPoint?: number;
  winningEntryId?: string;
}) {
  const isWinningPoint = winningEntryId
    ? entry.id === winningEntryId
    : winningPoint !== undefined && entry.scoreValue >= winningPoint;

  if (entry.type === "manual_adjustment") {
    return (
      <View style={[styles.entryChip, styles.manualEntry, isWinningPoint && styles.winningEntry]}>
        <View style={styles.entryContent}>
          <Text style={[styles.scoreText, styles.manualText, isWinningPoint && styles.winningText]}>
            {entry.adjustedScore ?? entry.scoreValue}
          </Text>
          <MaterialCommunityIcons
            name="pencil"
            size={15}
            color={isWinningPoint ? colors.primaryForeground : colors.mutedForeground}
          />
        </View>
        {isWinningPoint ? <WinningTrophy /> : null}
      </View>
    );
  }

  const meta = SCORE_ENTRY_META[entry.type];

  return (
    <View style={[styles.entryChip, { borderColor: meta.color }, isWinningPoint && styles.winningEntry]}>
      <View style={styles.entryContent}>
        <Text style={[styles.scoreText, isWinningPoint && styles.winningText]}>{entry.scoreValue}</Text>
        <MaterialCommunityIcons
          name={meta.icon}
          size={16}
          color={isWinningPoint ? colors.primaryForeground : meta.color}
        />
      </View>
      {isWinningPoint ? <WinningTrophy /> : null}
    </View>
  );
}

function WinningTrophy() {
  return (
    <MaterialCommunityIcons
      name="trophy"
      size={15}
      color={colors.primaryForeground}
      style={styles.winningTrophy}
    />
  );
}

const styles = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    minHeight: 38,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  headerCell: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  headerText: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: "900",
  },
  body: {
    paddingVertical: 4,
  },
  row: {
    minHeight: 34,
    flexDirection: "row",
  },
  cell: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  leftCell: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
    alignItems: "stretch",
  },
  rightCell: {
    alignItems: "stretch",
  },
  entryChip: {
    width: "100%",
    minHeight: 28,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 9,
    position: "relative",
  },
  entryContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  manualEntry: {
    borderStyle: "dashed",
    borderColor: colors.ring,
    backgroundColor: colors.secondary,
  },
  winningEntry: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    borderStyle: "solid",
  },
  winningTrophy: {
    position: "absolute",
    right: 9,
  },
  scoreText: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: "900",
  },
  manualText: {
    color: colors.secondaryForeground,
  },
  winningText: {
    color: colors.primaryForeground,
  },
});
