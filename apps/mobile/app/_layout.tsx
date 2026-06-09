import { Stack } from "expo-router";
import { ClerkProvider } from "@clerk/expo";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { MatchProvider } from "@/lib/match-state";
import { SessionProvider } from "@/lib/session";
import { clearClerkClientToken, clerkTokenCache } from "@/lib/clerk-token-cache";
import { ClerkRecoveryProvider } from "@/lib/clerk-recovery";
import { colors } from "@/lib/theme";

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    border: colors.border,
    card: colors.background,
    notification: colors.primary,
    primary: colors.primary,
    text: colors.foreground
  }
};

export default function RootLayout() {
  const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const [clerkProviderKey, setClerkProviderKey] = useState(0);
  const [needsClerkRecovery, setNeedsClerkRecovery] = useState(false);

  const requestClerkRecovery = useCallback(() => {
    setNeedsClerkRecovery(true);
  }, []);

  const recoverClerkSession = useCallback(async () => {
    await clearClerkClientToken();
    setNeedsClerkRecovery(false);
    setClerkProviderKey((current) => current + 1);
  }, []);

  const recoveryContext = useMemo(
    () => ({ needsClerkRecovery, requestClerkRecovery, recoverClerkSession }),
    [needsClerkRecovery, recoverClerkSession, requestClerkRecovery]
  );

  if (!clerkPublishableKey) {
    throw new Error("Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to apps/mobile/.env.");
  }

  return (
    <ClerkRecoveryProvider value={recoveryContext}>
      <ClerkProvider key={clerkProviderKey} publishableKey={clerkPublishableKey} tokenCache={clerkTokenCache}>
        <ThemeProvider value={navigationTheme}>
          <SessionProvider>
            <MatchProvider>
              <Stack
                screenOptions={{
                  animation: "none",
                  contentStyle: {
                    backgroundColor: colors.background
                  },
                  headerShown: false
                }}
              />
            </MatchProvider>
          </SessionProvider>
        </ThemeProvider>
      </ClerkProvider>
    </ClerkRecoveryProvider>
  );
}
