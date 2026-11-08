
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

import { detectLocation, ScanLocation } from "./location-service";
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

const QR_MARKER = "__VERITY_QR__:";

export default function Screens({
  screen,
  records,
}: Props) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [product, setProduct] = useState<Product | null>(null);
  const [barcode, setBarcode] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [qrToken, setQrToken] = useState("");

  const [message, setMessage] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [scanLocation, setScanLocation] =
    useState<ScanLocation | null>(null);

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
    setScanLocation(null);
  };

  const openScanner = () => {
    setScannerOpen(true);
  };

  // QR codes and barcodes are handled separately.
  const handleScan = (code: string) => {
    const scannedValue = code.trim();

    if (!scannedValue) {
      setScannerOpen(false);
      setMessage("The scanner did not return a readable code.");
      return;
    }

    if (scannedValue.startsWith(QR_MARKER)) {
      const capturedQr = scannedValue
        .slice(QR_MARKER.length)
        .trim();

      setScannerOpen(false);

      if (!capturedQr) {
        setMessage("The QR code was empty or could not be read.");
        return;
      }

      setQrToken(capturedQr);
      setVerificationMessage("");
      setMessage(
        "QR code captured successfully. Enter or scan the product barcode and enter its serial number before submitting verification."
      );

      return;
    }

    lookupProduct(scannedValue);
  };

  // Barcode lookup retrieves product information only.
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
        throw new Error("Product lookup failed.");
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

  const handleVerify = async () => {
    if (!barcode.trim()) {
      Alert.alert(
        "Missing barcode",
        "Scan or enter the product barcode first."
      );
      return;
    }

    if (!serialNumber.trim() || !qrToken.trim()) {
      Alert.alert(
        "Missing verification details",
        "Enter the product serial number and QR token. Both are required by the current verification service."
      );
      return;
    }

    setVerifying(true);
    setVerificationMessage("");

    try {
      // Request a fresh location for every verification attempt.
      let location: ScanLocation;

      try {
        location = await detectLocation();
        setScanLocation(location);
      } catch {
        throw new Error(
          "Location is unavailable. Enable GPS and grant location permission before verifying."
        );
      }

      const result = await verifyBottle({
        barcode: barcode.trim(),
        serial_number: serialNumber.trim(),
        qr_token: qrToken.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        town: location.placeName,
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
          {scanLocation?.placeName || "Location not recorded yet"}
        </Text>

        <Text style={styles.locationDetails}>
          {scanLocation?.locationText ||
            "Your current location will be requested when you submit verification."}
        </Text>
      </View>
    </View>
  );

  // CAMERA SCREEN
  if (scannerOpen) {
    return (
      <ScannerScreen
        onScan={handleScan}
        onCancel={() => setScannerOpen(false)}
      />
    );
  }

  // PRODUCT AND VERIFICATION RESULTS
  if (loading || barcode || message || qrToken) {
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
            Provide the product identifiers registered with the
            verification service. Product database information
            alone does not establish authenticity.
          </Text>

          <Text style={styles.inputLabel}>
            PRODUCT BARCODE
          </Text>

          <TextInput
            value={barcode}
            onChangeText={setBarcode}
            placeholder="Scan or enter product barcode"
            placeholderTextColor={C.muted}
            keyboardType="number-pad"
            style={styles.input}
          />

          <TouchableOpacity
            style={styles.scanButton}
            onPress={openScanner}
          >
            <Ionicons
              name="scan-outline"
              size={18}
              color={C.text}
            />
            <Text style={styles.scanButtonText}>
              Scan barcode or QR code
            </Text>
          </TouchableOpacity>

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
            placeholder="Scan QR code or enter token"
            placeholderTextColor={C.muted}
            autoCapitalize="none"
            style={styles.input}
          />

          {qrToken ? (
            <Text style={styles.capturedText}>
              QR data captured. Check that it matches the registered
              token before submitting.
            </Text>
          ) : null}

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

        <Text style={styles.disclaimer}>
          A successful database response confirms only what the
          connected registry reports. It does not independently
          prove the physical product is genuine.
        </Text>

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
          Scan a food product barcode or QR code to retrieve
          available product information and capture its
          verification identifiers.
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
              key={record.id || index}
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
            onPress={() => {
              reset();
              // Navigation is handled by the parent app.
            }}
          >
            <Text style={styles.primaryButtonText}>
              Use the Verify tab to scan
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

        <Text style={styles.primaryButtonText}>
          Use the Verify tab to start scanning.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>
        How it works
      </Text>

      <InfoCard
        icon="scan-outline"
        title="01. Scan"
        text="Capture the product barcode or QR code."
      />

      <InfoCard
        icon="search-outline"
        title="02. Review"
        text="Compare available product details with the packaging."
      />

      <InfoCard
        icon="location-outline"
        title="03. Locate"
        text="Record scan coordinates when location permission is available."
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

  scanButton: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 10,
  },

  scanButtonText: {
    color: C.text,
    fontSize: 13,
    fontWeight: "700",
  },

  capturedText: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
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

  disclaimer: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
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
