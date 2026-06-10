import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { getLegendById } from "@riftbound/legends";
import { MenuScreen } from "@/components/bottom-menu";
import { useSavedMatches } from "@/lib/saved-matches";
import { colors, radius } from "@/lib/theme";

export default function MatchDetailPlaceholderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { matches, loadMatchesIfNeeded, status } = useSavedMatches();
  const match = matches.find((savedMatch) => savedMatch.id === id);

  useEffect(() => {
    loadMatchesIfNeeded();
  }, [loadMatchesIfNeeded]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <MenuScreen title="Match Details" subtitle="Full breakdown coming next.">
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable style={({ pressed }) => [styles.backButton, pressed && styles.pressed]} onPress={() => router.back()}>
            <Text style={styles.backText}>Back to matches</Text>
          </Pressable>

          {match ? (
            <View style={styles.card}>
              <Text style={styles.kicker}>{new Date(match.played_at).toLocaleString()}</Text>
              <Text style={styles.title}>
                {getLegendById(match.player_legend_id)?.name ?? match.player_legend_id} vs{" "}
                {getLegendById(match.opponent_legend_id)?.name ?? match.opponent_legend_id}
              </Text>
              <Text style={styles.score}>
                {match.player_game_wins}-{match.opponent_game_wins}
              </Text>
              <Text style={styles.muted}>
                This route is ready for notes, duration, game history, and the full match breakdown.
              </Text>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.title}>Match not loaded</Text>
              <Text style={styles.muted}>{status || "Pull to refresh from the Matches tab, then try this match again."}</Text>
            </View>
          )}
        </ScrollView>
      </MenuScreen>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
    paddingBottom: 8,
  },
  backButton: {
    alignSelf: "flex-start",
    minHeight: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  backText: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.82,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: 16,
    gap: 12,
  },
  kicker: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: {
    color: colors.foreground,
    fontSize: 22,
    fontWeight: "900",
  },
  score: {
    color: colors.foreground,
    fontSize: 42,
    fontWeight: "900",
  },
  muted: {
    color: colors.mutedForeground,
    fontSize: 14,
    lineHeight: 20,
  },
});
