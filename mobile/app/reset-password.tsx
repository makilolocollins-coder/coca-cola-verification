
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { supabase } from "../supabase";
import { C } from "./components";

export default function ResetPasswordScreen() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const updatePassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert("Missing information", "Enter and confirm your new password.");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Password too short", "Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match", "Enter the same password in both fields.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      Alert.alert(
        "Password updated",
        "Your password has been changed successfully.",
        [
          {
            text: "Continue",
            onPress: () => router.replace("/"),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Password update failed",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        <View style={styles.logo}>
          <Text style={styles.logoMark}>V</Text>
        </View>

        <Text style={styles.brand}>VERITY</Text>
        <Text style={styles.tagline}>PASSWORD RECOVERY</Text>

        <View style={styles.card}>
          <Text style={styles.heading}>Create a new password</Text>

          <Text style={styles.description}>
            Enter a new password for your VERITY account.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="New password"
            placeholderTextColor={C.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            placeholderTextColor={C.muted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={updatePassword}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={C.white} />
            ) : (
              <Text style={styles.buttonText}>UPDATE PASSWORD</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Keep your account secure. Do not share your password with anyone.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 25,
    alignItems: "center",
  },
  logo: {
    width: 66,
    height: 66,
    borderRadius: 20,
    backgroundColor: C.navy,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },
  logoMark: {
    color: C.goldLight,
    fontSize: 37,
    fontWeight: "700",
    fontFamily: "Georgia",
  },
  brand: {
    color: C.navy,
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: 4,
  },
  tagline: {
    color: C.muted,
    fontSize: 9,
    letterSpacing: 2,
    marginTop: 5,
    marginBottom: 32,
  },
  card: {
    width: "100%",
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: C.line,
  },
  heading: {
    color: C.navy,
    fontSize: 23,
    fontWeight: "700",
    fontFamily: "Georgia",
  },
  description: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
    marginBottom: 22,
  },
  input: {
    height: 53,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 11,
    paddingHorizontal: 14,
    color: C.navy,
    fontSize: 13,
    marginBottom: 13,
    backgroundColor: C.bg,
  },
  button: {
    height: 53,
    backgroundColor: C.navy,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 7,
  },
  buttonText: {
    color: C.white,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  footer: {
    color: C.muted,
    fontSize: 10,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 25,
    paddingHorizontal: 15,
  },
});
