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
import ResultsScreen, {
ProductInfo,
} from "./results-screen";
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

export default function Screens({
screen,
records,
onNavigate,
onVerify,
}: Props) {
const [scannerOpen, setScannerOpen] = useState(false);
const [loading, setLoading] = useState(false);
const [locationLoading, setLocationLoading] = useState(false);
const [verifying, setVerifying] = useState(false);

const [product, setProduct] = useState<Product | null>(null);
const [barcode, setBarcode] = useState("");
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
setMessage("");
setVerificationMessage("");
};

const openScanner = async () => {
reset();
setLocationLoading(true);

try {
  const location = await detectLocation();
  setScanLocation(location);
  setScannerOpen(true);
} catch (error) {
  Alert.alert(
    "Location unavailable",
    error instanceof Error
      ? error.message
      : "Could not retrieve your location. Check your GPS settings and try again."
  );
} finally {
  setLocationLoading(false);
}

};

const lookupProduct = async (code: string) => {
if (!code.trim() || loading) return;

setBarcode(code.trim());
setScannerOpen(false);
setLoading(true);
setProduct(null);
setMessage("");
setVerificationMessage("");

try {
  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
      code.trim()
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

const handleVerify = async () => {
if (!barcode || !scanLocation) {
Alert.alert(
"Missing information",
"Scan a product and obtain its location before attempting verification."
);
return;
}

setVerifying(true);
setVerificationMessage("");

try {
  const result = await verifyBottle({
    barcode,
    serial_number: "",
    qr_token: "",
    latitude: scanLocation.latitude,
    longitude: scanLocation.longitude,
    town: scanLocation.placeName,
    region: "",
    country: "",
    scan_place: scanLocation.locationText,
  });

  setVerificationMessage(
    typeof result.note === "string"
      ? result.note
      : typeof result.message === "string"
        ? result.message
        : JSON.stringify(result)
  );

  onVerify(barcode);
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
color={C.text}
/>
<View style={{ flex: 1 }}>
<Text style={styles.locationTitle}>
Scan location
</Text>
<Text style={styles.locationPlace}>
{scanLocation?.placeName || "Location unavailable"}
</Text>
<Text style={styles.locationDetails}>
{scanLocation
? scanLocation.locationText
: "Coordinates unavailable"}
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

// PRODUCT RESULTS
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
  >
    {locationCard()}

    {loading ? (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={C.text} />
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

    {verifying ? (
      <ActivityIndicator
        style={{ marginTop: 16 }}
        size="small"
        color={C.text}
      />
    ) : null}

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
      <Text style={styles.secondaryText}>Back</Text>
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
<Text style={styles.title}>Scan a product.</Text>
<Text style={styles.description}>
Scan a food product barcode to retrieve available
information and associate the scan with its location.
</Text>

    <View style={styles.card}>
      <MaterialCommunityIcons
        name="barcode-scan"
        size={44}
        color={C.text}
      />
      <Text style={styles.cardTitle}>Camera scanner</Text>

      {scanLocation ? locationCard() : null}

      {locationLoading ? (
        <ActivityIndicator
          style={{ margin: 18 }}
          size="small"
          color={C.text}
        />
      ) : null}

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={openScanner}
        disabled={locationLoading}
      >
        <Text style={styles.primaryButtonText}>
          {locationLoading
            ? "Detecting location..."
            : "Detect location and scan"}
        </Text>
      </TouchableOpacity>
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
<Text style={styles.eyebrow}>YOUR ACTIVITY</Text>
<Text style={styles.title}>Scan history</Text>

    {records.length > 0 ? (
      records.map((record, index) => (
        <ScanRow key={index} record={record} />
      ))
    ) : (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>No scans yet</Text>
        <Text style={styles.description}>
          Start scanning products to review their available details.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => onNavigate("scan")}
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
if (screen === "profile") {
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

// HOME SCREEN
return (
<ScrollView
style={styles.page}
contentContainerStyle={styles.content}
>
<Text style={styles.eyebrow}>
VERITY / PRODUCT INTELLIGENCE
</Text>
<Text style={styles.title}>Look closer.</Text>
<Text style={styles.description}>
Scan food products and review available information before you buy.
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
      Scan a barcode, review product details, and associate the scan
      with a location.
    </Text>
    <TouchableOpacity
      style={styles.primaryButton}
      onPress={() => onNavigate("scan")}
    >
      <Text style={styles.primaryButtonText}>
        Start scanning
      </Text>
    </TouchableOpacity>
  </View>

  <Text style={styles.sectionTitle}>How it works</Text>

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
    text="Record GPS coordinates and a readable location where available."
  />
  <InfoCard
    icon="shield-checkmark-outline"
    title="04. Verify carefully"
    text="A barcode lookup alone cannot confirm authenticity."
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
card: {
padding: 22,
borderRadius: 22,
backgroundColor: C.card,
marginBottom: 18,
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
backgroundColor: C.text,
alignItems: "center",
justifyContent: "center",
paddingHorizontal: 18,
marginTop: 8,
},
primaryButtonText: {
fontSize: 14,
fontWeight: "700",
color: C.background,
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
verificationCard: {
padding: 18,
borderRadius: 18,
backgroundColor: C.card,
marginTop: 18,
},
});
