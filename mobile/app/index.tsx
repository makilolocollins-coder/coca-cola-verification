
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Alert,
  StyleSheet,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import AppScreen from "./screens";
import {
  C,
  photos,
  categories,
  sections,
  ScanRecord,
  ScreenName,
  Heading,
  ActionCard,
  ScanRow,
} from "./components";

const sampleScans: ScanRecord[] = [
  {
    id: "1",
    name: "Minute Maid Orange Juice",
    category: "Beverages",
    time: "Demonstration record",
    status: "VERIFIED",
    image: photos.juice,
  },
  {
    id: "2",
    name: "Royal Stallion Parboiled Rice",
    category: "Grains & Staples",
    time: "Demonstration record",
    status: "SUSPICIOUS",
    image: photos.rice,
  },
  {
    id: "3",
    name: "Unknown Product",
    category: "Unknown",
    time: "Demonstration record",
    status: "UNVERIFIED",
    image: photos.sauce,
  },
];

const nav: {
  name: ScreenName;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { name: "Home", icon: "home-outline" },
  { name: "History", icon: "time-outline" },
  { name: "Verify", icon: "scan-outline" },
  { name: "Alerts", icon: "notifications-outline" },
  { name: "Profile", icon: "person-outline" },
];

export default function App() {
  const [screen, setScreen] = useState<ScreenName>("Home");
  const [scans] = useState<ScanRecord[]>(sampleScans);

  const goTo = (next: ScreenName) => setScreen(next);

  // Looks up a barcode received from the camera scanner.
  const handleVerify = async (code: string) => {
    const barcode = code.trim();

    if (!barcode) {
      Alert.alert(
        "No barcode detected",
        "Please scan a product barcode and try again."
      );
      return;
    }

    try {
      const fields = [
        "code",
        "product_name",
        "brands",
        "quantity",
        "categories",
        "ingredients_text",
        "image_front_url",
      ].join(",");

      const url =
        `https://world.openfoodfacts.org/api/v2/product/` +
        `${encodeURIComponent(barcode)}.json?fields=${fields}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== 1 || !data.product) {
        Alert.alert(
          "Product not found",
          "No product matched this barcode. Try scanning it again."
        );
        return;
      }

      const product = data.product;
      const name = product.product_name || "Product name unavailable";
      const brand = product.brands || "Brand unavailable";
      const quantity = product.quantity || "Not listed";
      const category = product.categories || "Not listed";
      const ingredients = product.ingredients_text || "Not listed";

      Alert.alert(
        name,
        [
          `Brand: ${brand}`,
          `Barcode: ${product.code || barcode}`,
          `Quantity: ${quantity}`,
          `Category: ${category}`,
          `Ingredients: ${ingredients}`,
        ].join("\n\n"),
        [{ text: "Done" }]
      );
    } catch (error) {
      console.error("VERITY product lookup failed:", error);

      Alert.alert(
        "Lookup unavailable",
        "Unable to retrieve product details. Check your internet connection and try again."
      );
    }
  };

  const openSampleScan = (item: ScanRecord) => {
    Alert.alert(
      item.name,
      `Demonstration status: ${item.status}\n\nThis is sample data, not a live verification result.`,
      [{ text: "OK" }]
    );
  };

  const renderHome = () => (
    <>
      <View style={homeStyles.brandRow}>
        <View style={homeStyles.brandMark}>
          <MaterialCommunityIcons
            name="hexagon-outline"
            size={47}
            color={C.navy}
          />
          <View style={homeStyles.brandMarkInner}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={24}
              color={C.gold}
            />
          </View>
        </View>

        <View style={{ flex: 1, marginLeft: 9 }}>
          <Text style={homeStyles.brandName}>VERITY</Text>
          <Text style={homeStyles.brandSub}>FOOD AUTHENTICATION</Text>
        </View>

        <TouchableOpacity
          style={homeStyles.bell}
          onPress={() => goTo("Alerts")}
        >
          <Ionicons
            name="notifications-outline"
            size={23}
            color={C.white}
          />
        </TouchableOpacity>
      </View>

      <View style={homeStyles.hero}>
        <View style={homeStyles.heroCopy}>
          <Text style={homeStyles.heroTitle}>Facts first.</Text>
          <Text style={homeStyles.heroGold}>Always.</Text>
          <Text style={homeStyles.heroDescription}>
            Check food products against trusted records. Make informed choices
            about what you buy.
          </Text>
        </View>
        <Image
          source={{ uri: photos.hero }}
          style={homeStyles.heroImage}
        />
      </View>

      <TouchableOpacity
        style={homeStyles.mainScan}
        activeOpacity={0.85}
        onPress={() => goTo("Verify")}
      >
        <View style={homeStyles.mainScanIcon}>
          <MaterialCommunityIcons
            name="line-scan"
            size={43}
            color={C.navy}
          />
        </View>

        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={homeStyles.eyebrow}>START HERE</Text>
          <Text style={homeStyles.mainScanTitle}>Verify a product</Text>
          <Text style={homeStyles.mainScanSub}>
            Barcode · QR code · Product code
          </Text>
        </View>

        <View style={homeStyles.arrowCircle}>
          <Ionicons name="arrow-forward" size={23} color={C.navy} />
        </View>
      </TouchableOpacity>

      <Heading title="EXPLORE VERITY" />

      <View style={{ paddingHorizontal: 20, marginBottom: 22 }}>
        {sections.map((section, index) => (
          <View key={section.screen}>
            <ActionCard
              icon={section.icon}
              title={section.title}
              subtitle={section.subtitle}
              onPress={() => goTo(section.screen)}
            />
            {index === 0 && (
              <View style={homeStyles.sectionHint}>
                <Ionicons
                  name="information-circle-outline"
                  size={15}
                  color={C.muted}
                />
                <Text style={homeStyles.sectionHintText}>
                  A product lookup is not proof of authenticity.
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <Heading
        title="PRODUCT CATEGORIES"
        action="Browse registry"
        onPress={() => goTo("Registry")}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={homeStyles.categoryList}
      >
        {categories.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={homeStyles.categoryCard}
            activeOpacity={0.8}
            onPress={() => goTo("Registry")}
          >
            <Image
              source={{ uri: item.image }}
              style={homeStyles.categoryImage}
            />
            <View style={homeStyles.categoryShade} />
            <View style={homeStyles.categoryIcon}>
              <MaterialCommunityIcons
                name={item.icon as any}
                size={20}
                color={C.goldLight}
              />
            </View>
            <View style={homeStyles.categoryCopy}>
              <Text style={homeStyles.categoryName}>{item.name}</Text>
              <Text style={homeStyles.categorySub}>{item.sub}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Heading
        title="RECENT ACTIVITY"
        action="View history"
        onPress={() => goTo("History")}
      />

      <View style={homeStyles.recentCard}>
        {scans.slice(0, 3).map((item) => (
          <ScanRow
            key={item.id}
            item={item}
            onPress={() => openSampleScan(item)}
          />
        ))}
        <Text style={homeStyles.demoNote}>
          Sample entries only. Live scan history is not connected.
        </Text>
      </View>

      <View style={homeStyles.mission}>
        <MaterialCommunityIcons
          name="shield-check-outline"
          size={39}
          color={C.gold}
        />
        <View style={{ flex: 1 }}>
          <Text style={homeStyles.missionTitle}>
            Trust backed by evidence.
          </Text>
          <Text style={homeStyles.missionText}>
            VERITY is designed to compare product information with trusted
            records and flag inconsistencies for investigation.
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={homeStyles.companyLink}
        onPress={() => goTo("Company")}
      >
        <MaterialCommunityIcons
          name="domain"
          size={23}
          color={C.goldLight}
        />
        <View style={{ flex: 1 }}>
          <Text style={homeStyles.companyTitle}>
            For food and FMCG companies
          </Text>
          <Text style={homeStyles.companySubtitle}>
            Open the secure company portal
          </Text>
        </View>
        <Ionicons name="arrow-forward" size={19} color={C.goldLight} />
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={homeStyles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={homeStyles.page}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {screen === "Home" ? (
          renderHome()
        ) : (
          <View style={homeStyles.otherScreen}>
            <TouchableOpacity
              style={homeStyles.backButton}
              onPress={() => goTo("Home")}
            >
              <Ionicons name="arrow-back" size={19} color={C.ink} />
              <Text style={homeStyles.backText}>Home</Text>
            </TouchableOpacity>

            <AppScreen
              screen={screen}
              scans={scans}
              goTo={goTo}
              onVerify={handleVerify}
            />
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={homeStyles.bottomNav}>
        {nav.map((item) => {
          const active = screen === item.name;
          const isVerify = item.name === "Verify";

          return (
            <TouchableOpacity
              key={item.name}
              style={homeStyles.navItem}
              activeOpacity={0.8}
              onPress={() => goTo(item.name)}
            >
              <View
                style={[
                  homeStyles.navIconWrap,
                  isVerify && homeStyles.navScan,
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={isVerify ? 27 : 23}
                  color={
                    isVerify
                      ? C.navy
                      : active
                        ? C.goldLight
                        : "#BFC5C7"
                  }
                />
                {item.name === "Alerts" && (
                  <View style={homeStyles.navDot} />
                )}
              </View>
              <Text
                style={[
                  homeStyles.navLabel,
                  active && homeStyles.navLabelActive,
                ]}
              >
                {item.name === "Verify" ? "Scan" : item.name}
              </Text>
              {active && !isVerify ? (
                <View style={homeStyles.activeDot} />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const homeStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  page: { paddingTop: 12, paddingBottom: 12 },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    marginBottom: 17,
  },
  brandMark: {
    width: 53,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  brandMarkInner: { position: "absolute" },
  brandName: {
    fontSize: 29,
    letterSpacing: 7,
    fontWeight: "500",
    color: C.navy,
  },
  brandSub: {
    fontSize: 9,
    letterSpacing: 1.2,
    color: "#99845D",
    marginTop: 2,
  },
  bell: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: C.navy,
    alignItems: "center",
    justifyContent: "center",
  },

  hero: {
    minHeight: 255,
    marginHorizontal: 20,
    marginBottom: 14,
    justifyContent: "center",
    overflow: "hidden",
  },
  heroCopy: { width: "78%", zIndex: 2, paddingTop: 8 },
  heroTitle: {
    fontSize: 40,
    fontWeight: "700",
    letterSpacing: -1.7,
    color: C.navy,
    lineHeight: 46,
    fontFamily: "Georgia",
  },
  heroGold: {
    fontSize: 40,
    fontWeight: "700",
    letterSpacing: -1.5,
    color: "#AD9160",
    lineHeight: 45,
    fontFamily: "Georgia",
  },
  heroDescription: {
    fontSize: 13,
    lineHeight: 21,
    color: "#555B5C",
    marginTop: 14,
    maxWidth: 265,
  },
  heroImage: {
    position: "absolute",
    right: -30,
    bottom: 0,
    width: "58%",
    height: 190,
    opacity: 0.42,
    borderRadius: 70,
  },

  mainScan: {
    marginHorizontal: 20,
    backgroundColor: C.navy,
    borderRadius: 20,
    padding: 15,
    minHeight: 126,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 23,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  mainScanIcon: {
    width: 67,
    height: 74,
    borderRadius: 19,
    backgroundColor: C.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  eyebrow: {
    color: C.goldLight,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  mainScanTitle: {
    color: C.white,
    fontSize: 18,
    fontFamily: "Georgia",
    fontWeight: "700",
    marginBottom: 5,
  },
  mainScanSub: { color: "#D4D8D9", fontSize: 10, lineHeight: 16 },
  arrowCircle: {
    width: 42,
    height: 42,
    borderRadius: 22,
    backgroundColor: C.goldLight,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
  },

  sectionHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: -1,
    marginBottom: 12,
    paddingHorizontal: 3,
  },
  sectionHintText: { fontSize: 10, color: C.muted, flex: 1 },

  categoryList: {
    paddingLeft: 20,
    paddingRight: 10,
    gap: 9,
    marginBottom: 22,
  },
  categoryCard: {
    width: 130,
    height: 190,
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
    backgroundColor: "rgba(5,14,19,0.46)",
  },
  categoryIcon: {
    position: "absolute",
    left: 12,
    bottom: 68,
    width: 35,
    height: 35,
    borderRadius: 18,
    borderColor: C.gold,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10,20,25,0.5)",
  },
  categoryCopy: { position: "absolute", bottom: 12, left: 12, right: 8 },
  categoryName: {
    color: C.white,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 5,
  },
  categorySub: { color: "#E0E2E1", fontSize: 9, lineHeight: 14 },

  recentCard: {
    backgroundColor: C.navy,
    borderRadius: 18,
    marginHorizontal: 20,
    overflow: "hidden",
    marginBottom: 18,
  },
  demoNote: {
    color: "#C1C8C9",
    fontSize: 10,
    lineHeight: 15,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },

  mission: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 15,
    backgroundColor: "#F0EEE7",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E8E4DA",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  missionTitle: {
    color: C.ink,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  missionText: { color: "#555B5B", fontSize: 11, lineHeight: 16 },

  companyLink: {
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: C.navy,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  companyTitle: { color: C.white, fontSize: 12, fontWeight: "700" },
  companySubtitle: { color: "#D0D5D5", fontSize: 10, marginTop: 5 },

  otherScreen: { paddingHorizontal: 20, paddingTop: 8 },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingVertical: 12,
    paddingRight: 16,
    marginBottom: 13,
  },
  backText: { color: C.ink, fontSize: 12, fontWeight: "700" },

  bottomNav: {
    minHeight: 77,
    backgroundColor: C.navy,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 5,
    paddingBottom: 4,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 66,
  },
  navIconWrap: {
    width: 42,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  navScan: {
    width: 53,
    height: 53,
    borderRadius: 28,
    backgroundColor: C.gold,
    marginTop: -23,
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
    right: 4,
  },
  navLabel: { color: "#BFC5C7", fontSize: 9, marginTop: 4 },
  navLabelActive: { color: C.goldLight, fontWeight: "700" },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.gold,
    marginTop: 3,
  },
});
