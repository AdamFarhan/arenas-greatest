import { Alert, StyleSheet, Text, View } from "react-native";
import { MenuScreen } from "@/components/bottom-menu";
import { Button } from "@/components/primitives";
import { hasSupabaseConfig } from "@/lib/supabase";
import { useSession } from "@/lib/session";
import { colors, radius } from "@/lib/theme";

export default function ProfileScreen() {
  const session = useSession();

  async function signOut() {
    await session.signOut();
    Alert.alert("Signed out", "Your local session has been cleared.");
  }

  return (
    <MenuScreen title="Profile" subtitle="Account status for your tracker.">
      <View style={styles.card}>
        <Text style={styles.label}>Status</Text>
        <Text style={styles.value}>
          {hasSupabaseConfig()
            ? session.isSignedIn
              ? session.user?.email ?? "Signed in"
              : "Signed out"
            : "Demo mode"}
        </Text>
        <Text style={styles.muted}>
          {hasSupabaseConfig()
            ? "Supabase cloud sync is configured for this app."
            : "Add Supabase environment variables to enable cloud accounts and saved match history."}
        </Text>
        {session.isSignedIn ? <Button variant="outline" onPress={signOut}>Sign out</Button> : null}
      </View>
    </MenuScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: 16,
    gap: 10
  },
  label: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  value: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: "900"
  },
  muted: {
    color: colors.mutedForeground,
    fontSize: 14
  }
});
