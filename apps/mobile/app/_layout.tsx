import { Stack } from "expo-router";
import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { MatchProvider } from "@/lib/match-state";
import { SessionProvider } from "@/lib/session";
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

  if (!clerkPublishableKey) {
    throw new Error("Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to apps/mobile/.env.");
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
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
  );
}
