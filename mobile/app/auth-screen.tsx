
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from "react-native";

import { supabase } from "../supabase";
import { C } from "./components";

export default function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const forgotPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      Alert.alert(
        "Email required",
        "Enter your email address first."
      );
      return;
    }

    setLoading(true);

    try {
      const { error } =
        await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: "verity://reset-password",
        });

      if (error) throw error;

      Alert.alert(
        "Check your email",
        "If an account exists for this email, Supabase will send a password reset link."
      );
    } catch (error) {
      Alert.alert(
        "Password reset failed",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password.trim()) {
      Alert.alert(
        "Missing information",
        "Enter your email and password."
      );
      return;
    }

    if (mode === "signup" && !fullName.trim()) {
      Alert.alert("Name required", "Enter your full name.");
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        "Password too short",
        "Use at least 8 characters."
      );
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          Alert.alert(
            "Account created",
            "Your VERITY account is ready."
          );
        } else {
          Alert.alert(
            "Check your email",
            "Your account has been created. Confirm your email before signing in."
          );
          setMode("login");
        }
      } else {
        const { error } =
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

        if (error) throw error;
      }
    } catch (error) {
      Alert.alert(
        "Authentication failed",
        error instanceof Error
          ? error.message
          : "Please try again."
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
        <Text style={styles.tagline}>
          FOOD AUTHENTICATION PLATFORM
        </Text>

        <View style={styles.card}>
          <Text style={styles.heading}>
            {mode === "login"
              ? "Welcome back"
              : "Create your account"}
          </Text>

          <Text style={styles.description}>
            {mode === "login"
              ? "Sign in to continue to VERITY."
              : "Register to access the VERITY platform."}
          </Text>

          {mode === "signup" ? (
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor={C.muted}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              editable={!loading}
            />
          ) : null}

          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor={C.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password (minimum 8 characters)"
            placeholderTextColor={C.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={submit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={C.white} />
            ) : (
              <Text style={styles.buttonText}>
                {mode === "login"
                  ? "SIGN IN"
                  : "CREATE ACCOUNT"}
              </Text>
            )}
          </TouchableOpacity>

          {mode === "login" ? (
            <TouchableOpacity
              style={styles.switchButton}
              onPress={forgotPassword}
              disabled={loading}
            >
              <Text style={styles.switchText}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() =>
              setMode(mode === "login" ? "signup" : "login")
            }
            disabled={loading}
          >
            <Text style={styles.switchText}>
              {mode === "login"
                ? "New to VERITY? Create an account"
                : "Already registered? Sign in"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Secure access for consumers, manufacturers and delivery teams.
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
    fontSize: 24,
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
  switchButton: {
    alignItems: "center",
    paddingTop: 21,
    paddingBottom: 5,
  },
  switchText: {
    color: "#947B50",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
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
