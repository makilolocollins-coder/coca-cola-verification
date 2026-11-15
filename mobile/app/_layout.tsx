
import React, { useEffect, useState } from "react";
import {
  AppState,
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
} from "react-native";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Session } from "@supabase/supabase-js";

import { supabase } from "../supabase";
import AuthScreen from "./auth-screen";
import { AuthProvider } from "../auth-context";

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setCheckingSession(false);
    });

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error("Session check failed:", error.message);
        }

        setSession(data.session);
      })
      .catch((error) => {
        console.error("Session restoration failed:", error);
        setSession(null);
      })
      .finally(() => {
        setCheckingSession(false);
      });

    if (AppState.currentState === "active") {
      supabase.auth.startAutoRefresh();
    }

    const appStateSubscription = AppState.addEventListener(
      "change",
      (state) => {
        if (state === "active") {
          supabase.auth.startAutoRefresh();
        } else {
          supabase.auth.stopAutoRefresh();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      appStateSubscription.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  if (checkingSession) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#C5A66D" />
        <Text style={styles.loadingText}>Loading VERITY...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <>
        <StatusBar style="dark" />
        <AuthScreen />
      </>
    );
  }

  return (
    <AuthProvider session={session}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#F7F5F0" },
        }}
      />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#F7F5F0",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#0D1920",
    fontSize: 12,
    marginTop: 14,
  },
});
