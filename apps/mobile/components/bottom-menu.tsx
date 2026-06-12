import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { usePathname, useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius } from "@/lib/theme";

type MenuItem = {
  href: "/play" | "/matches" | "/profile";
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const MENU_ITEMS: MenuItem[] = [
  { href: "/play", label: "Play", icon: "lightning-bolt" },
  { href: "/matches", label: "Matches", icon: "history" },
  { href: "/profile", label: "Profile", icon: "account" }
];

export function BottomMenu({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.menu, { bottom: Math.max(18, insets.bottom + 8) }]}>
      {MENU_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`) || (pathname === "/" && item.href === "/play");

        return (
          <Pressable
            key={item.href}
            style={[styles.item, active && styles.activeItem]}
            onPress={() => {
              onNavigate?.();
              router.replace(item.href);
            }}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={22}
              color={active ? colors.primary : colors.mutedForeground}
            />
            <Text style={[styles.label, active && styles.activeLabel]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function MenuScreen({
  title,
  subtitle,
  children,
  headerRight
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  headerRight?: ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          {headerRight ? <View style={styles.headerRight}>{headerRight}</View> : null}
        </View>
        {children}
      </View>
      <BottomMenu />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    flex: 1,
    padding: 16,
    paddingBottom: 112,
    gap: 14
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12
  },
  headerText: {
    flex: 1,
    gap: 4
  },
  headerRight: {
    alignItems: "flex-end",
    justifyContent: "center"
  },
  title: {
    color: colors.foreground,
    fontSize: 26,
    fontWeight: "800"
  },
  subtitle: {
    color: colors.mutedForeground,
    fontSize: 14
  },
  menu: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 18,
    minHeight: 72,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    paddingVertical: 8
  },
  item: {
    flex: 1,
    minHeight: 56,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: 4
  },
  activeItem: {
    backgroundColor: colors.secondary
  },
  label: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: "800"
  },
  activeLabel: {
    color: colors.primary
  }
});
