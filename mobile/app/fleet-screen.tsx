import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { supabase } from "../supabase";
import { useAuth } from "../auth-context";

type Vehicle = {
  id: string;
  registration_number: string;
  vehicle_name: string | null;
  tracking_source: string;
  active: boolean;
};

type Trip = {
  id: string;
  vehicle_id: string;
  origin: string | null;
  destination: string | null;
  trip_status: string;
  created_at: string;
};

export default function FleetScreen() {
  const { session, profile, signOut } = useAuth();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [registration, setRegistration] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [trackingSource, setTrackingSource] = useState<
    "smartphone" | "dedicated_tracker" | "both"
  >("smartphone");


  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [driverId, setDriverId] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isManufacturer = profile?.role === "manufacturer";
  const isDriver = profile?.role === "driver";

  const loadDashboard = async () => {
    if (!session?.user?.id || !profile) return;

    setLoading(true);

    try {
      if (isManufacturer) {
        const { data, error } = await supabase
          .from("verity_vehicles")
          .select(
            "id, registration_number, vehicle_name, tracking_source, active"
          )
          .eq("manufacturer_id", session.user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setVehicles((data || []) as Vehicle[]);
      }

      if (isDriver) {
        const { data, error } = await supabase
          .from("verity_delivery_trips")
          .select(
            "id, vehicle_id, origin, destination, trip_status, created_at"
          )
          .eq("driver_id", session.user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setTrips((data || []) as Trip[]);
      }
    } catch (error: any) {
      Alert.alert(
        "Dashboard unavailable",
        error?.message || "Unable to load fleet information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [session?.user?.id, profile?.role]);

  const registerVehicle = async () => {
    if (!registration.trim()) {
      Alert.alert(
        "Registration required",
        "Enter the vehicle registration number."
      );
      return;
    }

    if (!session?.user?.id) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("verity_vehicles")
        .insert({
          manufacturer_id: session.user.id,
          registration_number: registration.trim().toUpperCase(),
          vehicle_name: vehicleName.trim() || null,
          tracking_source: trackingSource,
          active: true,
        });

      if (error) throw error;

      setRegistration("");
      setVehicleName("");

      Alert.alert("Vehicle registered", "The vehicle has been added.");
      await loadDashboard();
    } catch (error: any) {
      Alert.alert(
        "Registration failed",
        error?.message || "Unable to register this vehicle."
      );
    } finally {
      setSaving(false);
    }
  };


  const createTrip = async () => {
  if (!selectedVehicle || !driverId.trim() || !origin.trim() || !destination.trim()) {
    Alert.alert("Missing information", "Complete all delivery trip fields.");
    return;
  }

  if (!session?.user?.id) return;

  setSaving(true);

  try {
    const { error } = await supabase
      .from("verity_delivery_trips")
      .insert({
        vehicle_id: selectedVehicle,
        manufacturer_id: session.user.id,
        driver_id: driverId.trim(),
        origin: origin.trim(),
        destination: destination.trim(),
        trip_status: "assigned",
      });

    if (error) throw error;

    setSelectedVehicle("");
    setDriverId("");
    setOrigin("");
    setDestination("");

    Alert.alert("Trip created", "The delivery has been assigned.");
    await loadDashboard();
  } catch (error: any) {
    Alert.alert(
      "Trip creation failed",
      error?.message || "Unable to create this delivery."
    );
  } finally {
    setSaving(false);
  }
};
  
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      Alert.alert(
        "Sign out failed",
        error?.message || "Please try again."
      );
    }
  };

  if (!profile || (!isManufacturer && !isDriver)) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>VERITY Fleet</Text>
        <Text style={styles.muted}>
          This account does not have an authorised fleet role.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={handleSignOut}
        >
          <Text style={styles.buttonText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.eyebrow}>VERITY / FLEET MANAGEMENT</Text>

      <Text style={styles.title}>
        {isManufacturer ? "Manufacturer dashboard" : "Driver dashboard"}
      </Text>

      <Text style={styles.muted}>
        Signed in as {profile.full_name || "VERITY user"}
      </Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#C5A66D"
          style={{ marginTop: 35 }}
        />
      ) : isManufacturer ? (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Register a vehicle</Text>
            <Text style={styles.muted}>
              Add a delivery vehicle to your authorised fleet.
            </Text>

            <Text style={styles.label}>Vehicle registration number</Text>
            <TextInput
              style={styles.input}
              value={registration}
              onChangeText={setRegistration}
              placeholder="e.g. ABC-123XY"
              autoCapitalize="characters"
            />

            <Text style={styles.label}>Vehicle name (optional)</Text>
            <TextInput
              style={styles.input}
              value={vehicleName}
              onChangeText={setVehicleName}
              placeholder="e.g. Lagos delivery truck"
            />

            <Text style={styles.label}>Tracking equipment</Text>

            {(
              [
                ["smartphone", "Driver's smartphone"],
                ["dedicated_tracker", "Dedicated GPS tracker"],
                ["both", "Both"],
              ] as const
            ).map(([value, label]) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.choice,
                  trackingSource === value && styles.choiceActive,
                ]}
                onPress={() => setTrackingSource(value)}
              >
                <Text
                  style={[
                    styles.choiceText,
                    trackingSource === value && styles.choiceTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.button}
              onPress={registerVehicle}
              disabled={saving}
            >
              <Text style={styles.buttonText}>
                {saving ? "Registering..." : "Register vehicle"}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>
            Your registered vehicles ({vehicles.length})
          </Text>

          {vehicles.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.muted}>
                No vehicles registered yet.
              </Text>
            </View>
          ) : (
            vehicles.map((vehicle) => (
              <View key={vehicle.id} style={styles.listCard}>
                <Text style={styles.vehicleName}>
                  {vehicle.vehicle_name || "Delivery vehicle"}
                </Text>
                <Text style={styles.muted}>
                  Registration: {vehicle.registration_number}
                </Text>
                <Text style={styles.muted}>
                  Tracking: {vehicle.tracking_source}
                </Text>
                <Text style={styles.status}>
                  {vehicle.active ? "ACTIVE" : "INACTIVE"}
                </Text>
              </View>
            ))
          )}
        </>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Assigned deliveries</Text>
            <Text style={styles.muted}>
              Deliveries assigned to your driver account will appear here.
            </Text>
          </View>

          {trips.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.muted}>
                No delivery trips have been assigned to you.
              </Text>
            </View>
          ) : (
            trips.map((trip) => (
              <View key={trip.id} style={styles.listCard}>
                <Text style={styles.vehicleName}>
                  Delivery trip
                </Text>
                <Text style={styles.muted}>
                  From: {trip.origin || "Not specified"}
                </Text>
                <Text style={styles.muted}>
                  To: {trip.destination || "Not specified"}
                </Text>
                <Text style={styles.status}>
                  {trip.trip_status.toUpperCase()}
                </Text>
              </View>
            ))
          )}
        </>
      )}

      <TouchableOpacity
        style={styles.refreshButton}
        onPress={loadDashboard}
      >
        <Text style={styles.refreshText}>Refresh dashboard</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#F7F5EF",
  },
  content: {
    padding: 22,
    paddingBottom: 45,
  },
  center: {
    flex: 1,
    backgroundColor: "#F7F5EF",
    justifyContent: "center",
    padding: 25,
  },
  eyebrow: {
    color: "#99845D",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  title: {
    color: "#0D1920",
    fontSize: 29,
    fontWeight: "800",
    marginBottom: 8,
  },
  muted: {
    color: "#737772",
    fontSize: 13,
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E9E5DC",
    padding: 18,
    marginTop: 23,
    marginBottom: 25,
  },
  cardTitle: {
    color: "#0D1920",
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 8,
  },
  label: {
    color: "#0D1920",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 17,
    marginBottom: 7,
  },
  input: {
    minHeight: 49,
    borderWidth: 1,
    borderColor: "#E9E5DC",
    borderRadius: 12,
    paddingHorizontal: 13,
    color: "#0D1920",
    backgroundColor: "#F7F5EF",
  },
  choice: {
    padding: 13,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#E9E5DC",
    marginBottom: 8,
  },
  choiceActive: {
    borderColor: "#C5A66D",
    backgroundColor: "#F4EFE4",
  },
  choiceText: {
    color: "#737772",
    fontSize: 13,
  },
  choiceTextActive: {
    color: "#0D1920",
    fontWeight: "700",
  },
  button: {
    minHeight: 51,
    backgroundColor: "#0D1920",
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },
  sectionTitle: {
    color: "#0D1920",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },
  empty: {
    padding: 20,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E9E5DC",
  },
  listCard: {
    padding: 16,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E9E5DC",
    marginBottom: 11,
  },
  vehicleName: {
    color: "#0D1920",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 7,
  },
  status: {
    color: "#99845D",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 9,
  },
  refreshButton: {
    minHeight: 47,
    borderWidth: 1,
    borderColor: "#C5A66D",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  refreshText: {
    color: "#0D1920",
    fontWeight: "700",
  },
  signOutButton: {
    minHeight: 47,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  signOutText: {
    color: "#A34E45",
    fontWeight: "700",
  },
});
