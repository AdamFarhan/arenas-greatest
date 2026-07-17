import { AuthView } from "@clerk/expo/native";
import { StyleSheet, View } from "react-native";
import { colors } from "@/lib/theme";

export function LoginAuthView() {
  return (
    <View style={styles.authView}>
      <AuthView mode="signInOrUp" />
    </View>
  );
}

const styles = StyleSheet.create({
  authView: {
    flex: 1,
    backgroundColor: colors.background
  }
});
