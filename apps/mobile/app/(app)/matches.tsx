import { useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { getLegendById } from "@riftbound/legends";
import type { SavedMatchSummary } from "@riftbound/db";
import { MenuScreen } from "@/components/bottom-menu";
import { useSavedMatches } from "@/lib/saved-matches";
import { colors, radius } from "@/lib/theme";

export default function MatchesScreen() {
  const { matches, status, loadMatchesIfNeeded, refreshMatches } = useSavedMatches();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMatchesIfNeeded();
  }, [loadMatchesIfNeeded]);

  async function refresh() {
    setRefreshing(true);
    await refreshMatches();
    setRefreshing(false);
  }

  return (
    <MenuScreen title="Matches" subtitle="Review matches saved from your phone.">
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.foreground} />}
      >
        {status ? <Text style={styles.status}>{status}</Text> : null}
        {matches.map((match) => (
          <View key={match.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.result}>
                {getMatchResultLabel(match.winner)} {match.player_game_wins}-{match.opponent_game_wins}
              </Text>
              <Text style={styles.date}>{new Date(match.played_at).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.legends}>
              {getLegendById(match.player_legend_id)?.name ?? match.player_legend_id} vs{" "}
              {getLegendById(match.opponent_legend_id)?.name ?? match.opponent_legend_id}
            </Text>
            {match.duration_seconds !== null ? (
              <Text style={styles.notes}>Duration {formatElapsed(match.duration_seconds)}</Text>
            ) : null}
            {match.notes ? <Text style={styles.notes} numberOfLines={2}>{match.notes}</Text> : null}
          </View>
        ))}
      </ScrollView>
    </MenuScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
    paddingBottom: 8
  },
  status: {
    color: colors.mutedForeground,
    fontSize: 14
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: 14,
    gap: 8
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  result: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: "900"
  },
  date: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: "700"
  },
  legends: {
    color: colors.cardForeground,
    fontSize: 14,
    fontWeight: "700"
  },
  notes: {
    color: colors.mutedForeground,
    fontSize: 13
  }
});

function getMatchResultLabel(winner: SavedMatchSummary["winner"]) {
  if (winner === "player") return "Win";
  if (winner === "opponent") return "Loss";
  return "Tie";
}

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
