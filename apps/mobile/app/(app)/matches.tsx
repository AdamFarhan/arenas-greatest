import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { getLegendById } from "@riftbound/legends";
import type { SavedMatchSummary } from "@riftbound/db";
import { MenuScreen } from "@/components/bottom-menu";
import { getLegendArtSource } from "@/lib/legend-art";
import { useSavedMatches } from "@/lib/saved-matches";
import { colors, radius } from "@/lib/theme";

type LegendMatchGroup = {
  legendId: string;
  legendName: string;
  latestPlayedAt: number;
  matches: SavedMatchSummary[];
};

type TimeMatchGroup = {
  key: string;
  label: string;
  latestPlayedAt: number;
  legends: LegendMatchGroup[];
};

export default function MatchesScreen() {
  const router = useRouter();
  const { matches, status, isLoaded, loadMatchesIfNeeded, refreshMatches } =
    useSavedMatches();
  const [refreshing, setRefreshing] = useState(false);
  const groupedMatches = useMemo(() => groupMatches(matches), [matches]);
  const initialLoading = !isLoaded && matches.length === 0;

  useEffect(() => {
    loadMatchesIfNeeded();
  }, [loadMatchesIfNeeded]);

  async function refresh() {
    setRefreshing(true);
    await refreshMatches();
    setRefreshing(false);
  }

  return (
    <MenuScreen title="Matches" subtitle="A broad look at your latest battles.">
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.foreground}
          />
        }
      >
        {initialLoading ? <MatchHistorySkeleton /> : null}
        {!initialLoading && status ? (
          <Text style={styles.status}>{status}</Text>
        ) : null}
        {!initialLoading &&
          groupedMatches.map((timeGroup) => (
            <View key={timeGroup.key} style={styles.timeGroup}>
              <Text style={styles.timeLabel}>{timeGroup.label}</Text>
              {timeGroup.legends.map((legendGroup) => (
                <View
                  key={`${timeGroup.key}-${legendGroup.legendId}`}
                  style={styles.legendGroup}
                >
                  <View style={styles.legendHeader}>
                    <LegendAvatar
                      legendId={legendGroup.legendId}
                      name={legendGroup.legendName}
                      size={42}
                    />
                    <View style={styles.legendHeaderText}>
                      <Text style={styles.legendTitle}>
                        {shortLegendName(legendGroup.legendName)}
                      </Text>
                      <Text style={styles.legendMeta}>
                        {legendGroup.matches.length}{" "}
                        {legendGroup.matches.length === 1 ? "match" : "matches"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cards}>
                    {legendGroup.matches.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        onPress={() =>
                          router.push({
                            pathname: "/matches/[id]",
                            params: { id: match.id },
                          })
                        }
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ))}
      </ScrollView>
    </MenuScreen>
  );
}

function MatchHistorySkeleton() {
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
      <SkeletonBlock
        animatedOpacity={opacity}
        style={styles.skeletonTimeTitle}
      />
      {[0, 1].map((groupIndex) => (
        <View key={groupIndex} style={styles.legendGroup}>
          <View style={styles.legendHeader}>
            <SkeletonBlock
              animatedOpacity={opacity}
              style={styles.skeletonLegendAvatar}
            />
            <View style={styles.skeletonLegendText}>
              <SkeletonBlock
                animatedOpacity={opacity}
                style={styles.skeletonLegendTitle}
              />
              <SkeletonBlock
                animatedOpacity={opacity}
                style={styles.skeletonLegendMeta}
              />
            </View>
          </View>
          <View style={styles.cards}>
            {[0, 1].map((cardIndex) => (
              <View key={cardIndex} style={styles.skeletonCard}>
                <View style={styles.skeletonCardHero}>
                  <SkeletonBlock
                    animatedOpacity={opacity}
                    style={styles.skeletonArtBlock}
                  />
                </View>
                <View style={styles.skeletonCardBody}>
                  <SkeletonBlock
                    animatedOpacity={opacity}
                    style={styles.skeletonOpponent}
                  />
                  <SkeletonBlock
                    animatedOpacity={opacity}
                    style={styles.skeletonTime}
                  />
                </View>
                <View style={styles.skeletonScoreBlock}>
                  <SkeletonBlock
                    animatedOpacity={opacity}
                    style={styles.skeletonScore}
                  />
                  <SkeletonBlock
                    animatedOpacity={opacity}
                    style={styles.skeletonResult}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
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

function MatchCard({
  match,
  onPress,
}: {
  match: SavedMatchSummary;
  onPress: () => void;
}) {
  const playerLegend = getLegendById(match.player_legend_id);
  const opponentLegend = getLegendById(match.opponent_legend_id);
  const result = getMatchResult(match);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${playerLegend?.name ?? match.player_legend_id} match`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.cardHero}>
        <LegendAvatar
          legendId={match.player_legend_id}
          name={playerLegend?.name ?? match.player_legend_id}
          size={58}
        />
        <View style={styles.versusPill}>
          <Text style={styles.versusText}>VS</Text>
        </View>
        <LegendAvatar
          legendId={match.opponent_legend_id}
          name={opponentLegend?.name ?? match.opponent_legend_id}
          size={58}
        />
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.opponent} numberOfLines={1}>
          {shortLegendName(opponentLegend?.name ?? match.opponent_legend_id)}
        </Text>
        <Text style={styles.playedAt}>{formatTime(match.played_at)}</Text>
      </View>

      <View style={styles.scoreBlock}>
        <Text style={styles.score}>
          {match.player_game_wins}-{match.opponent_game_wins}
        </Text>
        <Text
          style={[
            styles.result,
            result.kind === "win" && styles.win,
            result.kind === "loss" && styles.loss,
          ]}
        >
          {result.label}
        </Text>
      </View>
    </Pressable>
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
              { fontSize: Math.max(12, size * 0.3) },
            ]}
          >
            {initials}
          </Text>
        </View>
      )}
    </View>
  );
}

function groupMatches(matches: SavedMatchSummary[]): TimeMatchGroup[] {
  const timeGroups = new Map<string, TimeMatchGroup>();

  for (const match of matches) {
    const playedAt = new Date(match.played_at);
    const timeKey = getDateKey(playedAt);
    const latestPlayedAt = playedAt.getTime();
    const timeGroup =
      timeGroups.get(timeKey) ??
      ({
        key: timeKey,
        label: getDateLabel(playedAt),
        latestPlayedAt,
        legends: [],
      } satisfies TimeMatchGroup);

    timeGroup.latestPlayedAt = Math.max(
      timeGroup.latestPlayedAt,
      latestPlayedAt,
    );
    const legend = getLegendById(match.player_legend_id);
    let legendGroup = timeGroup.legends.find(
      (group) => group.legendId === match.player_legend_id,
    );
    if (!legendGroup) {
      legendGroup = {
        legendId: match.player_legend_id,
        legendName: legend?.name ?? match.player_legend_id,
        latestPlayedAt,
        matches: [],
      };
      timeGroup.legends.push(legendGroup);
    }

    legendGroup.latestPlayedAt = Math.max(
      legendGroup.latestPlayedAt,
      latestPlayedAt,
    );
    legendGroup.matches.push(match);
    timeGroups.set(timeKey, timeGroup);
  }

  return [...timeGroups.values()]
    .sort((left, right) => right.latestPlayedAt - left.latestPlayedAt)
    .map((timeGroup) => ({
      ...timeGroup,
      legends: timeGroup.legends
        .sort((left, right) => right.latestPlayedAt - left.latestPlayedAt)
        .map((legendGroup) => ({
          ...legendGroup,
          matches: legendGroup.matches.sort(
            (left, right) =>
              new Date(right.played_at).getTime() -
              new Date(left.played_at).getTime(),
          ),
        })),
    }));
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function getDateLabel(date: Date) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (getDateKey(date) === getDateKey(today)) return "Today";
  if (getDateKey(date) === getDateKey(yesterday)) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function getMatchResult(match: SavedMatchSummary) {
  if (match.winner === "player") return { kind: "win", label: "Victory" };
  if (match.winner === "opponent") return { kind: "loss", label: "Defeat" };
  return { kind: "tie", label: "Tie" };
}

function shortLegendName(name: string) {
  return name.split(",")[0] ?? name;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

const styles = StyleSheet.create({
  list: {
    gap: 22,
    paddingBottom: 8,
  },
  status: {
    color: colors.mutedForeground,
    fontSize: 14,
  },
  skeletonBlock: {
    backgroundColor: colors.muted,
  },
  skeletonTimeTitle: {
    width: 96,
    height: 28,
    borderRadius: radius.md,
  },
  timeGroup: {
    gap: 14,
  },
  timeLabel: {
    color: colors.foreground,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0,
  },
  legendGroup: {
    gap: 10,
  },
  legendHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  legendHeaderText: {
    flex: 1,
    gap: 2,
  },
  legendTitle: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: "900",
  },
  legendMeta: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  cards: {
    gap: 10,
  },
  card: {
    minHeight: 112,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pressed: {
    opacity: 0.82,
  },
  cardHero: {
    width: 126,
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
  },
  versusPill: {
    width: 30,
    height: 26,
    borderRadius: 13,
    marginHorizontal: -8,
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  versusText: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: "900",
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  opponent: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: "900",
  },
  playedAt: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: "700",
  },
  scoreBlock: {
    minWidth: 72,
    alignItems: "flex-end",
    gap: 4,
  },
  score: {
    color: colors.foreground,
    fontSize: 28,
    fontWeight: "900",
  },
  result: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  win: {
    color: "#4ade80",
  },
  loss: {
    color: colors.destructive,
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
  skeletonLegendAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: colors.border,
  },
  skeletonLegendText: {
    flex: 1,
    gap: 8,
  },
  skeletonLegendTitle: {
    width: 118,
    height: 22,
    borderRadius: radius.md,
  },
  skeletonLegendMeta: {
    width: 74,
    height: 14,
    borderRadius: radius.md,
  },
  skeletonCard: {
    minHeight: 112,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    opacity: 0.82,
  },
  skeletonCardHero: {
    width: 126,
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
  },
  skeletonArtBlock: {
    width: 110,
    height: 62,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skeletonCardBody: {
    flex: 1,
    minWidth: 0,
    gap: 10,
  },
  skeletonOpponent: {
    width: "70%",
    height: 20,
    borderRadius: radius.md,
  },
  skeletonTime: {
    width: 76,
    height: 16,
    borderRadius: radius.md,
  },
  skeletonScoreBlock: {
    minWidth: 72,
    alignItems: "flex-end",
    gap: 8,
  },
  skeletonScore: {
    width: 58,
    height: 30,
    borderRadius: radius.md,
  },
  skeletonResult: {
    width: 48,
    height: 12,
    borderRadius: radius.md,
  },
});
