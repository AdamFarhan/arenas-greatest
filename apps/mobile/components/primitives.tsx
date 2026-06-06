import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius } from "@/lib/theme";

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function Button({
  children,
  onPress,
  variant = "primary",
  disabled = false
}: {
  children: ReactNode;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed
      ]}
    >
      <Text style={[styles.buttonText, variant === "primary" ? styles.primaryText : styles.secondaryText]}>
        {children}
      </Text>
    </Pressable>
  );
}

export function Field({
  value,
  onChangeText,
  placeholder,
  multiline = false
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.mutedForeground}
      multiline={multiline}
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
