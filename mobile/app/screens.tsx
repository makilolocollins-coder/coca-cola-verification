import React, { useRef, useState } from "react";
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
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";

import {
  C,
  ScanRecord,
  ScreenName,
  ScanRow,
  InfoCard,
} from "./components";

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
  const [permission, requestPermission] = useCameraPermissions();

  const [scannerOpen, setScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const [product, setProduct] = useState<Product | null>(null);
  const [barcode, setBarcode] = useState("");
  const [message, setMessage] = useState("");

  const [placeName, setPlaceName] = useState("");
  const [locationText, setLocationText] = useState("");
  const [coordinates, setCoordinates] =
    useState<Location.LocationObjectCoords | null>(null);

  const scanLock = useRef(false);

  const reset = () => {
    setScannerOpen(false);
    setLoading(false);
    setProduct(null);
    setBarcode("");
    setMessage("");
    scanLock.current = false;
  };

  const detectLocation = async (): Promise<boolean> => {
    setLocationLoading(true);
    setPlaceName("");
    setLocationText("");
    setCoordinates(null);

    try {
      const servicesEnabled =
        await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        Alert.alert(
          "Location is turned off",
          "Turn on your phone's location service and try again."
        );
        return false;
      }

      const permissionResult =
        await Location.requestForegroundPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Location permission required",
          "Allow VERITY to access your location so it can associate the scan with the place where it was made."
        );
        return false;
      }

      const currentLocation =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

      const coords = currentLocation.coords;

      setCoordinates(coords);

      setLocationText(
        `Latitude: ${coords.latitude.toFixed(6)}\nLongitude: ${coords.longitude.toFixed(6)}`
      );

      // Reverse geocoding is optional: if it fails, GPS coordinates
      // remain available and the user can still continue.
      try {
        const addresses = await Location.reverseGeocodeAsync({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });

        if (addresses.length > 0) {
          const address = addresses[0];

          const readablePlace = [
            address.name,
            address.street,
            address.subregion,
            address.city,
            address.region,
            address.country,
          ]
            .filter(
              (value, index, array) =>
                Boolean(value) &&
                array.indexOf(value) === index
            )
            .join(", ");

          setPlaceName(
            readablePlace || "Place name unavailable"
          );
        } else {
          setPlaceName("Place name unavailable");
        }
      } catch {
        setPlaceName("Place name unavailable");
      }

      return true;
    } catch {
      Alert.alert(
        "Location unavailable",
        "VERITY could not retrieve your current location. Check your GPS settings and try again."
      );
      return false;
    } finally {
      setLocationLoading(false);
    }
  };

  const openScanner = async () => {
    reset();

    const locationDetected = await detectLocation();

    if (!locationDetected) {
      return;
    }

    if (!permission?.granted) {
      const result = await requestPermission();

      if (!result.granted) {
        Alert.alert(
          "Camera permission required",
          "Allow camera access to scan product barcodes."
        );
        return;
      }
    }

    setScannerOpen(true);
  };

  const lookupProduct = async (code: string) => {
    if (scanLock.current) {
      return;
    }

    scanLock.current = true;
    setBarcode(code);
    setScannerOpen(false);
    setLoading(true);
    setProduct(null);
    setMessage("");

    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`
      );

      if (!response.ok) {
        throw new Error("Product lookup failed");
      }

      const result = await response.json();

      if (result.status === 1 && result.product) {
        setProduct(result.product);

        setMessage(
          "Product information found. Compare these details with the physical packaging. This lookup does not prove authenticity."
        );
      } else {
        setMessage(
          "No matching product record was found. The product may not be listed in the database. This does not mean it is counterfeit."
        );
      }
    } catch {
      setMessage(
        "Could not retrieve product information. Check your internet connection and try again."
      );
    } finally {
      setLoading(false);
      scanLock.current = false;
    }
  };

  const PrimaryButton = ({
    title,
    onPress,
    disabled = false,
  }: {
    title: string;
    onPress: () => void;
    disabled?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.primaryButton,
        disabled && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={styles.primaryButtonText}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const LocationCard = ({
    title,
  }: {
    title: string;
  }) => (
    <View style={styles.locationCard}>
      <Ionicons
        name="location-outline"
        size={23}
        color={C.text}
      />

      <View style={{ flex: 1 }}>
        <Text style={styles.locationTitle}>
          {title}
        </Text>

        <Text style={styles.locationPlace}>
          {placeName || "Place name unavailable"}
        </Text>

        <Text style={styles.locationDetails}>
          {locationText || "Coordinates unavailable"}
        </Text>
      </View>
    </View>
  );

  // CAMERA SCANNER
  if (scannerOpen) {
    return (
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={reset}>
            <Ionicons
              name="arrow-back"
              size={26}
              color={C.text}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Scan product
          </Text>

          <View style={{ width: 26 }} />
        </View>

        <LocationCard title="Current scan location" />

        <Text style={styles.description}>
          Place the barcode inside the camera frame.
        </Text>

        <View style={styles.cameraContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: [
                "ean13",
                "ean8",
                "upc_a",
                "upc_e",
                "code128",
                "code39",
                "qr",
              ],
            }}
            onBarcodeScanned={({ data }) => {
              if (data && !scanLock.current) {
                void lookupProduct(data);
              }
            }}
          />

          <View
            pointerEvents="none"
            style={styles.scanFrame}
          >
            <View
              style={[styles.corner, styles.topLeft]}
            />
            <View
              style={[styles.corner, styles.topRight]}
            />
            <View
              style={[styles.corner, styles.bottomLeft]}
            />
            <View
              style={[styles.corner, styles.bottomRight]}
            />
          </View>
        </View>

        <Text style={styles.hint}>
          Hold your phone steady and make sure the barcode
          is visible.
        </Text>

        <PrimaryButton
          title="Cancel scan"
          onPress={reset}
        />
      </ScrollView>
    );
  }

  // PRODUCT LOOKUP RESULTS
  if (loading || barcode || message) {
    return (
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.eyebrow}>
          PRODUCT LOOKUP
        </Text>

        <Text style={styles.title}>
          Scan results
        </Text>

        {barcode ? (
          <View style={styles.card}>
            <Text style={styles.detailLabel}>
              BARCODE
            </Text>

            <Text style={styles.barcodeText}>
              {barcode}
            </Text>
          </View>
        ) : null}

        <LocationCard title="Scan location" />

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator
              size="large"
              color={C.text}
            />

            <Text style={styles.description}>
              Retrieving product information...
            </Text>
          </View>
        ) : null}

        {product?.image_front_url ? (
          <Image
            source={{
              uri: product.image_front_url,
            }}
            style={styles.productImage}
            resizeMode="contain"
          />
        ) : null}

        {product ? (
          <View style={styles.card}>
            <Text style={styles.productName}>
              {product.product_name ||
                "Product name unavailable"}
            </Text>

            <Text style={styles.description}>
              Brand: {product.brands || "Not listed"}
            </Text>

            {product.quantity ? (
              <Text style={styles.detail}>
                Package size: {product.quantity}
              </Text>
            ) : null}

            {product.categories ? (
              <Text style={styles.detail}>
                Category: {product.categories}
              </Text>
            ) : null}
          </View>
        ) : null}

        {!loading && message ? (
          <InfoCard
            icon="information-circle-outline"
            title="Lookup information"
            text={message}
          />
        ) : null}

        <InfoCard
          icon="shield-checkmark-outline"
          title="Important"
          text="A barcode lookup cannot independently establish whether a physical product is genuine, tampered with, or counterfeit. Always inspect the packaging and verify suspicious products through the manufacturer."
        />

        <PrimaryButton
          title="Scan another product"
          onPress={openScanner}
          disabled={locationLoading}
        />

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={reset}
        >
          <Text style={styles.secondaryText}>
            Back
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // SCAN SCREEN
  if (screen === "scan") {
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
          Scan food product barcodes and retrieve available
          product information.
        </Text>

        <View style={styles.card}>
          <MaterialCommunityIcons
            name="barcode-scan"
            size={44}
            color={C.text}
          />

          <Text style={styles.cardTitle}>
            Camera scanner
          </Text>

          <Text style={styles.description}>
            Your current location will be detected before
            the scanner opens.
          </Text>

          {coordinates ? (
            <LocationCard title="Current location" />
          ) : null}

          {locationLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator
                size="small"
                color={C.text}
              />

              <Text style={styles.detail}>
                Detecting your location...
              </Text>
            </View>
          ) : null}

          <PrimaryButton
            title={
              locationLoading
                ? "Detecting location..."
                : "Detect location and scan"
            }
            onPress={openScanner}
            disabled={locationLoading}
          />
        </View>

        <InfoCard
          icon="information-circle-outline"
          title="Product identification"
          text="Product records may not exist for every barcode. A successful lookup is not proof of authenticity."
        />
      </ScrollView>
    );
  }

  // HISTORY SCREEN
  if (screen === "history") {
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
              Start scanning products to begin checking
              their available details.
            </Text>

            <PrimaryButton
              title="Scan a product"
              onPress={() => onNavigate("scan")}
            />
          </View>
        )}
      </ScrollView>
    );
  }

  // PROFILE SCREEN
  if (screen === "profile") {
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
          text="Identify products using available barcode records. Always inspect packaging and product details."
        />
      </ScrollView>
    );
  }

  // HOME SCREEN
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
        Scan food products and review available information
        before you buy.
      </Text>

      <View style={styles.hero}>
        <MaterialCommunityIcons
          name="barcode-scan"
          size={48}
          color={C.text}
        />

        <Text style={styles.heroTitle}>
          Know what you're checking.
        </Text>

        <Text style={styles.description}>
          Scan a barcode to retrieve the product name, brand
          and other available details. VERITY can also
          identify the location where you scan.
        </Text>

        <PrimaryButton
          title="Start scanning"
          onPress={() => onNavigate("scan")}
        />
      </View>

      <Text style={styles.sectionTitle}>
        How it works
      </Text>

      <InfoCard
        icon="scan-outline"
        title="01. Scan"
        text="Use your camera to capture the barcode."
      />

      <InfoCard
        icon="search-outline"
        title="02. Review"
        text="Compare available product details with the packaging."
      />

      <InfoCard
        icon="location-outline"
        title="03. Locate"
        text="Detect GPS coordinates and resolve them into a readable place name where available."
      />

      <InfoCard
        icon="shield-checkmark-outline"
        title="04. Check carefully"
        text="A barcode alone cannot confirm authenticity."
      />
    </ScrollView>
  );
}

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

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: C.text,
  },

  cameraContainer: {
    height: 340,
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "#111111",
  },

  scanFrame: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },

  corner: {
    position: "absolute",
    width: 42,
    height: 42,
    borderColor: "#FFFFFF",
  },

  topLeft: {
    top: "30%",
    left: "12%",
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },

  topRight: {
    top: "30%",
    right: "12%",
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },

  bottomLeft: {
    bottom: "30%",
    left: "12%",
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },

  bottomRight: {
    bottom: "30%",
    right: "12%",
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },

  hint: {
    textAlign: "center",
    fontSize: 13,
    lineHeight: 20,
    color: C.muted,
    marginVertical: 18,
  },

  card: {
    padding: 22,
    borderRadius: 22,
    backgroundColor: C.card,
    marginBottom: 18,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: C.text,
    marginTop: 16,
    marginBottom: 8,
  },

  hero: {
    padding: 22,
    borderRadius: 24,
    backgroundColor: C.card,
    marginTop: 10,
    marginBottom: 28,
  },

  heroTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: C.text,
    marginTop: 18,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: C.text,
    marginBottom: 14,
  },

  primaryButton: {
    minHeight: 52,
    borderRadius: 15,
    backgroundColor: C.text,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    marginTop: 8,
  },

  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  disabledButton: {
    opacity: 0.55,
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
    backgroundColor: "#FFFFFF",
    marginBottom: 18,
  },

  productName: {
    fontSize: 22,
    fontWeight: "800",
    color: C.text,
    marginBottom: 8,
  },

  detail: {
    fontSize: 13,
    lineHeight: 21,
    color: C.text,
    marginTop: 5,
  },

  detailLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: C.muted,
    marginBottom: 8,
  },

  barcodeText: {
    fontSize: 17,
    fontWeight: "700",
    color: C.text,
  },

  locationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: C.card,
    marginBottom: 18,
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
});
