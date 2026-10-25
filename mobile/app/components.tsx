import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export const C = {
  bg: "#F7F5EF",
  white: "#FFFFFF",
  navy: "#0D1920",
  navy2: "#17252D",
  gold: "#C5A66D",
  goldLight: "#E6D2A7",
  ink: "#192127",
  muted: "#737772",
  line: "#E9E5DC",
  blue: "#55B9F0",
  amber: "#E8B449",
  grey: "#C0C5C7",
  red: "#B65A50",
};

export const photos = {
  hero: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=900",
  drinks: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400",
  dairy: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400",
  grains: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400",
  snacks: "https://images.unsplash.com/photo-1621939514649-280e2aa2fdf1?w=400",
  oils: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400",
  juice: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=180",
  rice: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=180",
  sauce: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=180",
};

export type ScreenName =
  | "Home"
  | "Verify"
  | "History"
  | "Report"
  | "Registry"
  | "Company"
  | "Alerts"
  | "Profile";

export type ScanRecord = {
  id: string;
  name: string;
  category: string;
  time: string;
  status: "VERIFIED" | "SUSPICIOUS" | "UNVERIFIED";
  image: string;
};

export const categories = [
  { name: "Beverages", sub: "Drinks and juices", image: photos.drinks, icon: "cup-water" },
  { name: "Dairy", sub: "Milk, cheese, yoghurt", image: photos.dairy, icon: "bottle-soda-outline" },
  { name: "Grains & Staples", sub: "Rice, flour, cereals", image: photos.grains, icon: "barley" },
  { name: "Snacks & Packaged", sub: "Biscuits, chips, noodles", image: photos.snacks, icon: "package-variant" },
  { name: "Oils & Sauces", sub: "Oils, sauces, spreads", image: photos.oils, icon: "bottle-wine-outline" },
];

export const sections: {
  title: string;
  subtitle: string;
  icon: string;
  screen: ScreenName;
}[] = [
  {
    title: "Verify a Product",
    subtitle: "Check product and batch details",
    icon: "shield-check-outline",
    screen: "Verify",
  },
  {
    title: "Scan History",
    subtitle: "Review your previous checks",
    icon: "history",
    screen: "History",
  },
  {
    title: "Report a Product",
    subtitle: "Flag suspicious packaging or labels",
    icon: "flag-outline",
    screen: "Report",
  },
  {
    title: "Product Registry",
    subtitle: "Explore registered food and FMCG products",
    icon: "package-variant-closed-check",
    screen: "Registry",
  },
  {
    title: "Company Portal",
    subtitle: "Secure access for authorized companies",
    icon: "domain",
    screen: "Company",
  },
];

export function Heading({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.heading}>
      <Text style={styles.headingText}>{title}</Text>
      {action && onPress ? (
        <TouchableOpacity style={styles.seeAll} onPress={onPress}>
          <Text style={styles.seeAllText}>{action}</Text>
          <Ionicons name="arrow-forward" size={16} color={C.ink} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function StatusBadge({ status }: { status: ScanRecord["status"] }) {
  const config = {
    VERIFIED: { color: C.blue, icon: "shield-check-outline" },
    SUSPICIOUS: { color: C.amber, icon: "alert-outline" },
    UNVERIFIED: { color: C.grey, icon: "help-circle-outline" },
  }[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.color + "20" }]}>
      <MaterialCommunityIcons
        name={config.icon as any}
        size={14}
        color={config.color}
      />
      <Text style={[styles.badgeText, { color: config.color }]}>
        {status}
      </Text>
    </View>
  );
}

export function ActionCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.actionCard}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.actionIcon}>
        <MaterialCommunityIcons
          name={icon as any}
          size={25}
          color={C.gold}
        />
      </View>
      <View style={styles.actionCopy}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={19} color={C.muted} />
    </TouchableOpacity>
  );
}

export function ScanRow({
  item,
  onPress,
}: {
  item: ScanRecord;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.scanRow}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Image source={{ uri: item.image }} style={styles.scanImage} />
      <View style={styles.scanInfo}>
        <Text style={styles.scanName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.scanMeta}>
          {item.category} · {item.time}
        </Text>
      </View>
      <StatusBadge status={item.status} />
    </TouchableOpacity>
  );
}

export function ScreenHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.screenHeader}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.screenTitle}>{title}</Text>
      <Text style={styles.screenDescription}>{description}</Text>
    </View>
  );
}

export function InfoCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.infoCard}>
      <MaterialCommunityIcons name={icon as any} size={25} color={C.gold} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoText}>{text}</Text>
      </View>
    </View>
  );
}

export const styles = StyleSheet.create({
  heading: {
    marginHorizontal: 22,
    marginTop: 8,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headingText: {
    fontSize: 12,
    fontWeight: "800",
    color: C.ink,
    letterSpacing: 0.5,
  },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 6 },
  seeAllText: { fontSize: 12, fontWeight: "600", color: C.ink },

  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginBottom: 10,
  },
  actionIcon: {
    width: 47,
    height: 47,
    borderRadius: 14,
    backgroundColor: C.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  actionCopy: { flex: 1 },
  actionTitle: { color: C.ink, fontSize: 14, fontWeight: "700" },
  actionSubtitle: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeText: { fontSize: 8, fontWeight: "800" },

  scanRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  scanImage: {
    width: 44,
    height: 48,
    borderRadius: 8,
    backgroundColor: C.navy2,
  },
  scanInfo: { flex: 1, minWidth: 0 },
  scanName: { color: C.white, fontSize: 12, fontWeight: "600" },
  scanMeta: { color: C.muted, fontSize: 10, marginTop: 5, lineHeight: 15 },

  screenHeader: { marginBottom: 23 },
  eyebrow: {
    color: "#99845D",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  screenTitle: {
    color: C.navy,
    fontSize: 34,
    fontWeight: "700",
    fontFamily: "Georgia",
    marginBottom: 10,
  },
  screenDescription: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 21,
  },
  infoCard: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    padding: 16,
    backgroundColor: C.navy,
    borderRadius: 16,
    marginTop: 14,
  },
  infoTitle: {
    color: C.white,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 5,
  },
  infoText: { color: "#D0D5D5", fontSize: 11, lineHeight: 17 },
});
