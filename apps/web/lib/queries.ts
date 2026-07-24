import { loadAnalyticsMatches, type AnalyticsMatch } from "@/lib/analytics";
import { getBrowserSupabase, hasSupabaseConfig } from "@/lib/supabase";

export const matchQueryKeys = {
  all: (userId: string | null | undefined) =>
    ["analytics-matches", 2, userId] as const,
};

type GetToken = () => Promise<string | null>;

export async function fetchAnalyticsMatches(
  getToken: GetToken,
): Promise<AnalyticsMatch[]> {
  if (!hasSupabaseConfig()) {
    throw new Error("Add Supabase environment variables to load your saved matches.");
  }

  const result = await loadAnalyticsMatches(getBrowserSupabase(getToken));
  if (result.error) throw result.error;
  return result.data;
}

export function findAnalyticsMatch(
  matches: AnalyticsMatch[] | undefined,
  id: string,
) {
  return matches?.find((match) => match.id === id);
}
