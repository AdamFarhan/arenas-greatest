import { useUserProfileModal } from "@clerk/expo";
import type { SavedMatchSummary } from "@riftbound/db";
import { getLegendById } from "@riftbound/legends";
import { useRouter } from "expo-router";
import { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { MenuScreen } from "@/components/bottom-menu";
import { Button } from "@/components/primitives";
import { useClerkRecovery } from "@/lib/clerk-recovery";
import { hasNativeClerkSession } from "@/lib/clerk-native-session";
import { useSavedMatches } from "@/lib/saved-matches";
import { useSession } from "@/lib/session";
import { colors, radius } from "@/lib/theme";

type ProfileStats = {
  totalMatches: number;
  wins: number;
  losses: number;
  ties: number;
  winRate: number | null;
  mostPlayedLegend: string | null;
  recentForm: Array<"W" | "L" | "T">;
};

export default function ProfileScreen() {
  const router = useRouter();
  const session = useSession();
  const { matches, status, isLoaded, loadMatchesIfNeeded } = useSavedMatches();
  const { requestClerkRecovery } = useClerkRecovery();
  const { isAvailable: profileModalAvailable, presentUserProfile } =
    useUserProfileModal();
  const stats = useMemo(() => buildProfileStats(matches), [matches]);
  const statsStatus = getStatsStatus(isLoaded, status, matches.length);

  useEffect(() => {
    void loadMatchesIfNeeded();
  }, [loadMatchesIfNeeded]);

  async function manageAccount() {
    await presentUserProfile();
    const hasNativeSession = await hasNativeClerkSession().catch(() => true);

    if (!hasNativeSession) {
      requestClerkRecovery();
      router.replace("/login");
    }
  }

  async function signOut() {
    await session.signOut();
    router.replace("/login");
  }

  return (
    <MenuScreen title="Profile" subtitle="Your match record and account.">
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Stats</Text>
            {statsStatus ? (
              <Text style={styles.statusText}>{statsStatus}</Text>
            ) : null}
          </View>

          <View style={styles.statGrid}>
            <StatTile label="Matches" value={String(stats.totalMatches)} />
            <StatTile label="Record" value={formatRecord(stats)} />
            <StatTile label="Win rate" value={formatWinRate(stats)} />
            <StatTile
              label="Most played"
              value={stats.mostPlayedLegend ?? "None yet"}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Recent Games</Text>
            {stats.recentForm.length ? (
              <View style={styles.formRow}>
                {stats.recentForm.map((result, index) => (
                  <View
                    key={`${result}-${index}`}
                    style={[
                      styles.formChip,
                      result === "W" && styles.winChip,
                      result === "L" && styles.lossChip,
                      result === "T" && styles.tieChip,
                    ]}
                  >
                    <Text style={styles.formChipText}>{result}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.muted}>
                Save a match to start building your tracker.
              </Text>
            )}
          </View>
        </View>

        {session.isSignedIn && profileModalAvailable ? (
          <Button variant="outline" onPress={manageAccount}>
            Manage account
          </Button>
        ) : null}

        {session.isSignedIn ? (
          <Button variant="outline" onPress={signOut}>
            Sign out
          </Button>
        ) : null}
      </View>
    </MenuScreen>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function buildProfileStats(matches: SavedMatchSummary[]): ProfileStats {
  const legendCounts = new Map<string, number>();
  let wins = 0;
  let losses = 0;
  let ties = 0;

  for (const match of matches) {
    if (match.winner === "player") wins += 1;
    if (match.winner === "opponent") losses += 1;
    if (match.winner === "tie") ties += 1;

    legendCounts.set(
      match.player_legend_id,
      (legendCounts.get(match.player_legend_id) ?? 0) + 1,
    );
  }

  const decidedMatches = wins + losses;
  const mostPlayedLegendId = [...legendCounts.entries()].sort(
    ([leftLegendId, leftCount], [rightLegendId, rightCount]) =>
      rightCount - leftCount || leftLegendId.localeCompare(rightLegendId),
  )[0]?.[0];
  const mostPlayedLegend = mostPlayedLegendId
    ? shortLegendName(
        getLegendById(mostPlayedLegendId)?.name ?? mostPlayedLegendId,
      )
    : null;
  const recentForm = [...matches]
    .sort(
      (left, right) =>
        new Date(right.played_at).getTime() -
        new Date(left.played_at).getTime(),
    )
    .slice(0, 5)
    .map((match) => {
      if (match.winner === "player") return "W";
      if (match.winner === "opponent") return "L";
      return "T";
    });

  return {
    totalMatches: matches.length,
    wins,
    losses,
    ties,
    winRate: decidedMatches ? wins / decidedMatches : null,
    mostPlayedLegend,
    recentForm,
  };
}

function formatRecord(stats: ProfileStats) {
  return `${stats.wins}-${stats.losses}-${stats.ties}`;
}

function formatWinRate(stats: ProfileStats) {
  if (stats.winRate === null) return "-";

  return `${Math.round(stats.winRate * 100)}%`;
}

function shortLegendName(name: string) {
  return name.split(",")[0] ?? name;
}

function getStatsStatus(isLoaded: boolean, status: string, matchCount: number) {
  if (!isLoaded) return "Loading your match history...";
  if (matchCount === 0)
    return status || "Save a match to start building your tracker.";
  return "";
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: 14,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    gap: 4,
  },
  label: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: "900",
  },
  value: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: "900",
  },
  muted: {
    color: colors.mutedForeground,
    fontSize: 14,
    lineHeight: 20,
  },
  statusText: {
    color: colors.mutedForeground,
    fontSize: 14,
    lineHeight: 20,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statTile: {
    width: "47.5%",
    minHeight: 82,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "space-between",
  },
  statValue: {
    color: colors.foreground,
    fontSize: 23,
    fontWeight: "900",
  },
  statLabel: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  formSection: {
    gap: 8,
  },
  formRow: {
    flexDirection: "row",
    gap: 8,
  },
  formChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary,
  },
  winChip: {
    backgroundColor: "rgba(34, 197, 94, 0.22)",
  },
  lossChip: {
    backgroundColor: "rgba(255, 100, 103, 0.2)",
  },
  tieChip: {
    backgroundColor: "rgba(161, 161, 161, 0.2)",
  },
  formChipText: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: "900",
  },
});
