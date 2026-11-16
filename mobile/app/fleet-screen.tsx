
import React, { useCallback, useEffect, useState } from "react";
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
  tracking_source: "smartphone" | "dedicated_tracker" | "both";
  active: boolean;
};

type Trip = {
  id: string;
  vehicle_id: string;
  origin: string | null;
  destination: string | null;
  trip_status: "assigned" | "in_progress" | "completed" | "cancelled";
  created_at: string;
};

type TripAction = "in_progress" | "completed";

export default function FleetScreen() {
  const { session, profile, signOut } = useAuth();

  const userId = session?.user?.id;
  const isManufacturer = profile?.role === "manufacturer";
  const isDriver = profile?.role === "driver";

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
  const [updatingTripId, setUpdatingTripId] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!userId || !profile) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      if (isManufacturer) {
        const { data, error } = await supabase
          .from("verity_vehicles")
          .select(
            "id, registration_number, vehicle_name, tracking_source, active"
          )
          .eq("manufacturer_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setVehicles((data || []) as Vehicle[]);
      } else if (isDriver) {
        const { data, error } = await supabase
          .from("verity_delivery_trips")
          .select(
            "id, vehicle_id, origin, destination, trip_status, created_at"
          )
          .eq("driver_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setTrips((data || []) as Trip[]);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load fleet information.";

      Alert.alert("Dashboard unavailable", message);
    } finally {
      setLoading(false);
    }
  }, [userId, profile, isManufacturer, isDriver]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const registerVehicle = async () => {
    if (!registration.trim()) {
      Alert.alert(
        "Registration required",
        "Enter the vehicle registration number."
      );
      return;
    }

    if (!userId || !isManufacturer || saving) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("verity_vehicles")
        .insert({
          manufacturer_id: userId,
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
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to register this vehicle.";

      Alert.alert("Registration failed", message);
    } finally {
      setSaving(false);
    }
  };

  const createTrip = async () => {
    if (
      !selectedVehicle ||
      !driverId.trim() ||
      !origin.trim() ||
      !destination.trim()
    ) {
      Alert.alert(
        "Missing information",
        "Complete all delivery trip fields."
      );
      return;
    }

    if (!userId || !isManufacturer || saving) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("verity_delivery_trips")
        .insert({
          vehicle_id: selectedVehicle,
          manufacturer_id: userId,
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
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to create this delivery.";

      Alert.alert("Trip creation failed", message);
    } finally {
      setSaving(false);
    }
  };

  const updateTripStatus = async (
    tripId: string,
    newStatus: TripAction
  ) => {
    if (!isDriver || !userId || updatingTripId) return;

    setUpdatingTripId(tripId);

    try {
      const { error } = await supabase.rpc(
        "update_driver_trip_status",
        {
          p_trip_id: tripId,
          p_new_status: newStatus,
        }
      );

      if (error) throw error;

      Alert.alert(
        newStatus === "in_progress"
          ? "Delivery started"
          : "Delivery completed",
        newStatus === "in_progress"
          ? "Your delivery is now in progress."
          : "Your delivery has been marked as completed."
      );

      await loadDashboard();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to update this delivery.";

      Alert.alert("Delivery update failed", message);
    } finally {
      setUpdatingTripId(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Please try again.";

      Alert.alert("Sign out failed", message);
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

            <Text style={styles.label}>
              Vehicle registration number
            </Text>

            <TextInput
              style={styles.input}
              value={registration}
              onChangeText={setRegistration}
              placeholder="e.g. ABC-123XY"
              autoCapitalize="characters"
              maxLength={20}
              editable={!saving}
            />

            <Text style={styles.label}>
              Vehicle name (optional)
            </Text>

            <TextInput
              style={styles.input}
              value={vehicleName}
              onChangeText={setVehicleName}
              placeholder="e.g. Lagos delivery truck"
              maxLength={80}
              editable={!saving}
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
                disabled={saving}
              >
                <Text
                  style={[
                    styles.choiceText,
                    trackingSource === value &&
                      styles.choiceTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[
                styles.button,
                saving && styles.buttonDisabled,
              ]}
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

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create delivery trip</Text>

            <Text style={styles.muted}>
              Assign a registered vehicle to a driver.
            </Text>

            <Text style={styles.label}>Select vehicle</Text>

            {vehicles.filter((v) => v.active).length === 0 ? (
              <Text style={styles.muted}>
                Register an active vehicle before creating a trip.
              </Text>
            ) : (
              vehicles
                .filter((vehicle) => vehicle.active)
                .map((vehicle) => (
                  <TouchableOpacity
                    key={vehicle.id}
                    style={[
                      styles.choice,
                      selectedVehicle === vehicle.id &&
                        styles.choiceActive,
                    ]}
                    onPress={() => setSelectedVehicle(vehicle.id)}
                    disabled={saving}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        selectedVehicle === vehicle.id &&
                          styles.choiceTextActive,
                      ]}
                    >
                      {vehicle.registration_number}
                      {vehicle.vehicle_name
                        ? ` - ${vehicle.vehicle_name}`
                        : ""}
                    </Text>
                  </TouchableOpacity>
                ))
            )}

            <Text style={styles.label}>Driver account ID</Text>

            <TextInput
              style={styles.input}
              value={driverId}
              onChangeText={setDriverId}
              placeholder="Enter driver's account UUID"
              autoCapitalize="none"
              editable={!saving}
            />

            <Text style={styles.label}>Delivery origin</Text>

            <TextInput
              style={styles.input}
              value={origin}
              onChangeText={setOrigin}
              placeholder="e.g. Lagos warehouse"
              maxLength={150}
              editable={!saving}
            />

            <Text style={styles.label}>Delivery destination</Text>

            <TextInput
              style={styles.input}
              value={destination}
              onChangeText={setDestination}
              placeholder="e.g. Abuja distribution centre"
              maxLength={150}
              editable={!saving}
            />

            <TouchableOpacity
              style={[
                styles.button,
                saving && styles.buttonDisabled,
              ]}
              onPress={createTrip}
              disabled={
                saving ||
                vehicles.filter((v) => v.active).length === 0
              }
            >
              <Text style={styles.buttonText}>
                {saving ? "Creating trip..." : "Assign delivery"}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Assigned deliveries</Text>

            <Text style={styles.muted}>
              Deliveries assigned to your driver account appear here.
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
                <Text style={styles.vehicleName}>Delivery trip</Text>

                <Text style={styles.muted}>
                  From: {trip.origin || "Not specified"}
                </Text>

                <Text style={styles.muted}>
                  To: {trip.destination || "Not specified"}
                </Text>

                <Text style={styles.status}>
                  {trip.trip_status.toUpperCase()}
                </Text>

                {trip.trip_status === "assigned" && (
                  <TouchableOpacity
                    style={[
                      styles.button,
                      updatingTripId !== null &&
                        styles.buttonDisabled,
                    ]}
                    disabled={updatingTripId !== null}
                    onPress={() =>
                      updateTripStatus(trip.id, "in_progress")
                    }
                  >
                    <Text style={styles.buttonText}>
                      {updatingTripId === trip.id
                        ? "Updating..."
                        : "Start Delivery"}
                    </Text>
                  </TouchableOpacity>
                )}

                {trip.trip_status === "in_progress" && (
                  <TouchableOpacity
                    style={[
                      styles.button,
                      updatingTripId !== null &&
                        styles.buttonDisabled,
                    ]}
                    disabled={updatingTripId !== null}
                    onPress={() =>
                      updateTripStatus(trip.id, "completed")
                    }
                  >
                    <Text style={styles.buttonText}>
                      {updatingTripId === trip.id
                        ? "Updating..."
                        : "Complete Delivery"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </>
      )}

      <TouchableOpacity
        style={styles.refreshButton}
        onPress={loadDashboard}
        disabled={loading || saving || updatingTripId !== null}
      >
        <Text style={styles.refreshText}>
          {loading ? "Refreshing..." : "Refresh dashboard"}
        </Text>
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
  buttonDisabled: {
    opacity: 0.55,
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
