
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const W = Dimensions.get("window").width;

const C = {
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
};

const photos = {
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

const categories = [
  { name: "Beverages", sub: "Drinks & juices", image: photos.drinks, icon: "cup-water" },
  { name: "Dairy", sub: "Milk, cheese, yoghurt", image: photos.dairy, icon: "bottle-soda-outline" },
  { name: "Grains & Staples", sub: "Rice, flour, cereals", image: photos.grains, icon: "barley" },
  { name: "Snacks & Packaged", sub: "Biscuits, chips, noodles", image: photos.snacks, icon: "package-variant" },
  { name: "Oils & Sauces", sub: "Oils, sauces, spreads", image: photos.oils, icon: "bottle-wine-outline" },
];

const sampleScans = [
  {
    id: "1",
    name: "Minute Maid Orange Juice",
    category: "Beverages",
    time: "Scanned 2h ago",
    status: "VERIFIED",
    image: photos.juice,
  },
  {
    id: "2",
    name: "Royal Stallion Parboiled Rice",
    category: "Grains & Staples",
    time: "Scanned 5h ago",
    status: "SUSPICIOUS",
    image: photos.rice,
  },
  {
    id: "3",
    name: "Unknown Product",
    category: "Unknown",
    time: "Scanned 1d ago",
    status: "UNVERIFIED",
    image: photos.sauce,
  },
];

function Heading({ title, action, onPress }) {
  return (
    <View style={styles.heading}>
      <Text style={styles.headingText}>{title}</Text>
      {action ? (
        <TouchableOpacity style={styles.seeAll} onPress={onPress}>
          <Text style={styles.seeAllText}>{action}</Text>
          <Ionicons name="arrow-forward" size={16} color={C.ink} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function StatusBadge({ status }) {
  const config = {
    VERIFIED: { color: C.blue, icon: "shield-check-outline" },
    SUSPICIOUS: { color: C.amber, icon: "alert-outline" },
    UNVERIFIED: { color: C.grey, icon: "help-circle-outline" },
  }[status] || { color: C.grey, icon: "help-circle-outline" };

  return (
    <View style={[styles.badge, { backgroundColor: config.color + "18" }]}>
      <MaterialCommunityIcons name={config.icon} size={15} color={config.color} />
      <Text style={[styles.badgeText, { color: config.color }]}>{status}</Text>
    </View>
  );
}

function ScanOption({ icon, title, subtitle, onPress }) {
  return (
    <TouchableOpacity
      style={styles.scanOption}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <MaterialCommunityIcons name={icon} size={28} color={C.ink} />
      <Text style={styles.scanTitle}>{title}</Text>
      <Text style={styles.scanSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

export default function App() {
  const [tab, setTab] = useState("Home");
  const [scans] = useState(sampleScans);
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [notifications] = useState(1);

  const notice = (title, message) =>
    Alert.alert(title, message, [{ text: "OK" }]);

  const startScan = (type) => {
    setTab("Scan");

    if (type === "Manual code") {
      setShowCode(true);
      setCode("");
      return;
    }

    notice(
      type,
      "This feature needs to be connected to the device camera and verification service. No product has been authenticated yet."
    );
  };

  const submitCode = () => {
    if (!code.trim()) {
      notice("Enter a code", "Please enter a product, serial or batch number.");
      return;
    }

    notice(
      "Code received",
      "Code: " + code.trim() +
        "\n\nStatus: UNVERIFIED\n\nA trusted manufacturer or product database is required to establish authenticity."
    );
  };

  const openResult = (item) => {
    const descriptions = {
      VERIFIED:
        "The demonstration record is marked verified. Real verification must rely on trusted records, not the barcode alone.",
      SUSPICIOUS:
        "This product requires further investigation. A mismatch is a warning, not conclusive proof of counterfeiting.",
      UNVERIFIED:
        "There is insufficient trusted information to establish authenticity.",
    };

    notice(item.name + "\n" + item.status, descriptions[item.status]);
  };

  const nav = [
    { name: "Home", icon: "home-outline", active: "home" },
    { name: "History", icon: "time-outline", active: "time" },
    { name: "Scan", icon: "scan-outline", active: "scan" },
    { name: "Alerts", icon: "notifications-outline", active: "notifications" },
    { name: "Profile", icon: "person-outline", active: "person" },
  ];

  const renderHome = () => (
    <>
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <MaterialCommunityIcons name="hexagon-outline" size={47} color={C.navy} />
          <View style={styles.brandMarkInner}>
            <MaterialCommunityIcons name="shield-check-outline" size={24} color={C.gold} />
          </View>
        </View>

        <View style={styles.brandTextWrap}>
          <Text style={styles.brandName}>VERITY</Text>
          <Text style={styles.brandSub}>FOOD AUTHENTICATION</Text>
        </View>

        <TouchableOpacity
          style={styles.bell}
          onPress={() => setTab("Alerts")}
        >
          <Ionicons name="notifications-outline" size={23} color={C.white} />
          <View style={styles.bellDot} />
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>Facts first.</Text>
          <Text style={styles.heroGold}>Always.</Text>
          <Text style={styles.heroDescription}>
            Scan any food product to check authenticity, trace origin and protect what matters.
          </Text>
        </View>
        <Image source={{ uri: photos.hero }} style={styles.heroImage} />
      </View>

      <TouchableOpacity
        style={styles.mainScan}
        activeOpacity={0.85}
        onPress={() => startScan("Scan a product")}
      >
        <View style={styles.mainScanIcon}>
          <MaterialCommunityIcons name="line-scan" size={48} color={C.navy} />
        </View>

        <View style={styles.mainScanCopy}>
          <Text style={styles.eyebrow}>START HERE</Text>
          <Text style={styles.mainScanTitle}>Scan a product</Text>
          <Text style={styles.mainScanSub}>Barcode · QR code · Product label</Text>
        </View>

        <View style={styles.arrowCircle}>
          <Ionicons name="arrow-forward" size={25} color={C.navy} />
        </View>
      </TouchableOpacity>

      <View style={styles.scanOptions}>
        <ScanOption
          icon="barcode"
          title="Barcode scan"
          subtitle="Scan product barcode"
          onPress={() => startScan("Barcode scan")}
        />
        <ScanOption
          icon="qrcode-scan"
          title="QR code scan"
          subtitle="Scan QR on packaging"
          onPress={() => startScan("QR code scan")}
        />
        <ScanOption
          icon="keyboard-outline"
          title="Enter code"
          subtitle="Serial or batch number"
          onPress={() => startScan("Manual code")}
        />
        <ScanOption
          icon="camera-outline"
          title="Photo check"
          subtitle="Upload label or packaging"
          onPress={() => startScan("Photo check")}
        />
      </View>

      <Heading
        title="EXPLORE CATEGORIES"
        action="See all"
        onPress={() => notice("Food categories", "Browse the available food categories below.")}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
      >
        {categories.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={styles.categoryCard}
            activeOpacity={0.8}
            onPress={() =>
              notice(
                item.name,
                item.sub + "\n\nCategory-specific product discovery will be connected to the backend."
              )
            }
          >
            <Image source={{ uri: item.image }} style={styles.categoryImage} />
            <View style={styles.categoryShade} />
            <View style={styles.categoryIcon}>
              <MaterialCommunityIcons name={item.icon} size={20} color={C.goldLight} />
            </View>
            <View style={styles.categoryCopy}>
              <Text style={styles.categoryName}>{item.name}</Text>
              <Text style={styles.categorySub}>{item.sub}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Heading
        title="RECENT SCANS"
        action="View all"
        onPress={() => setTab("History")}
      />

      <View style={styles.recentCard}>
        {scans.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.recentRow,
              index !== scans.length - 1 && styles.recentDivider,
            ]}
            activeOpacity={0.75}
            onPress={() => openResult(item)}
          >
            <Image source={{ uri: item.image }} style={styles.recentImage} />
            <View style={styles.recentInfo}>
              <Text style={styles.recentName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.recentMeta}>
                {item.category} · {item.time}
              </Text>
            </View>
            <View style={styles.recentRight}>
              <StatusBadge status={item.status} />
              <Ionicons name="chevron-forward" size={17} color="#CDD2D4" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.mission}>
        <View style={styles.missionIcon}>
          <MaterialCommunityIcons name="shield-check" size={48} color={C.navy} />
        </View>
        <View style={styles.missionCopy}>
          <Text style={styles.missionTitle}>Your trust is our mission.</Text>
          <Text style={styles.missionText}>
            We compare product information with trusted records and highlight anything that doesn't match.
          </Text>
        </View>
        <MaterialCommunityIcons name="earth" size={35} color={C.gold} />
      </View>
    </>
  );

  const renderOther = () => {
    if (tab === "Scan") {
      return (
        <View style={styles.otherScreen}>
          <Text style={styles.otherEyebrow}>VERITY AUTHENTICATION</Text>
          <Text style={styles.otherTitle}>Inspect a product.</Text>
          <Text style={styles.otherDescription}>
            Choose how you want to identify the product. Identification alone does not prove authenticity.
          </Text>

          <View style={styles.otherScanGrid}>
            <ScanOption
              icon="barcode"
              title="Barcode"
              subtitle="Read product code"
              onPress={() => notice("Barcode scanner", "Camera scanning has not yet been connected.")}
            />
            <ScanOption
              icon="qrcode-scan"
              title="QR code"
              subtitle="Read QR code"
              onPress={() => notice("QR scanner", "Camera scanning has not yet been connected.")}
            />
            <ScanOption
              icon="camera-outline"
              title="Photo check"
              subtitle="Inspect packaging"
              onPress={() => notice("Photo check", "Camera and image analysis have not yet been connected.")}
            />
            <ScanOption
              icon="keyboard-outline"
              title="Manual code"
              subtitle="Enter product code"
              onPress={() => setShowCode(true)}
            />
          </View>

          {showCode && (
            <View style={styles.codePanel}>
              <Text style={styles.fieldLabel}>PRODUCT / BATCH CODE</Text>
              <TextInput
                style={styles.codeInput}
                placeholder="Enter code here"
                placeholderTextColor="#8D9394"
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.goldButton} onPress={submitCode}>
                <Text style={styles.goldButtonText}>Check code</Text>
                <Ionicons name="arrow-forward" size={18} color={C.navy} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.noticeCard}>
            <MaterialCommunityIcons name="shield-alert-outline" size={25} color={C.gold} />
            <View style={{ flex: 1 }}>
              <Text style={styles.missionTitle}>Evidence before trust.</Text>
              <Text style={styles.missionText}>
                A valid barcode can be copied. Authenticity requires corroborating trusted evidence.
              </Text>
            </View>
          </View>
        </View>
      );
    }

    if (tab === "History") {
      return (
        <View style={styles.otherScreen}>
          <Text style={styles.otherEyebrow}>YOUR ACTIVITY</Text>
          <Text style={styles.otherTitle}>Scan history.</Text>
          <Text style={styles.otherDescription}>
            Review previously inspected products and their recorded status.
          </Text>
          <View style={styles.recentCard}>
            {scans.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.recentRow, index !== scans.length - 1 && styles.recentDivider]}
                onPress={() => openResult(item)}
              >
                <Image source={{ uri: item.image }} style={styles.recentImage} />
                <View style={styles.recentInfo}>
                  <Text style={styles.recentName}>{item.name}</Text>
                  <Text style={styles.recentMeta}>{item.time}</Text>
                </View>
                <StatusBadge status={item.status} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    if (tab === "Alerts") {
      return (
        <View style={styles.otherScreen}>
          <Text style={styles.otherEyebrow}>STAY INFORMED</Text>
          <Text style={styles.otherTitle}>Your alerts.</Text>
          <Text style={styles.otherDescription}>
            Review products that may need further investigation.
          </Text>
          <View style={styles.alertCard}>
            <MaterialCommunityIcons name="alert-circle-outline" size={28} color={C.amber} />
            <View style={{ flex: 1 }}>
              <Text style={styles.missionTitle}>Suspicious product record</Text>
              <Text style={styles.missionText}>Royal Stallion Parboiled Rice</Text>
              <Text style={styles.recentMeta}>Demonstration alert · 5 hours ago</Text>
            </View>
          </View>
          <Text style={styles.smallNote}>
            Prototype alerts are sample content, not live fraud reports.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.otherScreen}>
        <Text style={styles.otherEyebrow}>YOUR VERITY ACCOUNT</Text>
        <Text style={styles.otherTitle}>Your profile.</Text>
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Ionicons name="person-outline" size={34} color={C.goldLight} />
          </View>
          <Text style={styles.profileTitle}>Welcome to VERITY</Text>
          <Text style={styles.otherDescription}>
            Your food verification companion.
          </Text>
          {["Account details", "Scan preferences", "Privacy & security", "About VERITY"].map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.profileRow}
              onPress={() => notice(item, "This setting will be available when account functionality is connected.")}
            >
              <Text style={styles.profileRowText}>{item}</Text>
              <Ionicons name="chevron-forward" size={18} color={C.muted} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
      >
        {tab === "Home" ? renderHome() : renderOther()}
        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={styles.bottomNav}>
        {nav.map((item) => {
          const active = tab === item.name;
          const isScan = item.name === "Scan";

          return (
            <TouchableOpacity
              key={item.name}
              style={styles.navItem}
              activeOpacity={0.8}
              onPress={() => {
                setTab(item.name);
                if (item.name === "Scan") setShowCode(false);
              }}
            >
              <View style={[styles.navIconWrap, isScan && styles.navScan]}>
                <Ionicons
                  name={item.icon}
                  size={isScan ? 29 : 24}
                  color={isScan ? C.white : active ? C.goldLight : "#BFC5C7"}
                />
                {item.name === "Alerts" && notifications > 0 && (
                  <View style={styles.navDot} />
                )}
              </View>
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                {item.name}
              </Text>
              {active && !isScan ? <View style={styles.activeDot} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    flex: 1,
  },
  page: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    marginBottom: 16,
  },
  brandMark: {
    width: 53,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  brandMarkInner: {
    position: "absolute",
  },
  brandTextWrap: {
    marginLeft: 9,
    flex: 1,
  },
  brandName: {
    fontSize: 31,
    letterSpacing: 8,
    fontWeight: "500",
    color: C.navy,
  },
  brandSub: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: "#99845D",
    marginTop: 1,
  },
  bell: {
    width: 47,
    height: 47,
    borderRadius: 24,
    backgroundColor: C.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  bellDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.gold,
    position: "absolute",
    top: 9,
    right: 10,
  },
  hero: {
    minHeight: 274,
    marginHorizontal: 20,
    marginBottom: 12,
    justifyContent: "center",
    overflow: "hidden",
  },
  heroCopy: {
    width: "75%",
    zIndex: 2,
    paddingLeft: 2,
    paddingTop: 12,
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: "700",
    letterSpacing: -1.8,
    color: C.navy,
    lineHeight: 47,
    fontFamily: "Georgia",
  },
  heroGold: {
    fontSize: 42,
    fontWeight: "700",
    letterSpacing: -1.5,
    color: "#AD9160",
    lineHeight: 46,
    fontFamily: "Georgia",
  },
  heroDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: "#555B5C",
    marginTop: 17,
    maxWidth: 265,
  },
  heroImage: {
    position: "absolute",
    right: -25,
    bottom: 0,
    width: W * 0.56,
    height: 205,
    opacity: 0.58,
    borderRadius: 90,
  },
  mainScan: {
    marginHorizontal: 20,
    backgroundColor: C.navy,
    borderRadius: 21,
    padding: 17,
    minHeight: 143,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    elevation: 7,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },
  mainScanIcon: {
    width: 80,
    height: 87,
    borderRadius: 23,
    backgroundColor: C.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  mainScanCopy: {
    flex: 1,
    marginLeft: 15,
  },
  eyebrow: {
    color: C.goldLight,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.3,
    marginBottom: 6,
  },
  mainScanTitle: {
    color: C.white,
    fontSize: 22,
    fontFamily: "Georgia",
    fontWeight: "700",
    marginBottom: 5,
  },
  mainScanSub: {
    color: "#D4D8D9",
    fontSize: 11,
    lineHeight: 17,
  },
  arrowCircle: {
    width: 49,
    height: 49,
    borderRadius: 25,
    backgroundColor: C.goldLight,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 7,
  },
  scanOptions: {
    flexDirection: "row",
    marginHorizontal: 15,
    gap: 8,
    marginBottom: 23,
  },
  scanOption: {
    flex: 1,
    minWidth: 0,
    backgroundColor: C.white,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 15,
    minHeight: 130,
    borderWidth: 1,
    borderColor: "#F0EDE6",
  },
  scanTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: C.ink,
    textAlign: "center",
    marginTop: 12,
  },
  scanSubtitle: {
    fontSize: 9,
    lineHeight: 14,
    color: "#555A5A",
    textAlign: "center",
    marginTop: 7,
  },
  heading: {
    marginHorizontal: 22,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headingText: {
    fontSize: 12,
    fontWeight: "800",
    color: C.ink,
    letterSpacing: 0.2,
  },
  seeAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: C.ink,
  },
  categoryList: {
    paddingLeft: 20,
    paddingRight: 10,
    gap: 9,
    marginBottom: 22,
  },
  categoryCard: {
    width: 126,
    height: 213,
    backgroundColor: C.navy,
    borderRadius: 16,
    overflow: "hidden",
  },
  categoryImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  categoryShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,14,19,0.40)",
  },
  categoryIcon: {
    position: "absolute",
    left: 13,
    bottom: 75,
    width: 36,
    height: 36,
    borderRadius: 19,
    borderColor: C.gold,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10,20,25,0.5)",
  },
  categoryCopy: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 8,
  },
  categoryName: {
    color: C.white,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  categorySub: {
    color: "#E0E2E1",
    fontSize: 10,
    lineHeight: 15,
  },
  recentCard: {
    backgroundColor: C.navy,
    borderRadius: 19,
    marginHorizontal: 20,
    overflow: "hidden",
    marginBottom: 18,
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 73,
    paddingHorizontal: 11,
    paddingVertical: 10,
    gap: 10,
  },
  recentDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.10)",
  },
  recentImage: {
    width: 43,
    height: 48,
    borderRadius: 8,
    backgroundColor: C.navy2,
  },
  recentInfo: {
    flex: 1,
    minWidth: 0,
  },
  recentName: {
    color: C.white,
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 5,
  },
  recentMeta: {
    color: "#C1C8C9",
    fontSize: 10,
    lineHeight: 15,
  },
  recentRight: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 7,
    borderRadius: 15,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.1,
  },
  mission: {
    marginHorizontal: 20,
    marginTop: 0,
    marginBottom: 10,
    padding: 14,
    backgroundColor: "#F0EEE7",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#E8E4DA",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  missionIcon: {
    width: 65,
    height: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  missionCopy: {
    flex: 1,
  },
  missionTitle: {
    color: C.ink,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  missionText: {
    color: "#555B5B",
    fontSize: 11,
    lineHeight: 16,
  },
  bottomNav: {
    minHeight: 83,
    backgroundColor: C.navy,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    paddingBottom: 5,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 70,
  },
  navIconWrap: {
    width: 43,
    height: 37,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  navScan: {
    width: 58,
    height: 58,
    borderRadius: 30,
    backgroundColor: C.gold,
    marginTop: -27,
    borderWidth: 4,
    borderColor: C.bg,
  },
  navDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.goldLight,
    position: "absolute",
    top: 3,
    right: 5,
  },
  navLabel: {
    color: "#BFC5C7",
    fontSize: 10,
    marginTop: 3,
  },
  navLabelActive: {
    color: C.goldLight,
    fontWeight: "700",
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.gold,
    marginTop: 4,
  },
  otherScreen: {
    paddingHorizontal: 20,
    paddingTop: 28,
    minHeight: 560,
  },
  otherEyebrow: {
    color: "#99845D",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  otherTitle: {
    color: C.navy,
    fontSize: 36,
    fontWeight: "700",
    fontFamily: "Georgia",
    marginBottom: 12,
  },
  otherDescription: {
    color: C.muted,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  otherScanGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 22,
  },
  codePanel: {
    padding: 17,
    backgroundColor: C.white,
    borderRadius: 17,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: C.ink,
    marginBottom: 10,
  },
  codeInput: {
    height: 51,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 14,
    color: C.ink,
    fontSize: 15,
    marginBottom: 13,
  },
  goldButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: C.goldLight,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  goldButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: C.navy,
  },
  noticeCard: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    backgroundColor: C.navy,
    borderRadius: 16,
    alignItems: "center",
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 18,
    backgroundColor: C.navy,
    borderRadius: 16,
  },
  smallNote: {
    fontSize: 11,
    color: C.muted,
    lineHeight: 17,
    marginTop: 15,
  },
  profileCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 20,
  },
  profileAvatar: {
    width: 67,
    height: 67,
    borderRadius: 34,
    backgroundColor: C.navy,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  profileTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: C.ink,
    marginBottom: 8,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 17,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  profileRowText: {
    fontSize: 13,
    color: C.ink,
  },
});
