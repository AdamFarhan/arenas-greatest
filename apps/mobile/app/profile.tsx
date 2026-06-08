import { useUserProfileModal } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { MenuScreen } from "@/components/bottom-menu";
import { Button } from "@/components/primitives";
import { hasSupabaseConfig } from "@/lib/supabase";
import { useSession } from "@/lib/session";
import { colors, radius } from "@/lib/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const session = useSession();
  const { isAvailable: profileModalAvailable, presentUserProfile } = useUserProfileModal();

  useEffect(() => {
    if (session.isLoaded && !session.isSignedIn) {
      router.replace("/play");
    }
  }, [router, session.isLoaded, session.isSignedIn]);

  async function manageAccount() {
    await presentUserProfile();
  }

  async function signOut() {
    await session.signOut();
    router.replace("/play");
  }

  return (
    <MenuScreen title="Profile" subtitle="Account status for your tracker.">
      <View style={styles.card}>
        <Text style={styles.label}>Status</Text>
        <Text style={styles.value}>
          {session.isSignedIn ? session.user?.email ?? "Signed in" : "Signed out"}
        </Text>
        <Text style={styles.muted}>
          {hasSupabaseConfig()
            ? "Clerk handles your account. Supabase stores your match history."
            : "Add Supabase environment variables to enable saved match history."}
        </Text>
        {session.isSignedIn && profileModalAvailable ? (
          <Button variant="secondary" onPress={manageAccount}>Manage account</Button>
        ) : null}
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
