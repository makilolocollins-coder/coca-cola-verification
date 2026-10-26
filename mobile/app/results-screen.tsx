import React from "react";
import {
View,
Text,
TouchableOpacity,
ScrollView,
StyleSheet,
ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "./components";

export type ProductInfo = {
name?: string;
brand?: string;
barcode?: string;
image?: string;
quantity?: string;
categories?: string;
};

type ResultsScreenProps = {
product: ProductInfo | null;
barcode: string;
loading: boolean;
message: string;
onScanAgain: () => void;
onVerify: () => void;
};

export default function ResultsScreen({
product,
barcode,
loading,
message,
onScanAgain,
onVerify,
}: ResultsScreenProps) {
return (
<ScrollView
style={styles.container}
contentContainerStyle={styles.content}
>
<View style={styles.header}>
<Text style={styles.eyebrow}>VERITY CHECK</Text>
<Text style={styles.title}>Product details</Text>
<Text style={styles.subtitle}>
Review the product information before verification.
</Text>
</View>

  <View style={styles.card}>
    <View style={styles.iconBox}>
      <Ionicons
        name="cube-outline"
        size={30}
        color={C.text}
      />
    </View>

    <Text style={styles.productName}>
      {product?.name || "Product not identified"}
    </Text>

    {product?.brand ? (
      <Text style={styles.brand}>{product.brand}</Text>
    ) : null}

    <View style={styles.divider} />

    <Text style={styles.label}>BARCODE / SCANNED CODE</Text>
    <Text style={styles.value}>
      {barcode || "No code available"}
    </Text>

    {product?.quantity ? (
      <>
        <Text style={styles.label}>PACKAGE SIZE</Text>
        <Text style={styles.value}>{product.quantity}</Text>
      </>
    ) : null}

    {product?.categories ? (
      <>
        <Text style={styles.label}>CATEGORY</Text>
        <Text style={styles.value}>{product.categories}</Text>
      </>
    ) : null}
  </View>

  {message ? (
    <View style={styles.messageBox}>
      <Text style={styles.message}>{message}</Text>
    </View>
  ) : null}

  <TouchableOpacity
    style={styles.primaryButton}
    onPress={onVerify}
    disabled={loading || !barcode}
  >
    {loading ? (
      <ActivityIndicator color={C.background} />
    ) : (
      <>
        <Ionicons
          name="shield-checkmark-outline"
          size={20}
          color={C.background}
        />
        <Text style={styles.primaryButtonText}>
          Verify product
        </Text>
      </>
    )}
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.secondaryButton}
    onPress={onScanAgain}
  >
    <Ionicons name="scan-outline" size={19} color={C.text} />
    <Text style={styles.secondaryButtonText}>
      Scan another product
    </Text>
  </TouchableOpacity>

  <Text style={styles.disclaimer}>
    Product information alone does not prove authenticity.
    Verification depends on the available verification data.
  </Text>
</ScrollView>

);
}

const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: C.background,
},
content: {
padding: 22,
paddingBottom: 40,
},
header: {
marginBottom: 24,
},
eyebrow: {
fontSize: 11,
fontWeight: "800",
letterSpacing: 2,
color: C.muted,
marginBottom: 10,
},
title: {
fontSize: 29,
fontWeight: "800",
color: C.text,
letterSpacing: -0.8,
},
subtitle: {
fontSize: 14,
lineHeight: 21,
color: C.muted,
marginTop: 8,
},
card: {
padding: 20,
borderRadius: 20,
backgroundColor: C.card,
borderWidth: 1,
borderColor: C.border,
},
iconBox: {
width: 58,
height: 58,
borderRadius: 16,
backgroundColor: C.background,
alignItems: "center",
justifyContent: "center",
marginBottom: 18,
},
productName: {
fontSize: 21,
fontWeight: "800",
color: C.text,
},
brand: {
fontSize: 14,
color: C.muted,
marginTop: 5,
},
divider: {
height: 1,
backgroundColor: C.border,
marginVertical: 20,
},
label: {
fontSize: 10,
fontWeight: "800",
letterSpacing: 1.2,
color: C.muted,
marginTop: 14,
marginBottom: 6,
},
value: {
fontSize: 14,
lineHeight: 21,
fontWeight: "600",
color: C.text,
},
messageBox: {
marginTop: 16,
padding: 14,
borderRadius: 12,
backgroundColor: C.card,
borderWidth: 1,
borderColor: C.border,
},
message: {
color: C.text,
fontSize: 13,
lineHeight: 20,
},
primaryButton: {
marginTop: 22,
minHeight: 54,
borderRadius: 15,
backgroundColor: C.text,
flexDirection: "row",
alignItems: "center",
justifyContent: "center",
gap: 10,
},
primaryButtonText: {
color: C.background,
fontSize: 15,
fontWeight: "800",
},
secondaryButton: {
marginTop: 12,
minHeight: 52,
borderRadius: 15,
borderWidth: 1,
borderColor: C.border,
flexDirection: "row",
alignItems: "center",
justifyContent: "center",
gap: 9,
},
secondaryButtonText: {
color: C.text,
fontSize: 14,
fontWeight: "700",
},
disclaimer: {
marginTop: 20,
fontSize: 12,
lineHeight: 18,
color: C.muted,
textAlign: "center",
},
});
