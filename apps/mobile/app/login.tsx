import { useAuth } from "@clerk/expo";
import { AuthView } from "@clerk/expo/native";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/primitives";
import { useClerkRecovery } from "@/lib/clerk-recovery";
import { colors } from "@/lib/theme";

export default function LoginScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const { needsClerkRecovery, recoverClerkSession } = useClerkRecovery();
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  useEffect(() => {
    if (isLoaded || isSignedIn === false) {
      setLoadingTimedOut(false);
      return;
    }

    const timeout = setTimeout(() => {
      setLoadingTimedOut(true);
      if (needsClerkRecovery) {
        void recoverClerkSession();
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [isLoaded, isSignedIn, needsClerkRecovery, recoverClerkSession]);

  if (isSignedIn) {
    return <Redirect href="/play" />;
  }

  if (!isLoaded && isSignedIn !== false && !loadingTimedOut) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centered}>
          <Card>
            <Text style={styles.title}>The Arena's Greatest</Text>
            <Text style={styles.muted}>Loading account...</Text>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.authView}>
        <AuthView mode="signInOrUp" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    padding: 18
  },
  authView: {
    flex: 1,
    backgroundColor: colors.background
  },
  title: {
    color: colors.foreground,
    fontSize: 28,
    fontWeight: "900"
  },
  muted: {
    color: colors.mutedForeground,
    fontSize: 14
  }
});
