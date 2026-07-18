import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/lib/theme";
import { usePwaInstall } from "@/components/pwa-install-context";

export function PwaOnboarding() {
  const {
    browser,
    isMobile,
    isStandalone,
    isInstalled,
    continuedInBrowser,
    installFallback,
    continueInBrowser,
    install,
    openChrome
  } = usePwaInstall();

  if (!isMobile || isStandalone || isInstalled || continuedInBrowser) {
    return null;
  }

  return (
    <View style={styles.fullPage} accessibilityViewIsModal>
      <View style={styles.fullPageContent}>
        <Image source={require("../assets/icon.png")} style={styles.icon} />
        <Text style={styles.eyebrow}>The Arena&apos;s Greatest</Text>
        <Text style={styles.title}>Install the app for the best experience</Text>
        <Text style={styles.description}>
          Get a cleaner full-screen experience, faster access from your home screen, and no browser tabs in the way.
        </Text>

        {browser === "chrome" ? (
          <>
            <Pressable style={styles.primaryButton} onPress={() => void install()}>
              <Text style={styles.primaryButtonText}>Install app</Text>
            </Pressable>
            {installFallback ? <Text style={styles.helperText}>Chrome did not offer the prompt. Open the browser menu and choose Install app.</Text> : null}
          </>
        ) : browser === "firefox" ? (
          <>
            <Pressable style={styles.primaryButton} onPress={openChrome}>
              <Text style={styles.primaryButtonText}>Open in Chrome</Text>
            </Pressable>
            <Text style={styles.helperText}>Firefox may block the handoff. If nothing happens, copy this page&apos;s address and open it in Chrome.</Text>
          </>
        ) : browser === "safari" ? (
          <Text style={styles.helperText}>In Safari, tap the Share button, then choose Add to Home Screen.</Text>
        ) : (
          <Text style={styles.helperText}>Open this page&apos;s browser menu and look for an option to install or add the app to your home screen.</Text>
        )}

        <Pressable style={styles.continueButton} onPress={continueInBrowser}>
          <Text style={styles.continueButtonText}>Continue in {browser === "other" ? "this browser" : browser}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullPage: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: 24
  } as never,
  fullPageContent: {
    width: "100%",
    maxWidth: 460,
    alignItems: "center",
    padding: 28,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.card
  } as never,
  icon: { width: 88, height: 88, borderRadius: 20, marginBottom: 20 },
  eyebrow: { color: colors.mutedForeground, fontSize: 14, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase", textAlign: "center" },
  title: { marginTop: 12, color: colors.foreground, fontSize: 30, fontWeight: "800", lineHeight: 36, textAlign: "center" },
  description: { maxWidth: 380, marginTop: 14, color: colors.mutedForeground, fontSize: 16, lineHeight: 24, textAlign: "center" },
  primaryButton: { width: "100%", minHeight: 52, alignItems: "center", justifyContent: "center", marginTop: 28, borderRadius: 8, backgroundColor: colors.foreground } as never,
  primaryButtonText: { color: colors.card, fontSize: 16, fontWeight: "800" },
  helperText: { maxWidth: 380, marginTop: 20, color: colors.mutedForeground, fontSize: 14, lineHeight: 21, textAlign: "center" },
  continueButton: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 14, paddingHorizontal: 18 },
  continueButtonText: { color: colors.mutedForeground, fontSize: 15, fontWeight: "700" }
});
