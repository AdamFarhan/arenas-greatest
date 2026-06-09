import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius } from "@/lib/theme";

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function Button({
  children,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false
}: {
  children: ReactNode;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  disabled?: boolean;
  loading?: boolean;
}) {
  const isDisabled = disabled || loading;
  const textStyle = variant === "primary" ? styles.primaryText : styles.secondaryText;

  return (
    <Pressable
      disabled={isDisabled}
      onPress={() => onPress()}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        disabled && !loading && styles.disabled,
        pressed && !isDisabled && styles.pressed
      ]}
    >
      {loading ? (
        <View style={styles.loadingContent}>
          <ActivityIndicator size="small" color={variant === "primary" ? colors.primaryForeground : colors.secondaryForeground} />
          <Text style={[styles.buttonText, textStyle]}>{children}</Text>
        </View>
      ) : (
        <Text style={[styles.buttonText, textStyle]}>{children}</Text>
      )}
    </Pressable>
  );
}

export function Field({
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
  autoComplete,
  textContentType
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences";
  autoComplete?: "email";
  textContentType?: "emailAddress";
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.mutedForeground}
      multiline={multiline}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      autoCorrect={keyboardType === "email-address" ? false : undefined}
      autoComplete={autoComplete}
      textContentType={textContentType}
      style={[styles.input, multiline && styles.textarea]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 16,
    gap: 12
  },
  button: {
    minHeight: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  primary: {
    backgroundColor: colors.primary
  },
  secondary: {
    backgroundColor: colors.secondary
  },
  outline: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border
  },
  disabled: {
    opacity: 0.5
  },
  pressed: {
    opacity: 0.85
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "700"
  },
  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  primaryText: {
    color: colors.primaryForeground
  },
  secondaryText: {
    color: colors.secondaryForeground
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    color: colors.foreground,
    backgroundColor: colors.background
  },
  textarea: {
    minHeight: 96,
    paddingTop: 12,
    textAlignVertical: "top"
  }
});
