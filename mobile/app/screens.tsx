import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  C,
  photos,
  categories,
  ScanRecord,
  ScreenName,
  ActionCard,
  ScanRow,
  ScreenHeader,
  InfoCard,
  Heading,
  styles,
} from "./components";

type Props = {
  screen: ScreenName;
  scans: ScanRecord[];
  goTo: (screen: ScreenName) => void;
  onVerify: (code: string) => void;
};

const registryProducts = [
  {
    name: "Minute Maid Orange Juice",
    brand: "Minute Maid",
    category: "Beverages",
    image: photos.juice,
  },
  {
    name: "Royal Stallion Parboiled Rice",
    brand: "Royal Stallion",
    category: "Grains & Staples",
    image: photos.rice,
  },
  {
    name: "Packaged Cooking Oil",
    brand: "Sample catalogue entry",
    category: "Oils & Sauces",
    image: photos.oils,
  },
  {
    name: "Packaged Snack",
    brand: "Sample catalogue entry",
    category: "Snacks & Packaged",
    image: photos.snacks,
  },
];

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={formStyles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8A8E8C"
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={[formStyles.input, multiline && formStyles.multiline]}
      />
    </View>
  );
}

function PrimaryButton({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={formStyles.primaryButton}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <Text style={formStyles.primaryButtonText}>{title}</Text>
      <Ionicons name="arrow-forward" size={18} color={C.navy} />
    </TouchableOpacity>
  );
}

export default function AppScreen({
  screen,
  scans,
  goTo,
  onVerify,
}: Props) {
  const [code, setCode] = useState("");
  const [search, setSearch] = useState("");
  const [reportType, setReportType] = useState("Suspected counterfeit");
  const [reportProduct, setReportProduct] = useState("");
  const [reportBatch, setReportBatch] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyMessage, setCompanyMessage] = useState("");

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return registryProducts;
    return registryProducts.filter((p) =>
      `${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(q)
    );
  }, [search]);

  if (screen === "Verify") {
    return (
      <View>
        <ScreenHeader
          eyebrow="PRODUCT AUTHENTICATION"
          title="Verify a product."
          description="Enter a product, serial or batch code. A real authenticity decision requires a trusted registry response."
        />

        <View style={formStyles.panel}>
          <View style={formStyles.panelIcon}>
            <MaterialCommunityIcons
              name="shield-search-outline"
              size={32}
              color={C.goldLight}
            />
          </View>
          <Text style={formStyles.panelTitle}>Identify your product</Text>
          <Text style={formStyles.panelText}>
            Camera scanning and live backend verification will be connected in a later step.
          </Text>
          <Field
            label="BARCODE / SERIAL / BATCH CODE"
            value={code}
            onChangeText={setCode}
            placeholder="Enter the code printed on packaging"
          />
          <PrimaryButton
            title="Check code"
            onPress={() => {
              if (!code.trim()) {
                Alert.alert("Code required", "Enter a product code first.");
                return;
              }
              onVerify(code.trim());
            }}
          />
        </View>

        <Text style={formStyles.sectionLabel}>OTHER WAYS TO IDENTIFY</Text>
        <ActionCard
          icon="barcode"
          title="Scan barcode"
          subtitle="Use the phone camera"
          onPress={() =>
            Alert.alert(
              "Barcode scanner",
              "Camera scanning is not connected yet."
            )
          }
        />
        <ActionCard
          icon="qrcode-scan"
          title="Scan QR code"
          subtitle="Read the product's QR code"
          onPress={() =>
            Alert.alert("QR scanner", "QR verification is not connected yet.")
          }
        />
        <ActionCard
          icon="camera-outline"
          title="Photo check"
          subtitle="Inspect a product label or packaging"
          onPress={() =>
            Alert.alert(
              "Photo check",
              "Photo capture and image analysis are not connected yet."
            )
          }
        />
        <InfoCard
          icon="shield-alert-outline"
          title="A code is not proof of authenticity"
          text="Counterfeit products can copy legitimate barcodes. VERITY must check trusted product and batch records before giving an authenticity result."
        />
      </View>
    );
  }

  if (screen === "History") {
    return (
      <View>
        <ScreenHeader
          eyebrow="YOUR ACTIVITY"
          title="Scan history."
          description="Review product checks recorded on this device. Live account history will require database integration."
        />
        <View style={formStyles.darkList}>
          {scans.map((item) => (
            <ScanRow
              key={item.id}
              item={item}
              onPress={() =>
                Alert.alert(
                  item.name,
                  `${item.status}\n\n${
                    item.status === "VERIFIED"
                      ? "This is demonstration data, not a live authenticity decision."
                      : "This record is illustrative. It is not a confirmed counterfeit finding."
                  }`
                )
              }
            />
          ))}
        </View>
        <InfoCard
          icon="database-outline"
          title="Sample history"
          text="These entries are currently demonstration records. They will be replaced with real scan history after Supabase access and user authentication are configured."
        />
      </View>
    );
  }

  if (screen === "Report") {
    return (
      <View>
        <ScreenHeader
          eyebrow="CONSUMER REPORTS"
          title="Report a product."
          description="Help flag products that may require investigation. A report is an allegation, not proof of counterfeiting."
        />
        <View style={formStyles.panel}>
          <Text style={formStyles.label}>TYPE OF REPORT</Text>
          {[
            "Suspected counterfeit",
            "Misleading label",
            "Damaged packaging",
            "Expired product",
            "Other concern",
          ].map((type) => (
            <TouchableOpacity
              key={type}
              style={formStyles.choiceRow}
              onPress={() => setReportType(type)}
            >
              <Ionicons
                name={
                  reportType === type
                    ? "radio-button-on"
                    : "radio-button-off"
                }
                size={20}
                color={reportType === type ? C.gold : C.muted}
              />
              <Text style={formStyles.choiceText}>{type}</Text>
            </TouchableOpacity>
          ))}

          <Field
            label="PRODUCT NAME OR BRAND"
            value={reportProduct}
            onChangeText={setReportProduct}
            placeholder="Enter product name"
          />
          <Field
            label="BATCH / LOT NUMBER (OPTIONAL)"
            value={reportBatch}
            onChangeText={setReportBatch}
            placeholder="Enter batch number if available"
          />
          <Field
            label="WHAT DID YOU NOTICE?"
            value={reportDetails}
            onChangeText={setReportDetails}
            placeholder="Describe the packaging, label or other concern"
            multiline
          />

          <TouchableOpacity
            style={formStyles.secondaryButton}
            onPress={() =>
              Alert.alert(
                "Photo attachment",
                "Photo upload will be enabled when the reporting backend is connected."
              )
            }
          >
            <Ionicons name="camera-outline" size={20} color={C.ink} />
            <Text style={formStyles.secondaryButtonText}>
              Attach product photos
            </Text>
          </TouchableOpacity>

          <PrimaryButton
            title="Review report"
            onPress={() => {
              if (!reportProduct.trim() || !reportDetails.trim()) {
                Alert.alert(
                  "More information needed",
                  "Enter the product name and describe your concern."
                );
                return;
              }
              Alert.alert(
                "Report draft prepared",
                `Type: ${reportType}\nProduct: ${reportProduct.trim()}\nBatch: ${
                  reportBatch.trim() || "Not provided"
                }\n\nThis is only a local draft. It has not been submitted or saved.`,
                [{ text: "OK" }]
              );
            }}
          />
        </View>
      </View>
    );
  }

  if (screen === "Registry") {
    return (
      <View>
        <ScreenHeader
          eyebrow="TRUSTED PRODUCT CATALOGUE"
          title="Product registry."
          description="Search the catalogue for product information. The entries shown here are examples, not confirmed registrations."
        />
        <View style={formStyles.searchBox}>
          <Ionicons name="search-outline" size={20} color={C.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search products, brands or categories"
            placeholderTextColor={C.muted}
            style={formStyles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={19} color={C.muted} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 18 }}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.name}
              style={formStyles.categoryPill}
              onPress={() => setSearch(cat.name)}
            >
              <Text style={formStyles.categoryPillText}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filteredProducts.map((product) => (
          <TouchableOpacity
            key={product.name}
            style={formStyles.productCard}
            onPress={() =>
              Alert.alert(
                product.name,
                `Brand: ${product.brand}\nCategory: ${product.category}\n\nThis is a demonstration catalogue entry. Its registration has not been confirmed.`
              )
            }
          >
            <Image source={{ uri: product.image }} style={formStyles.productImage} />
            <View style={{ flex: 1 }}>
              <Text style={formStyles.productName}>{product.name}</Text>
              <Text style={formStyles.productMeta}>{product.brand}</Text>
              <Text style={formStyles.productCategory}>{product.category}</Text>
            </View>
            <Ionicons name="chevron-forward" size={19} color={C.muted} />
          </TouchableOpacity>
        ))}

        {filteredProducts.length === 0 && (
          <View style={formStyles.emptyState}>
            <Ionicons name="search-outline" size={30} color={C.muted} />
            <Text style={formStyles.emptyTitle}>No matching examples</Text>
            <Text style={formStyles.emptyText}>
              Try another name or category. A live registry search has not yet been connected.
            </Text>
          </View>
        )}
      </View>
    );
  }

  if (screen === "Company") {
    return (
      <View>
        <ScreenHeader
          eyebrow="VERITY BUSINESS"
          title="Company portal."
          description="A secure workspace for approved food and FMCG manufacturers, distributors and brand owners."
        />
        <View style={formStyles.panel}>
          <View style={formStyles.panelIcon}>
            <MaterialCommunityIcons
              name="domain"
              size={32}
              color={C.goldLight}
            />
          </View>
          <Text style={formStyles.panelTitle}>Authorized company access</Text>
          <Text style={formStyles.panelText}>
            Company accounts are created by VERITY administrators. Companies cannot approve their own registrations.
          </Text>
          <Field
            label="WORK EMAIL"
            value={companyEmail}
            onChangeText={setCompanyEmail}
            placeholder="name@company.com"
          />
          <Field
            label="ACCESS REQUEST / MESSAGE (OPTIONAL)"
            value={companyMessage}
            onChangeText={setCompanyMessage}
            placeholder="Company name and reason for access"
            multiline
          />
          <PrimaryButton
            title="Continue"
            onPress={() => {
              Alert.alert(
                "Company access",
                companyEmail.trim()
                  ? "Company login is not connected yet. No account has been created. VERITY administrators will create authorized accounts."
                  : "Enter your work email. Company login and access requests are not connected yet."
              );
            }}
          />
        </View>

        <Text style={formStyles.sectionLabel}>COMPANY WORKSPACE WILL INCLUDE</Text>
        <ActionCard
          icon="package-variant"
          title="Product and batch management"
          subtitle="Maintain approved product records"
          onPress={() =>
            Alert.alert("Company workspace", "Available after secure sign-in is implemented.")
          }
        />
        <ActionCard
          icon="file-document-check-outline"
          title="Product registration"
          subtitle="Submit product details for VERITY review"
          onPress={() =>
            Alert.alert("Product registration", "Product submission is not connected yet.")
          }
        />
        <ActionCard
          icon="alert-circle-outline"
          title="Consumer reports"
          subtitle="Review reports assigned to your company"
          onPress={() =>
            Alert.alert("Consumer reports", "Company-specific report access is not connected yet.")
          }
        />
        <InfoCard
          icon="lock-check-outline"
          title="Access is controlled by VERITY"
          text="Company accounts, roles and permissions must be enforced through authenticated backend access and database policies."
        />
      </View>
    );
  }

  if (screen === "Alerts") {
    return (
      <View>
        <ScreenHeader
          eyebrow="STAY INFORMED"
          title="Your alerts."
          description="Notifications about your product checks and reports will appear here once live alerts are connected."
        />
        <View style={formStyles.emptyState}>
          <MaterialCommunityIcons
            name="bell-outline"
            size={36}
            color={C.gold}
          />
          <Text style={formStyles.emptyTitle}>No live alerts yet</Text>
          <Text style={formStyles.emptyText}>
            The old sample alert has been removed so demonstration content is not mistaken for a real fraud report.
          </Text>
        </View>
      </View>
    );
  }

  if (screen === "Profile") {
    return (
      <View>
        <ScreenHeader
          eyebrow="YOUR VERITY ACCOUNT"
          title="Your profile."
          description="Account settings will become available after authentication is implemented."
        />
        <View style={formStyles.panel}>
          <View style={formStyles.panelIcon}>
            <Ionicons name="person-outline" size={32} color={C.goldLight} />
          </View>
          {[
            ["Account details", "person-circle-outline"],
            ["Scan preferences", "options-outline"],
            ["Privacy and security", "lock-closed-outline"],
            ["About VERITY", "information-circle-outline"],
          ].map(([label, icon]) => (
            <TouchableOpacity
              key={label}
              style={formStyles.settingRow}
              onPress={() =>
                Alert.alert(label, "This setting will be available after account functionality is connected.")
              }
            >
              <Ionicons name={icon as any} size={21} color={C.ink} />
              <Text style={formStyles.settingText}>{label}</Text>
              <Ionicons name="chevron-forward" size={18} color={C.muted} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View>
      <ScreenHeader
        eyebrow="VERITY"
        title="Welcome."
        description="Choose a section from the home screen."
      />
      <PrimaryButton title="Return home" onPress={() => goTo("Home")} />
    </View>
  );
}

const formStyles = {
  panel: {
    backgroundColor: C.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.line,
    padding: 18,
    marginBottom: 20,
  },
  panelIcon: {
    width: 58,
    height: 58,
    borderRadius: 17,
    backgroundColor: C.navy,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 15,
  },
  panelTitle: {
    color: C.ink,
    fontSize: 18,
    fontWeight: "700" as const,
    marginBottom: 8,
  },
  panelText: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
    marginBottom: 20,
  },
  label: {
    color: C.ink,
    fontSize: 10,
    fontWeight: "800" as const,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    minHeight: 49,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 13,
    color: C.ink,
    fontSize: 13,
    backgroundColor: "#FEFDFC",
  },
  multiline: {
    minHeight: 100,
    paddingTop: 13,
  },
  primaryButton: {
    minHeight: 49,
    borderRadius: 12,
    backgroundColor: C.goldLight,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 10,
    paddingHorizontal: 15,
    marginTop: 4,
  },
  primaryButtonText: {
    color: C.navy,
    fontSize: 13,
    fontWeight: "800" as const,
  },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 1.1,
    fontWeight: "800" as const,
    color: C.muted,
    marginTop: 12,
    marginBottom: 12,
  },
  choiceRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    paddingVertical: 10,
  },
  choiceText: { color: C.ink, fontSize: 13 },
  secondaryButton: {
    minHeight: 47,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 9,
    marginBottom: 14,
  },
  secondaryButtonText: { color: C.ink, fontSize: 12, fontWeight: "700" as const },
  darkList: {
    backgroundColor: C.navy,
    borderRadius: 17,
    overflow: "hidden" as const,
  },
  searchBox: {
    minHeight: 49,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 9,
    paddingHorizontal: 13,
    backgroundColor: C.white,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.line,
    marginBottom: 16,
  },
  searchInput: { flex: 1, color: C.ink, fontSize: 12, paddingVertical: 11 },
  categoryPill: {
    backgroundColor: C.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 13,
    paddingVertical: 9,
    alignSelf: "flex-start" as const,
  },
  categoryPillText: { fontSize: 10, fontWeight: "700" as const, color: C.ink },
  productCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: C.white,
    borderRadius: 15,
    padding: 11,
    gap: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.line,
  },
  productImage: {
    width: 65,
    height: 70,
    borderRadius: 10,
    backgroundColor: C.bg,
  },
  productName: { color: C.ink, fontSize: 12, fontWeight: "700" as const },
  productMeta: { color: C.muted, fontSize: 10, marginTop: 4 },
  productCategory: { color: "#99845D", fontSize: 10, marginTop: 5 },
  emptyState: {
    alignItems: "center" as const,
    padding: 28,
    backgroundColor: C.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: C.line,
  },
  emptyTitle: { color: C.ink, fontSize: 15, fontWeight: "700" as const, marginTop: 12 },
  emptyText: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center" as const,
    marginTop: 8,
  },
  settingRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  settingText: { flex: 1, color: C.ink, fontSize: 13 },
};
