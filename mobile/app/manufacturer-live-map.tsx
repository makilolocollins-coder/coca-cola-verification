
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { supabase } from "../supabase";
import VehicleMap, { VehicleLocation } from "./vehicle-map";

type TrackedVehicle = VehicleLocation & {
  recorded_at: string;
};

type Props = {
  manufacturerId: string;
};

const STALE_AFTER_MS = 2 * 60 * 1000;

export default function ManufacturerLiveMap({
  manufacturerId,
}: Props) {
  const [locations, setLocations] = useState<TrackedVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const loadLocations = useCallback(async () => {
    try {
      setErrorMessage("");

      const { data: trips, error: tripError } = await supabase
        .from("verity_delivery_trips")
        .select("id, vehicle_id")
        .eq("manufacturer_id", manufacturerId)
        .eq("trip_status", "in_progress");

      if (tripError) throw tripError;

      if (!trips || trips.length === 0) {
        setLocations([]);
        setLastUpdated(new Date());
        return;
      }

      const tripIds = trips.map((trip) => trip.id);
      const vehicleIds = [
        ...new Set(trips.map((trip) => trip.vehicle_id)),
      ];

      const [
        { data: vehicles, error: vehicleError },
        { data: gpsRecords, error: gpsError },
      ] = await Promise.all([
        supabase
          .from("verity_vehicles")
          .select("id, registration_number")
          .in("id", vehicleIds),

        supabase
          .from("verity_vehicle_locations")
          .select("trip_id, latitude, longitude, recorded_at")
          .in("trip_id", tripIds)
          .order("recorded_at", { ascending: false }),
      ]);

      if (vehicleError) throw vehicleError;
      if (gpsError) throw gpsError;

      const vehicleMap = new Map(
        (vehicles || []).map((vehicle) => [
          vehicle.id,
          vehicle.registration_number,
        ])
      );

      const latestByTrip = new Map<string, TrackedVehicle>();

      for (const record of gpsRecords || []) {
        if (latestByTrip.has(record.trip_id)) continue;

        const trip = trips.find(
          (item) => item.id === record.trip_id
        );

        if (!trip) continue;

        const registration = vehicleMap.get(trip.vehicle_id);

        if (!registration) continue;

        latestByTrip.set(record.trip_id, {
          id: record.trip_id,
          latitude: Number(record.latitude),
          longitude: Number(record.longitude),
          registration_number: registration,
          recorded_at: record.recorded_at,
        });
      }

      setLocations(Array.from(latestByTrip.values()));
      setLastUpdated(new Date());
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to retrieve vehicle locations.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }, [manufacturerId]);

  useEffect(() => {
    loadLocations();

    const interval = setInterval(() => {
      loadLocations();
    }, 15000);

    return () => clearInterval(interval);
  }, [loadLocations]);

  const isStale = (recordedAt: string) => {
    const timestamp = new Date(recordedAt).getTime();

    return (
      !Number.isFinite(timestamp) ||
      Date.now() - timestamp > STALE_AFTER_MS
    );
  };

  const formatAge = (recordedAt: string) => {
    const timestamp = new Date(recordedAt).getTime();

    if (!Number.isFinite(timestamp)) {
      return "Unknown update time";
    }

    const seconds = Math.max(
      0,
      Math.floor((Date.now() - timestamp) / 1000)
    );

    if (seconds < 60) return `${seconds}s ago`;

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);

    return `${hours}h ${minutes % 60}m ago`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Fleet tracking</Text>

      <Text style={styles.description}>
        Latest available GPS positions of vehicles on active deliveries.
      </Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#C5A66D"
          style={styles.loader}
        />
      ) : (
        <>
          <VehicleMap locations={locations} />

          <View style={styles.info}>
            <Text style={styles.count}>
              {locations.length} vehicles reporting
            </Text>

            <Text style={styles.time}>
              {lastUpdated
                ? `Checked ${lastUpdated.toLocaleTimeString()}`
                : "Not updated yet"}
            </Text>
          </View>

          {locations.length > 0 && (
            <View style={styles.vehicleList}>
              <Text style={styles.listHeading}>
                Vehicle GPS status
              </Text>

              {locations.map((vehicle) => {
                const stale = isStale(vehicle.recorded_at);

                return (
                  <View
                    key={vehicle.id}
                    style={styles.vehicleRow}
                  >
                    <View style={styles.vehicleDetails}>
                      <Text style={styles.registration}>
                        {vehicle.registration_number}
                      </Text>

                      <Text style={styles.gpsTime}>
                        Last GPS update: {formatAge(vehicle.recorded_at)}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        stale
                          ? styles.staleBadge
                          : styles.activeBadge,
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          stale
                            ? styles.staleDot
                            : styles.activeDot,
                        ]}
                      />

                      <Text
                        style={[
                          styles.statusText,
                          stale
                            ? styles.staleText
                            : styles.activeText,
                        ]}
                      >
                        {stale ? "STALE" : "RECENT"}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {errorMessage ? (
            <Text style={styles.error}>{errorMessage}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.refresh}
            onPress={loadLocations}
          >
            <Text style={styles.refreshText}>
              Refresh vehicle locations
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 22,
    marginBottom: 25,
  },
  heading: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0D1920",
    marginBottom: 5,
  },
  description: {
    fontSize: 12,
    color: "#737772",
    lineHeight: 19,
  },
  loader: {
    marginTop: 30,
  },
  info: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  count: {
    color: "#0D1920",
    fontSize: 12,
    fontWeight: "800",
  },
  time: {
    color: "#737772",
    fontSize: 10,
  },
  vehicleList: {
    marginTop: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E9E5DC",
    padding: 13,
  },
  listHeading: {
    color: "#0D1920",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 10,
  },
  vehicleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0EDE6",
  },
  vehicleDetails: {
    flex: 1,
    marginRight: 8,
  },
  registration: {
    color: "#0D1920",
    fontSize: 13,
    fontWeight: "800",
  },
  gpsTime: {
    color: "#737772",
    fontSize: 10,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  activeBadge: {
    backgroundColor: "#E8F3EB",
  },
  staleBadge: {
    backgroundColor: "#F8EAE7",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },
  activeDot: {
    backgroundColor: "#36834B",
  },
  staleDot: {
    backgroundColor: "#A34E45",
  },
  statusText: {
    fontSize: 9,
    fontWeight: "800",
  },
  activeText: {
    color: "#36834B",
  },
  staleText: {
    color: "#A34E45",
  },
  error: {
    color: "#A34E45",
    fontSize: 12,
    marginTop: 10,
  },
  refresh: {
    borderWidth: 1,
    borderColor: "#C5A66D",
    borderRadius: 12,
    minHeight: 43,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  refreshText: {
    color: "#0D1920",
    fontSize: 12,
    fontWeight: "700",
  },
});
