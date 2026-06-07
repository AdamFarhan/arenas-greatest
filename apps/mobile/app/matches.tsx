import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { getLegendById } from "@riftbound/legends";
import { MenuScreen } from "@/components/bottom-menu";
import { getMobileSupabase, hasSupabaseConfig } from "@/lib/supabase";
import { useSession } from "@/lib/session";
import { colors, radius } from "@/lib/theme";
import type { Database } from "@riftbound/db";

type MatchRow = Database["public"]["Tables"]["matches"]["Row"];

export default function MatchesScreen() {
  const session = useSession();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [status, setStatus] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadMatches = useCallback(async () => {
    if (!hasSupabaseConfig()) {
      setStatus("Demo mode is active. Add Supabase env vars to load saved matches.");
      setMatches([]);
      return;
    }

    if (!session.isSignedIn) {
      setStatus("Sign in to view saved matches.");
      setMatches([]);
      return;
    }

    const { data, error } = await getMobileSupabase()
      .from("matches")
      .select("*")
      .order("played_at", { ascending: false });

    if (error) {
      setStatus(error.message);
      return;
    }

    setMatches(data ?? []);
    setStatus(data?.length ? "" : "No saved matches yet.");
  }, [session.isSignedIn]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  useFocusEffect(
    useCallback(() => {
      loadMatches();
    }, [loadMatches])
  );

  async function refresh() {
    setRefreshing(true);
    await loadMatches();
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

function getMatchResultLabel(winner: MatchRow["winner"]) {
  if (winner === "player") return "Win";
  if (winner === "opponent") return "Loss";
  return "Tie";
}
