
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  CameraView,
  useCameraPermissions,
  type BarcodeType,
} from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { C } from "./components";

type ScannerScreenProps = {
  onScan: (code: string) => void;
  onCancel: () => void;
};

const BARCODE_TYPES: BarcodeType[] = [
  "ean13",
  "ean8",
  "upc_a",
  "upc_e",
  "code128",
  "code39",
  "code93",
  "itf14",
  "qr",
  "pdf417",
  "aztec",
  "datamatrix",
];

export default function ScannerScreen({
  onScan,
  onCancel,
}: ScannerScreenProps) {
  const [permission, requestPermission] =
    useCameraPermissions();

  const [processingImage, setProcessingImage] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  const scanLock = useRef(false);

  const submitCode = (code: string) => {
    const cleanedCode = code?.trim();

    if (!cleanedCode || scanLock.current) {
      return;
    }

    scanLock.current = true;
    setHasScanned(true);
    onScan(cleanedCode);
  };

  const handleCameraScan = ({
    data,
  }: {
    data: string;
  }) => {
    submitCode(data);
  };

  const uploadCodeImage = async () => {
    if (processingImage || scanLock.current) {
      return;
    }

    try {
      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: false,
          quality: 1,
        });

      if (result.canceled || !result.assets?.[0]?.uri) {
        return;
      }

      setProcessingImage(true);

      const codes = await CameraView.scanFromURLAsync(
        result.assets[0].uri,
        BARCODE_TYPES
      );

      if (!codes || codes.length === 0) {
        Alert.alert(
          "No code detected",
          "We could not find a readable barcode or QR code in this image. Try a clearer, well-lit photo with the entire code visible."
        );
        return;
      }

      const detectedCode = codes[0]?.data;

      if (!detectedCode) {
        Alert.alert(
          "Unable to read code",
          "Please choose another image and try again."
        );
        return;
      }

      submitCode(detectedCode);
    } catch (error) {
      Alert.alert(
        "Image scanning failed",
        error instanceof Error
          ? error.message
          : "We could not scan this image. Please try another photo."
      );
    } finally {
      setProcessingImage(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.gold} />
        <Text style={styles.text}>
          Checking camera permission...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <View style={styles.permissionIcon}>
          <Ionicons
            name="camera-outline"
            size={38}
            color={C.gold}
          />
        </View>

        <Text style={styles.title}>
          Camera access needed
        </Text>

        <Text style={styles.text}>
          Allow camera access to scan product barcodes
          and QR codes. You can also select an existing
          image from your gallery.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={requestPermission}
          activeOpacity={0.85}
        >
          <Ionicons
            name="camera"
            size={19}
            color="#FFFFFF"
          />
          <Text style={styles.buttonText}>
            Allow camera access
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={uploadCodeImage}
          disabled={processingImage}
          activeOpacity={0.85}
        >
          {processingImage ? (
            <ActivityIndicator color={C.navy} />
          ) : (
            <Ionicons
              name="image-outline"
              size={20}
              color={C.navy}
            />
          )}

          <Text style={styles.secondaryButtonText}>
            {processingImage
              ? "Reading image..."
              : "Choose image from gallery"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: BARCODE_TYPES,
        }}
        onBarcodeScanned={
          hasScanned ? undefined : handleCameraScan
        }
      />

      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onCancel}
          activeOpacity={0.8}
        >
          <Ionicons
            name="close"
            size={25}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <View style={styles.heading}>
          <Text style={styles.headingTitle}>
            Scan a product
          </Text>

          <Text style={styles.instruction}>
            Place the product barcode or QR code
            inside the scanning frame.
          </Text>
        </View>

        <View style={styles.scanArea}>
          <View style={styles.scanFrame}>
            <View style={styles.cornerTopLeft} />
            <View style={styles.cornerTopRight} />
            <View style={styles.cornerBottomLeft} />
            <View style={styles.cornerBottomRight} />

            <View style={styles.scanLine} />
          </View>

          <Text style={styles.frameHint}>
            Align the complete code within the frame
          </Text>
        </View>

        <View style={styles.bottomPanel}>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={uploadCodeImage}
            disabled={processingImage}
            activeOpacity={0.85}
          >
            {processingImage ? (
              <ActivityIndicator color={C.navy} />
            ) : (
              <View style={styles.uploadIcon}>
                <Ionicons
                  name="image-outline"
                  size={23}
                  color={C.navy}
                />
              </View>
            )}

            <View style={styles.uploadTextContainer}>
              <Text style={styles.uploadTitle}>
                {processingImage
                  ? "Reading image..."
                  : "Choose from gallery"}
              </Text>

              <Text style={styles.uploadSubtitle}>
                Scan a barcode or QR code in a photo
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={C.muted}
            />
          </TouchableOpacity>

          <Text style={styles.footerText}>
            A readable code helps identify a product.
            It does not, by itself, prove authenticity.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },

  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  heading: {
    position: "absolute",
    top: 90,
    left: 24,
    right: 24,
    alignItems: "center",
  },

  headingTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 10,
    letterSpacing: -0.5,
  },

  instruction: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },

  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },

  scanArea: {
    alignItems: "center",
    justifyContent: "center",
  },

  scanFrame: {
    width: 285,
    height: 220,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },

  cornerTopLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 38,
    height: 38,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#FFFFFF",
    borderTopLeftRadius: 12,
  },

  cornerTopRight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 38,
    height: 38,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: "#FFFFFF",
    borderTopRightRadius: 12,
  },

  cornerBottomLeft: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 38,
    height: 38,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#FFFFFF",
    borderBottomLeftRadius: 12,
  },

  cornerBottomRight: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 38,
    height: 38,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: "#FFFFFF",
    borderBottomRightRadius: 12,
  },

  scanLine: {
    width: "82%",
    height: 2,
    backgroundColor: C.gold,
    opacity: 0.9,
  },

  frameHint: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 17,
    textAlign: "center",
  },

  bottomPanel: {
    position: "absolute",
    bottom: 26,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  uploadButton: {
    width: "100%",
    minHeight: 82,
    backgroundColor: C.background,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },

  uploadIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#EDE7D9",
    alignItems: "center",
    justifyContent: "center",
  },

  uploadTextContainer: {
    flex: 1,
  },

  uploadTitle: {
    color: C.navy,
    fontSize: 15,
    fontWeight: "800",
  },

  uploadSubtitle: {
    color: C.muted,
    fontSize: 12,
    marginTop: 5,
  },

  footerText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 15,
    paddingHorizontal: 10,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    backgroundColor: C.background,
    gap: 16,
  },

  permissionIcon: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: "#EDE7D9",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    color: C.navy,
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center",
  },

  text: {
    color: C.muted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },

  button: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 22,
    paddingVertical: 15,
    borderRadius: 13,
    backgroundColor: C.navy,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },

  secondaryButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.border,
  },

  secondaryButtonText: {
    color: C.navy,
    fontWeight: "700",
    fontSize: 14,
  },

  cancelText: {
    color: C.navy,
    padding: 12,
    fontWeight: "600",
  },
});
