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
} from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { C } from "./components";

type ScannerScreenProps = {
onScan: (code: string) => void;
onCancel: () => void;
};

const BARCODE_TYPES = [
"ean13",
"ean8",
"upc_a",
"upc_e",
"code128",
"qr",
] as const;

export default function ScannerScreen({
onScan,
onCancel,
}: ScannerScreenProps) {
const [permission, requestPermission] =
useCameraPermissions();

const [processingImage, setProcessingImage] = useState(false);
const [hasScanned, setHasScanned] = useState(false);
const scanLock = useRef(false);

const handleCameraScan = ({ data }: { data: string }) => {
if (scanLock.current || !data) return;

scanLock.current = true;
setHasScanned(true);
onScan(data);

};

const uploadQrImage = async () => {
try {
const result = await ImagePicker.launchImageLibraryAsync({
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
    ["qr"]
  );

  if (!codes || codes.length === 0) {
    Alert.alert(
      "QR code not found",
      "No readable QR code was found in that image. Choose a clearer image or scan the code with your camera."
    );
    return;
  }

  const qrData = codes[0]?.data;

  if (!qrData) {
    Alert.alert(
      "Unable to read QR code",
      "Please choose another image and try again."
    );
    return;
  }

  scanLock.current = true;
  setHasScanned(true);
  onScan(qrData);
} catch (error) {
  Alert.alert(
    "Image scanning failed",
    error instanceof Error
      ? error.message
      : "Could not read the QR code from this image."
  );
} finally {
  setProcessingImage(false);
}

};

if (!permission) {
return (
<View style={styles.center}>
<ActivityIndicator size="large" color={C.text} />
<Text style={styles.text}>
Checking camera permission...
</Text>
</View>
);
}

if (!permission.granted) {
return (
<View style={styles.center}>
<Ionicons
name="camera-outline"
size={42}
color={C.text}
/>

    <Text style={styles.title}>
      Camera permission required
    </Text>

    <Text style={styles.text}>
      Allow camera access to scan product barcodes and QR codes.
      You can also upload a QR-code image.
    </Text>

    <TouchableOpacity
      style={styles.button}
      onPress={requestPermission}
    >
      <Text style={styles.buttonText}>
        Allow camera
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.secondaryButton}
      onPress={uploadQrImage}
    >
      <Ionicons
        name="image-outline"
        size={19}
        color={C.text}
      />
      <Text style={styles.secondaryButtonText}>
        Upload QR image
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
barcodeTypes: [...BARCODE_TYPES],
}}
onBarcodeScanned={
hasScanned ? undefined : handleCameraScan
}
/>

  <View style={styles.overlay}>
    <TouchableOpacity
      style={styles.closeButton}
      onPress={onCancel}
    >
      <Ionicons
        name="close"
        size={26}
        color="#FFFFFF"
      />
    </TouchableOpacity>

    <View style={styles.heading}>
      <Text style={styles.headingTitle}>
        Scan a product
      </Text>

      <Text style={styles.instruction}>
        Position the barcode or QR code inside the frame.
      </Text>
    </View>

    <View style={styles.scanFrame}>
      <View style={styles.cornerTopLeft} />
      <View style={styles.cornerTopRight} />
      <View style={styles.cornerBottomLeft} />
      <View style={styles.cornerBottomRight} />
    </View>

    <View style={styles.bottomPanel}>
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={uploadQrImage}
        disabled={processingImage}
      >
        {processingImage ? (
          <ActivityIndicator color={C.text} />
        ) : (
          <Ionicons
            name="image-outline"
            size={22}
            color={C.text}
          />
        )}

        <Text style={styles.uploadTitle}>
          {processingImage
            ? "Reading image..."
            : "Upload QR image"}
        </Text>

        <Text style={styles.uploadSubtitle}>
          Choose a photo from your gallery
        </Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        Reading a code identifies its contents; it does not
        by itself prove a product is genuine.
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
top: 95,
left: 24,
right: 24,
alignItems: "center",
},
headingTitle: {
color: "#FFFFFF",
fontSize: 25,
fontWeight: "800",
marginBottom: 10,
},
closeButton: {
position: "absolute",
top: 45,
right: 22,
width: 44,
height: 44,
borderRadius: 22,
backgroundColor: "rgba(0,0,0,0.6)",
alignItems: "center",
justifyContent: "center",
zIndex: 2,
},
scanFrame: {
width: 270,
height: 210,
position: "relative",
},
cornerTopLeft: {
position: "absolute",
top: 0,
left: 0,
width: 36,
height: 36,
borderTopWidth: 4,
borderLeftWidth: 4,
borderColor: "#FFFFFF",
borderTopLeftRadius: 12,
},
cornerTopRight: {
position: "absolute",
top: 0,
right: 0,
width: 36,
height: 36,
borderTopWidth: 4,
borderRightWidth: 4,
borderColor: "#FFFFFF",
borderTopRightRadius: 12,
},
cornerBottomLeft: {
position: "absolute",
bottom: 0,
left: 0,
width: 36,
height: 36,
borderBottomWidth: 4,
borderLeftWidth: 4,
borderColor: "#FFFFFF",
borderBottomLeftRadius: 12,
},
cornerBottomRight: {
position: "absolute",
bottom: 0,
right: 0,
width: 36,
height: 36,
borderBottomWidth: 4,
borderRightWidth: 4,
borderColor: "#FFFFFF",
borderBottomRightRadius: 12,
},
bottomPanel: {
position: "absolute",
bottom: 24,
left: 0,
right: 0,
alignItems: "center",
},
instruction: {
color: "#FFFFFF",
fontSize: 14,
lineHeight: 21,
textAlign: "center",
},
uploadButton: {
width: "100%",
backgroundColor: C.background,
borderRadius: 18,
padding: 18,
alignItems: "center",
gap: 8,
},
uploadTitle: {
color: C.text,
fontSize: 15,
fontWeight: "800",
},
uploadSubtitle: {
color: C.muted,
fontSize: 12,
},
footerText: {
color: "#FFFFFF",
fontSize: 11,
lineHeight: 17,
textAlign: "center",
marginTop: 14,
paddingHorizontal: 10,
},
center: {
flex: 1,
alignItems: "center",
justifyContent: "center",
padding: 28,
backgroundColor: C.background,
gap: 14,
},
title: {
color: C.text,
fontSize: 20,
fontWeight: "700",
textAlign: "center",
},
text: {
color: C.muted,
fontSize: 14,
textAlign: "center",
lineHeight: 21,
},
button: {
paddingHorizontal: 22,
paddingVertical: 13,
borderRadius: 12,
backgroundColor: C.text,
},
buttonText: {
color: C.background,
fontWeight: "700",
},
secondaryButton: {
flexDirection: "row",
alignItems: "center",
justifyContent: "center",
gap: 9,
paddingHorizontal: 18,
paddingVertical: 13,
borderRadius: 12,
borderWidth: 1,
borderColor: C.border,
},
secondaryButtonText: {
color: C.text,
fontWeight: "700",
},
cancelText: {
color: C.text,
padding: 12,
},
});
