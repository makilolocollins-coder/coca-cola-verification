
import React, { useEffect, useState } from "react";
import {
  AppState,
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  Linking,
} from "react-native";

import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Session } from "@supabase/supabase-js";

import { supabase } from "../supabase";
import AuthScreen from "./auth-screen";
import { AuthProvider } from "../auth-context";

export default function RootLayout() {
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [recoveryPending, setRecoveryPending] = useState(false);

  useEffect(() => {
    let mounted = true;

    const handleRecoveryLink = async (url: string) => {
      try {
        if (!url.includes("reset-password")) {
          return;
        }

        const hashPart = url.split("#")[1] ?? "";
        const queryPart = url.split("?")[1]?.split("#")[0] ?? "";

        const hashParams = new URLSearchParams(hashPart);
        const queryParams = new URLSearchParams(queryPart);

        const accessToken =
          hashParams.get("access_token") ??
          queryParams.get("access_token");

        const refreshToken =
          hashParams.get("refresh_token") ??
          queryParams.get("refresh_token");

        if (!accessToken || !refreshToken) {
          console.error(
            "Recovery link is missing authentication tokens."
          );
          return;
        }

        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error(
            "Recovery session failed:",
            error.message
          );
          return;
        }

        if (mounted && data.session) {
          setRecoveryPending(true);
        }
      } catch (error) {
        console.error(
          "Recovery link processing failed:",
          error
        );
      }
    };

    const linkingSubscription = Linking.addEventListener(
      "url",
      ({ url }) => {
        handleRecoveryLink(url);
      }
    );

    Linking.getInitialURL()
      .then((url) => {
        if (url) {
          handleRecoveryLink(url);
        }
      })
      .catch((error) => {
        console.error("Initial link error:", error);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (mounted) {
          setSession(currentSession);
          setCheckingSession(false);
        }
      }
    );

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error(
            "Session check failed:",
            error.message
          );
        }

        if (mounted) {
          setSession(data.session);
        }
      })
      .catch((error) => {
        console.error(
          "Session restoration failed:",
          error
        );

        if (mounted) {
          setSession(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setCheckingSession(false);
        }
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
      mounted = false;

      linkingSubscription.remove();
      subscription.unsubscribe();
      appStateSubscription.remove();

      supabase.auth.stopAutoRefresh();
    };
  }, []);

  useEffect(() => {
    if (session && recoveryPending) {
      router.replace("/reset-password");
      setRecoveryPending(false);
    }
  }, [session, recoveryPending, router]);

  if (checkingSession) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color="#C5A66D"
        />
        <Text style={styles.loadingText}>
          Loading VERITY...
        </Text>
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
          contentStyle: {
            backgroundColor: "#F7F5F0",
          },
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
