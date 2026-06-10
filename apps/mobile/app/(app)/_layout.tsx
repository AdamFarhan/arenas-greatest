import { useAuth } from "@clerk/expo";
import { Redirect, Slot } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "@/components/primitives";
import { colors } from "@/lib/theme";

export default function ProtectedLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  useEffect(() => {
    if (isLoaded || isSignedIn === false) {
      setLoadingTimedOut(false);
      return;
    }

    const timeout = setTimeout(() => {
      setLoadingTimedOut(true);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [isLoaded, isSignedIn]);

  if (isSignedIn === false || loadingTimedOut) {
    return <Redirect href="/login" />;
  }

  if (!isLoaded) {
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

  return <Slot />;
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
