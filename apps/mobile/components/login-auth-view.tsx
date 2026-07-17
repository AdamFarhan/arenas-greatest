import { SignIn } from "@clerk/expo/web";
import { StyleSheet, View } from "react-native";
import { colors } from "@/lib/theme";

export function LoginAuthView() {
  return (
    <View style={styles.webAuth}>
      <SignIn signUpUrl="/login" forceRedirectUrl="/play" />
    </View>
  );
}

const styles = StyleSheet.create({
  webAuth: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: 18
  }
});
