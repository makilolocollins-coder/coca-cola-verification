
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.brand}>VERIFY</Text>
        <Text style={styles.subtitle}>Product Authentication</Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Know what you buy.</Text>
        <Text style={styles.heroText}>
          Scan a product to check its registration and verification status.
        </Text>

        <Pressable style={styles.scanButton}>
          <Text style={styles.scanButtonText}>▣  Scan a Product</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Verification tools</Text>

      <View style={styles.toolCard}>
        <Text style={styles.toolTitle}>▦  Barcode Scanner</Text>
        <Text style={styles.toolText}>
          Identify a product using its barcode.
        </Text>
      </View>

      <View style={styles.toolCard}>
        <Text style={styles.toolTitle}>◉  QR & Serial Verification</Text>
        <Text style={styles.toolText}>
          Check a product's QR code and serial number.
        </Text>
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Stay informed</Text>
        <Text style={styles.toolText}>
          A verification result is based on available records and does not
          alone guarantee that a physical product is genuine.
        </Text>
      </View>

      <Text style={styles.footer}>Product Verification Platform</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 55,
    paddingHorizontal: 22,
    paddingBottom: 20,
  },
  brand: {
    color: '#C62828',
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: 2,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 5,
  },
  hero: {
    backgroundColor: '#142D4E',
    margin: 18,
    padding: 23,
    borderRadius: 20,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
  },
  heroText: {
    color: '#D7E3F2',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 10,
  },
  scanButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginTop: 22,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#142D4E',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#172B4D',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  toolCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 18,
    marginBottom: 12,
    padding: 18,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5EAF1',
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#172B4D',
  },
  toolText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#64748B',
    marginTop: 8,
  },
  notice: {
    backgroundColor: '#E8F1FF',
    margin: 18,
    padding: 17,
    borderRadius: 14,
  },
  noticeTitle: {
    color: '#174A87',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    textAlign: 'center',
    color: '#94A3B8',
    marginTop: 5,
    marginBottom: 30,
    fontSize: 12,
  },
});
