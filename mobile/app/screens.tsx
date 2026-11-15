
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
import {
  verifyBottle,
  VerificationResponse,
} from "../verification";

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
  const [locationLoading, setLocationLoading] = useState(false);

  const [product, setProduct] = useState<Product | null>(null);
  const [barcode, setBarcode] = useState("");
  const [qrToken, setQrToken] = useState("");

  const [message, setMessage] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [locationError, setLocationError] = useState("");

  const [verificationResult, setVerificationResult] =
    useState<VerificationResponse | null>(null);

  const [scanLocation, setScanLocation] =
    useState<ScanLocation | null>(null);

  const [locationConfirmed, setLocationConfirmed] = useState(false);

  const reset = () => {
    setScannerOpen(false);
    setLoading(false);
    setVerifying(false);
    setLocationLoading(false);
    setProduct(null);
    setBarcode("");
    setQrToken("");
    setMessage("");
    setVerificationMessage("");
    setLocationError("");
    setVerificationResult(null);
    setScanLocation(null);
    setLocationConfirmed(false);
  };

  // STEP 1: Detect location.
  const prepareLocation = async () => {
    if (locationLoading) return;

    setLocationLoading(true);
    setLocationError("");
    setLocationConfirmed(false);
    setScanLocation(null);

    try {
      const location = await detectLocation();
      setScanLocation(location);
    } catch (error) {
      setLocationError(
        error instanceof Error
          ? error.message
          : "Could not detect your location. Please try again."
      );
    } finally {
      setLocationLoading(false);
    }
  };

  // STEP 2: Confirm location before scanning.
  const confirmLocationAndScan = () => {
    if (!scanLocation) {
      Alert.alert(
        "Location required",
        "Detect your location before opening the scanner."
      );
      return;
    }

    setLocationConfirmed(true);
    setLocationError("");
    setScannerOpen(true);
  };

  const openScanner = () => {
    if (!scanLocation || !locationConfirmed) {
      prepareLocation();
      return;
    }

    setScannerOpen(true);
  };

  // STEP 3: Handle barcode and QR scans separately.
  const handleScan = (code: string) => {
    const scannedValue = code.trim();

    if (!scannedValue) {
      setScannerOpen(false);
      setMessage("The scanner did not return a readable code.");
      return;
    }

    // QR credentials are accepted only after barcode identification.
    if (scannedValue.startsWith(QR_MARKER)) {
      const capturedQr = scannedValue
        .slice(QR_MARKER.length)
        .trim();

      setScannerOpen(false);

      if (!capturedQr) {
        setMessage("The QR code could not be read. Please try again.");
        return;
      }

      if (!barcode) {
        setMessage(
          "Scan the product barcode first. Then scan its QR credential."
        );
        return;
      }

      setQrToken(capturedQr);
      setMessage("QR captured. Authenticating this individual product...");

      // Start verification immediately. No manual serial entry.
      submitVerification(capturedQr);
      return;
    }

    // A normal barcode starts product identification.
    lookupProduct(scannedValue);
  };

  // STEP 4: Retrieve general product information.
  const lookupProduct = async (code: string) => {
    const cleanCode = code.trim();

    if (!cleanCode || loading || verifying) return;

    setBarcode(cleanCode);
    setQrToken("");
    setVerificationResult(null);
    setVerificationMessage("");
    setScannerOpen(false);
    setLoading(true);
    setProduct(null);
    setMessage("");

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
          "Product information found. Compare it with the physical packaging. This lookup does not prove authenticity. Next, scan the bottle QR code."
        );
      } else {
        setMessage(
          "No matching public product record was found. This does not by itself mean the product is counterfeit. You can still scan the QR credential for registry verification."
        );
      }
    } catch {
      setMessage(
        "Could not retrieve public product information. You can still scan the QR credential to check the VERITY registry."
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 5: Send QR token and barcode to Supabase.
  const submitVerification = async (token: string) => {
    if (!token.trim() || !barcode.trim()) {
      setVerificationMessage(
        "A product barcode and QR credential are required."
      );
      return;
    }

    if (!scanLocation || !locationConfirmed) {
      setVerificationMessage(
        "Your scan location has not been confirmed."
      );
      return;
    }

    if (verifying) return;

    setVerifying(true);
    setVerificationMessage("");
    setVerificationResult(null);

    try {
      const result = await verifyBottle({
        qr_token: token.trim(),
        barcode: barcode.trim(),
        latitude: scanLocation.latitude,
        longitude: scanLocation.longitude,
      });

      setVerificationResult(result);

      setVerificationMessage(
        result.note || "Verification response received."
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

  // ResultsScreen button opens QR scanning if no token has been scanned.
  const handleVerify = () => {
    if (!barcode) {
      Alert.alert(
        "Barcode required",
        "Scan the product barcode first."
      );
      return;
    }

    if (!qrToken) {
      setMessage(
        "Product identified. Scan the QR credential on the individual bottle to continue."
      );
      openScanner();
      return;
    }

    submitVerification(qrToken);
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
          Confirmed scan location
        </Text>

        <Text style={styles.locationPlace}>
          {scanLocation?.placeName || "Location not recorded"}
        </Text>

        <Text style={styles.locationDetails}>
          {scanLocation?.locationText || "No location details available"}
        </Text>

        {scanLocation ? (
          <Text style={styles.accuracyText}>
            GPS accuracy: approximately {Math.round(scanLocation.accuracy)} metres
          </Text>
        ) : null}
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
            <ActivityIndicator size="large" color={C.gold} />
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

        {/* QR scanning instructions */}
        <View style={styles.verificationForm}>
          <Text style={styles.formTitle}>
            Individual bottle authentication
          </Text>

          <Text style={styles.formDescription}>
            The barcode identifies the product type. The QR credential
            identifies the individual bottle in the VERITY registry.
            Scan the QR code to retrieve its registered serial number.
          </Text>

          <View style={styles.stepRow}>
            <Ionicons
              name="barcode-outline"
              size={22}
              color={C.gold}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>
                Product barcode
              </Text>
              <Text style={styles.stepValue}>
                {barcode || "Not scanned"}
              </Text>
            </View>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={C.gold}
            />
          </View>

          <View style={styles.stepRow}>
            <Ionicons
              name="qr-code-outline"
              size={22}
              color={C.gold}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>
                Individual bottle QR
              </Text>
              <Text style={styles.stepValue}>
                {verificationResult
                  ? "QR credential processed"
                  : qrToken
                  ? "QR captured"
                  : "Awaiting QR scan"}
              </Text>
            </View>
            {verificationResult ? (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={C.gold}
              />
            ) : null}
          </View>

          {!verificationResult ? (
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={openScanner}
              disabled={verifying || loading}
            >
              {verifying ? (
                <ActivityIndicator color={C.background} />
              ) : (
                <>
                  <Ionicons
                    name="qr-code-outline"
                    size={20}
                    color={C.white}
                  />
                  <Text style={styles.verifyButtonText}>
                    {qrToken ? "Scan QR again" : "Scan bottle QR code"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Actual registry response */}
        {verificationResult ? (
          <View style={styles.verificationCard}>
            <Text style={styles.cardTitle}>
              VERITY registry response
            </Text>

            <Text style={styles.resultStatus}>
              {verificationResult.verification}
            </Text>

            {verificationResult.product?.brand ? (
              <Text style={styles.resultLine}>
                Brand: {verificationResult.product.brand}
              </Text>
            ) : null}

            {verificationResult.product?.product_name ? (
              <Text style={styles.resultLine}>
                Product: {verificationResult.product.product_name}
              </Text>
            ) : null}

            {verificationResult.product?.serial_number ? (
              <View style={styles.serialPanel}>
                <Text style={styles.serialLabel}>
                  REGISTERED SERIAL NUMBER
                </Text>
                <Text style={styles.serialNumber}>
                  {verificationResult.product.serial_number}
                </Text>
              </View>
            ) : null}

            {verificationResult.product?.packaging ? (
              <Text style={styles.resultLine}>
                Packaging: {verificationResult.product.packaging}
              </Text>
            ) : null}

            {verificationResult.product?.batch_number ? (
              <Text style={styles.resultLine}>
                Batch: {verificationResult.product.batch_number}
              </Text>
            ) : null}

            <View style={styles.riskPanel}>
              <Text style={styles.riskTitle}>
                RISK ASSESSMENT
              </Text>

              <Text style={styles.riskScore}>
                {verificationResult.risk_level || "NOT AVAILABLE"}
                {typeof verificationResult.risk_score === "number"
                  ? ` · ${verificationResult.risk_score}/100`
                  : ""}
              </Text>

              {verificationResult.risk_reasons?.length ? (
                verificationResult.risk_reasons.map((reason, index) => (
                  <Text key={index} style={styles.resultLine}>
                    • {reason}
                  </Text>
                ))
              ) : (
                <Text style={styles.resultLine}>
                  No risk reasons were reported by the current assessment.
                </Text>
              )}
            </View>

            {typeof verificationResult.previous_scans_24h === "number" ? (
              <Text style={styles.resultLine}>
                Previous scans in 24 hours: {verificationResult.previous_scans_24h}
              </Text>
            ) : null}

            <Text style={styles.description}>
              {verificationMessage}
            </Text>
          </View>
        ) : null}

        {!verificationResult && verificationMessage ? (
          <View style={styles.verificationCard}>
            <Text style={styles.cardTitle}>
              Verification message
            </Text>
            <Text style={styles.description}>
              {verificationMessage}
            </Text>
          </View>
        ) : null}

        <Text style={styles.disclaimer}>
          A successful registry match confirms that the scanned
          identifiers match a database record. It does not independently
          prove that the physical packaging has not been copied or tampered with.
          GPS coordinates may also be inaccurate or spoofed.
        </Text>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={reset}
        >
          <Text style={styles.secondaryText}>
            Start a new scan
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
          Your location must be detected and confirmed before
          the camera scanner opens. This helps record where
          each verification attempt takes place.
        </Text>

        <View style={styles.card}>
          <MaterialCommunityIcons
            name="map-marker-radius-outline"
            size={44}
            color={C.gold}
          />

          <Text style={styles.cardTitle}>
            Step 1. Confirm your location
          </Text>

          <Text style={styles.formDescription}>
            VERITY needs foreground location permission and a
            sufficiently accurate GPS reading before scanning.
          </Text>

          {locationLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={C.gold} />
              <Text style={styles.description}>
                Detecting your location...
              </Text>
            </View>
          ) : null}

          {locationError ? (
            <Text style={styles.errorText}>
              {locationError}
            </Text>
          ) : null}

          {scanLocation ? (
            <View style={styles.locationPreview}>
              <Text style={styles.locationPlace}>
                {scanLocation.placeName}
              </Text>

              <Text style={styles.locationDetails}>
                {scanLocation.locationText}
              </Text>

              <Text style={styles.accuracyText}>
                GPS accuracy: approximately {Math.round(scanLocation.accuracy)} metres
              </Text>

              <Text style={styles.locationDetails}>
                Captured: {new Date(scanLocation.capturedAt).toLocaleTimeString()}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              locationLoading && { opacity: 0.6 },
            ]}
            onPress={prepareLocation}
            disabled={locationLoading}
          >
            <Text style={styles.secondaryText}>
              {scanLocation ? "Detect location again" : "Detect my location"}
            </Text>
          </TouchableOpacity>

          {scanLocation ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={confirmLocationAndScan}
            >
              <Text style={styles.primaryButtonText}>
                Confirm location & continue
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.card}>
          <MaterialCommunityIcons
            name="barcode-scan"
            size={44}
            color={C.gold}
          />

          <Text style={styles.cardTitle}>
            Step 2. Scan your product
          </Text>

          <Text style={styles.description}>
            First scan the product barcode. Then scan its individual
            QR credential to retrieve its registered serial number.
          </Text>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              !locationConfirmed && { opacity: 0.45 },
            ]}
            onPress={openScanner}
            disabled={!locationConfirmed}
          >
            <Text style={styles.primaryButtonText}>
              Open camera scanner
            </Text>
          </TouchableOpacity>
        </View>

        <InfoCard
          icon="information-circle-outline"
          title="Product identification"
          text="Product databases can help identify products, but a matching barcode is not proof that a physical product is genuine. GPS records the scan location; it does not prove product authenticity."
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
        <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
        <Text style={styles.title}>Profile</Text>

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
        <Text style={styles.eyebrow}>PRODUCT SAFETY</Text>
        <Text style={styles.title}>Alerts</Text>

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
            information and then scan its individual QR credential.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={reset}
          >
            <Text style={styles.primaryButtonText}>
              Use the Verify tab to scan
            </Text>
          </TouchableOpacity>
        </View>

        <InfoCard
          icon="information-circle-outline"
          title="Important"
          text="A product appearing in a public product database does not mean the product is registered with VERITY or confirmed as genuine."
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
          Scan a product barcode, review its details, and
          authenticate the individual bottle using its QR credential.
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
        title="01. Locate"
        text="Detect and confirm your GPS location before scanning."
      />

      <InfoCard
        icon="barcode-outline"
        title="02. Identify"
        text="Scan the product barcode and review its available information."
      />

      <InfoCard
        icon="qr-code-outline"
        title="03. Authenticate"
        text="Scan the individual QR credential to retrieve its registered serial number."
      />

      <InfoCard
        icon="shield-checkmark-outline"
        title="04. Review"
        text="Review the registry response and risk assessment. A registry match alone cannot prove the physical packaging has not been copied."
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

  accuracyText: {
    fontSize: 12,
    lineHeight: 19,
    color: C.gold,
    fontWeight: "700",
    marginTop: 7,
  },

  locationPreview: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: C.background,
    marginTop: 12,
  },

  errorText: {
    color: "#B45353",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
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

  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },

  stepTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
  },

  stepValue: {
    fontSize: 12,
    color: C.muted,
    marginTop: 4,
  },

  verifyButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: C.navy,
    flexDirection: "row",
    gap: 10,
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

  resultStatus: {
    fontSize: 21,
    fontWeight: "800",
    color: C.gold,
    marginTop: 12,
    marginBottom: 14,
  },

  resultLine: {
    fontSize: 13,
    lineHeight: 21,
    color: C.text,
    marginTop: 7,
  },

  serialPanel: {
    padding: 15,
    borderRadius: 13,
    backgroundColor: C.background,
    marginTop: 15,
    marginBottom: 12,
  },

  serialLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: C.muted,
  },

  serialNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: C.text,
    marginTop: 8,
  },

  riskPanel: {
    padding: 15,
    borderRadius: 13,
    backgroundColor: C.background,
    marginTop: 18,
  },

  riskTitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: C.muted,
  },

  riskScore: {
    fontSize: 18,
    fontWeight: "800",
    color: C.gold,
    marginTop: 8,
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
