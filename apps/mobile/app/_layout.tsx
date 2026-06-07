import { Stack } from "expo-router";
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
  return (
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
  );
}
