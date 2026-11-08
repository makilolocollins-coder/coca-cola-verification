
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  StyleSheet,
  TextInput,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import {
  C,
  ScanRecord,
  ScreenName,
  ScanRow,
  InfoCard,
} from "./components";

import ScannerScreen from "./scanner-screen";
import ResultsScreen, { ProductInfo } from "./results-screen";

import {
  detectLocation,
  ScanLocation,
} from "./location-service";

import { verifyBottle } from "../verification";

type Props = {
  screen: ScreenName;
  records: ScanRecord[];
  onNavigate: (screen: ScreenName) => void;
  onVerify: (code: string) => void;
};

type Product = {
  product_name?: string;
  brands?: string;
  quantity?: string;
  image_front_url?: string;
  categories?: string;
};

export default function Screens({
  screen,
  records,
  onNavigate,
}: Props) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [product, setProduct] = useState<Product | null>(null);
  const [barcode, setBarcode] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [qrToken, setQrToken] = useState("");

  const [message, setMessage] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");

  const [scanLocation, setScanLocation] =
    useState<ScanLocation | null>(null);

  // Reset the current product check.
  const reset = () => {
    setScannerOpen(false);
    setLoading(false);
    setVerifying(false);
    setProduct(null);
    setBarcode("");
    setSerialNumber("");
    setQrToken("");
    setMessage("");
    setVerificationMessage("");
  };

  // Open camera independently of GPS.
  const openScanner = async () => {
    reset();
    setScannerOpen(true);
    setLocationLoading(true);

    try {
      const location = await detectLocation();
      setScanLocation(location);
    } catch {
      setScanLocation(null);
    } finally {
      setLocationLoading(false);
    }
  };

  // Look up product information using its barcode.
  // This does not establish product authenticity.
  const lookupProduct = async (code: string) => {
    const cleanCode = code.trim();

    if (!cleanCode || loading) return;

    setBarcode(cleanCode);
    setScannerOpen(false);
    setLoading(true);
    setProduct(null);
    setMessage("");
    setVerificationMessage("");

    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
          cleanCode
        )}.json`
      );

      if (!response.ok) {
        throw new Error("Product lookup failed");
      }

      const result = await response.json();

      if (result.status === 1 && result.product) {
        setProduct(result.product);

        setMessage(
          "Product information found. Compare it with the physical packaging. This lookup does not prove authenticity."
        );
      } else {
        setMessage(
          "No matching product record was found. This does not by itself mean the product is counterfeit."
        );
      }
    } catch {
      setMessage(
        "Could not retrieve product information. Check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Submit identifiers to the VERITY verification service.
  const handleVerify = async () => {
    if (!barcode.trim()) {
      Alert.alert(
        "Missing barcode",
        "Scan or enter a product barcode first."
      );
      return;
    }

    if (!serialNumber.trim() || !qrToken.trim()) {
      Alert.alert(
        "Missing verification details",
        "Enter the product serial number and QR token. These are required by the current verification service."
      );
      return;
    }

    setVerifying(true);
    setVerificationMessage("");

    try {
      let location = scanLocation;

      if (!location) {
        try {
          location = await detectLocation();
          setScanLocation(location);
        } catch {
          throw new Error(
            "Location is unavailable. Enable GPS and grant location permission before verifying."
          );
        }
      }

      const result = await verifyBottle({
        barcode: barcode.trim(),
        serial_number: serialNumber.trim(),
        qr_token: qrToken.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        town: location.placeName,
        region: "",
        country: "",
        scan_place: location.locationText,
      });

      setVerificationMessage(
        typeof result.note === "string"
          ? result.note
          : typeof result.message === "string"
          ? result.message
          : JSON.stringify(result, null, 2)
      );
    } catch (error) {
      setVerificationMessage(
        error instanceof Error
          ? error.message
          : "Verification could not be completed."
      );
    } finally {
      setVerifying(false);
    }
  };

  // Location information card.
  const locationCard = () => (
    <View style={styles.locationCard}>
      <Ionicons
        name="location-outline"
        size={22}
        color={C.gold}
      />

      <View style={{ flex: 1 }}>
        <Text style={styles.locationTitle}>
          Scan location
        </Text>

        <Text style={styles.locationPlace}>
          {scanLocation?.placeName || "Location not available"}
        </Text>

        <Text style={styles.locationDetails}>
          {scanLocation?.locationText ||
            "Location will be requested when verification is attempted."}
        </Text>
      </View>
    </View>
  );

  // CAMERA SCREEN
  if (scannerOpen) {
    return (
      <ScannerScreen
        onScan={lookupProduct}
        onCancel={() => setScannerOpen(false)}
      />
    );
  }

  // PRODUCT RESULTS SCREEN
  if (loading || barcode || message) {
    const resultProduct: ProductInfo | null = product
      ? {
          name: product.product_name,
          brand: product.brands,
          barcode,
          image: product.image_front_url,
          quantity: product.quantity,
          categories: product.categories,
        }
      : null;

    return (
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {locationCard()}

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator
              size="large"
              color={C.gold}
            />

            <Text style={styles.description}>
              Retrieving product information...
            </Text>
          </View>
        ) : null}

        {product?.image_front_url ? (
          <Image
            source={{ uri: product.image_front_url }}
            style={styles.productImage}
            resizeMode="contain"
          />
        ) : null}

        <ResultsScreen
          product={resultProduct}
          barcode={barcode}
          loading={verifying}
          message={message}
          onScanAgain={openScanner}
          onVerify={handleVerify}
        />

        <View style={styles.verificationForm}>
          <Text style={styles.formTitle}>
            Verification details
          </Text>

          <Text style={styles.formDescription}>
            Enter the identifiers registered for this product.
            A barcode lookup alone cannot establish authenticity.
          </Text>

          <Text style={styles.inputLabel}>
            SERIAL NUMBER
          </Text>

          <TextInput
            value={serialNumber}
            onChangeText={setSerialNumber}
            placeholder="Enter product serial number"
            placeholderTextColor={C.muted}
            autoCapitalize="characters"
            style={styles.input}
          />

          <Text style={styles.inputLabel}>
            QR TOKEN
          </Text>

          <TextInput
            value={qrToken}
            onChangeText={setQrToken}
            placeholder="Enter QR token"
            placeholderTextColor={C.muted}
            autoCapitalize="none"
            style={styles.input}
          />

          <TouchableOpacity
            style={[
              styles.verifyButton,
              verifying && { opacity: 0.6 },
            ]}
            onPress={handleVerify}
            disabled={verifying}
          >
            {verifying ? (
              <ActivityIndicator color={C.background} />
            ) : (
              <Text style={styles.verifyButtonText}>
                Submit verification
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {verificationMessage ? (
          <View style={styles.verificationCard}>
            <Text style={styles.cardTitle}>
              Verification response
            </Text>

            <Text style={styles.description}>
              {verificationMessage}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={reset}
        >
          <Text style={styles.secondaryText}>
            Back to VERITY
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // VERIFY / SCAN SCREEN
  if (screen === "Verify") {
    return (
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.eyebrow}>
          VERITY / PRODUCT CHECK
        </Text>

        <Text style={styles.title}>
          Scan a product.
        </Text>

        <Text style={styles.description}>
          Scan a food product barcode to retrieve available product
          information. You can then submit its registered identifiers
          for verification.
        </Text>

        <View style={styles.card}>
          <MaterialCommunityIcons
            name="barcode-scan"
            size={44}
            color={C.gold}
          />

          <Text style={styles.cardTitle}>
            Camera scanner
          </Text>

          {scanLocation ? locationCard() : null}

          {locationLoading ? (
            <ActivityIndicator
              style={{ margin: 18 }}
              size="small"
              color={C.gold}
            />
          ) : null}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={openScanner}
          >
            <Text style={styles.primaryButtonText}>
              Open camera scanner
            </Text>
          </TouchableOpacity>
        </View>

        <InfoCard
          icon="information-circle-outline"
          title="Product identification"
          text="Product databases can help identify products, but a matching barcode is not proof that a physical product is genuine."
        />
      </ScrollView>
    );
  }

  // HISTORY SCREEN
  if (screen === "History") {
    return (
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.eyebrow}>
          YOUR ACTIVITY
        </Text>

        <Text style={styles.title}>
          Scan history
        </Text>

        {records.length > 0 ? (
          records.map((record, index) => (
            <ScanRow
              key={index}
              record={record}
            />
          ))
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              No scans yet
            </Text>

            <Text style={styles.description}>
              Start scanning products to review their available details.
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => onNavigate("Verify")}
            >
              <Text style={styles.primaryButtonText}>
                Scan a product
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  }

  // PROFILE SCREEN
  if (screen === "Profile") {
    return (
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.eyebrow}>
          YOUR ACCOUNT
        </Text>

        <Text style={styles.title}>
          Profile
        </Text>

        <InfoCard
          icon="shield-checkmark-outline"
          title="VERITY"
          text="Review available product records and verification results. Always inspect the physical packaging."
        />
      </ScrollView>
    );
  }

  // ALERTS SCREEN
  if (screen === "Alerts") {
    return (
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.eyebrow}>
          PRODUCT SAFETY
        </Text>

        <Text style={styles.title}>
          Alerts
        </Text>

        <InfoCard
          icon="notifications-outline"
          title="No alerts yet"
          text="Product alerts and suspicious scan notifications will appear here when the alert service is connected."
        />
      </ScrollView>
    );
  }

  // PRODUCT REGISTRY SCREEN
  if (screen === "Registry") {
    return (
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.eyebrow}>
          VERITY / PRODUCT DATABASE
        </Text>

        <Text style={styles.title}>
          Product Registry
        </Text>

        <Text style={styles.description}>
          Explore product identification and registration information.
          Product registration data must be checked against the official
          verification service.
        </Text>

        <View style={styles.card}>
          <MaterialCommunityIcons
            name="database-search-outline"
            size={42}
            color={C.gold}
          />

          <Text style={styles.cardTitle}>
            Check a product
          </Text>

          <Text style={styles.description}>
            Scan a product barcode to retrieve available product
            information and submit its registered identifiers
            for verification.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => onNavigate("Verify")}
          >
            <Text style={styles.primaryButtonText}>
              Check product
            </Text>
          </TouchableOpacity>
        </View>

        <InfoCard
          icon="information-circle-outline"
          title="Important"
          text="A product appearing in a public product database does not mean it is registered with VERITY or confirmed as genuine."
        />
      </ScrollView>
    );
  }

  // COMPANY PORTAL SCREEN
  if (screen === "Company") {
    return (
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.eyebrow}>
          VERITY / BUSINESS SOLUTIONS
        </Text>

        <Text style={styles.title}>
          Company Portal
        </Text>

        <Text style={styles.description}>
          A dedicated space for food manufacturers and authorised
          brand representatives to manage product authentication.
        </Text>

        <View style={styles.card}>
          <MaterialCommunityIcons
            name="domain"
            size={42}
            color={C.gold}
          />

          <Text style={styles.cardTitle}>
            Manufacturer dashboard
          </Text>

          <Text style={styles.description}>
            The planned company dashboard will support product
            registration, verification activity monitoring,
            suspicious scan reports and product-level insights.
          </Text>

          <View style={styles.statusPanel}>
            <Text style={styles.statusLabel}>
              DEVELOPMENT STATUS
            </Text>

            <Text style={styles.statusDescription}>
              Company account access and dashboard services
              are not yet connected.
            </Text>
          </View>
        </View>

        <InfoCard
          icon="shield-checkmark-outline"
          title="Authorised access"
          text="Company accounts should be created and approved by the VERITY administrator. This page does not currently authenticate company users."
        />

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => onNavigate("Verify")}
        >
          <Text style={styles.secondaryText}>
            Return to product verification
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // HOME FALLBACK
  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.eyebrow}>
        VERITY / PRODUCT INTELLIGENCE
      </Text>

      <Text style={styles.title}>
        Look closer.
      </Text>

      <Text style={styles.description}>
        Review food product information and check available
        verification records before you buy.
      </Text>

      <View style={styles.hero}>
        <MaterialCommunityIcons
          name="barcode-scan"
          size={48}
          color={C.gold}
        />

        <Text style={styles.heroTitle}>
          Know what you're checking.
        </Text>

        <Text style={styles.description}>
          Scan a product, review its details, and submit its
          registered identifiers for verification.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => onNavigate("Verify")}
        >
          <Text style={styles.primaryButtonText}>
            Start scanning
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>
        How it works
      </Text>

      <InfoCard
        icon="scan-outline"
        title="01. Scan"
        text="Capture the product barcode."
      />

      <InfoCard
        icon="search-outline"
        title="02. Review"
        text="Compare available product details with the packaging."
      />

      <InfoCard
        icon="location-outline"
        title="03. Locate"
        text="Record scan coordinates where location permission is available."
      />

      <InfoCard
        icon="shield-checkmark-outline"
        title="04. Verify carefully"
        text="A barcode lookup alone cannot confirm authenticity."
      />
    </ScrollView>
  );
}

// SCREEN STYLES
const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: C.background,
  },

  content: {
    padding: 22,
    paddingBottom: 40,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    color: C.muted,
    marginBottom: 12,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: C.text,
    marginBottom: 12,
  },

  description: {
    fontSize: 14,
    lineHeight: 22,
    color: C.muted,
    marginTop: 8,
    marginBottom: 18,
  },

  card: {
    padding: 22,
    borderRadius: 22,
    backgroundColor: C.card,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: C.border,
  },

  hero: {
    padding: 22,
    borderRadius: 24,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 10,
    marginBottom: 28,
  },

  heroTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: C.text,
    marginTop: 18,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: C.text,
    marginTop: 16,
    marginBottom: 8,
  },

  primaryButton: {
    minHeight: 52,
    borderRadius: 15,
    backgroundColor: C.navy,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    marginTop: 8,
  },

  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: C.white,
  },

  secondaryButton: {
    minHeight: 48,
    borderRadius: 15,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  secondaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
  },

  loading: {
    padding: 24,
    alignItems: "center",
    gap: 14,
  },

  productImage: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    backgroundColor: C.white,
    marginBottom: 18,
  },

  locationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: C.card,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: C.border,
  },

  locationTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
    marginBottom: 6,
  },

  locationPlace: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
    color: C.text,
    marginBottom: 5,
  },

  locationDetails: {
    fontSize: 12,
    lineHeight: 19,
    color: C.muted,
  },

  verificationForm: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 18,
  },

  formTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: C.text,
  },

  formDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: C.muted,
    marginTop: 8,
    marginBottom: 18,
  },

  inputLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: C.muted,
    marginBottom: 7,
    marginTop: 12,
  },

  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    color: C.text,
    backgroundColor: C.background,
    fontSize: 14,
  },

  verifyButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: C.navy,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  verifyButtonText: {
    color: C.white,
    fontSize: 14,
    fontWeight: "800",
  },

  verificationCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 18,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: C.text,
    marginBottom: 16,
  },

  statusPanel: {
    padding: 13,
    borderRadius: 12,
    backgroundColor: C.background,
    marginTop: 8,
  },

  statusLabel: {
    color: C.gold,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },

  statusDescription: {
    color: C.text,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 20,
  },
});
