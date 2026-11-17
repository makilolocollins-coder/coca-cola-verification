
import * as Location from "expo-location";
import { supabase } from "../supabase";

let activeSubscription: Location.LocationSubscription | null = null;

export async function startTripLocationTracking(
  tripId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Prevent multiple simultaneous tracking subscriptions.
    if (activeSubscription) {
      activeSubscription.remove();
      activeSubscription = null;
    }

    // Request the driver's permission.
    const permission =
      await Location.requestForegroundPermissionsAsync();

    if (permission.status !== "granted") {
      return {
        success: false,
        message: "Location permission was not granted.",
      };
    }

    // Confirm that the trip is still active and assigned to this driver.
    const { data: trip, error: tripError } = await supabase
      .from("verity_delivery_trips")
      .select("id, trip_status")
      .eq("id", tripId)
      .single();

    if (tripError) throw tripError;

    if (trip.trip_status !== "in_progress") {
      return {
        success: false,
        message: "This delivery is not currently active.",
      };
    }

    // Begin foreground-only GPS tracking.
    activeSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 25,
      },
      async (location) => {
        const { latitude, longitude, accuracy } =
          location.coords;

        const { error } = await supabase
          .from("verity_vehicle_locations")
          .insert({
            trip_id: tripId,
            latitude,
            longitude,
            accuracy,
            source: "smartphone",
          });

        if (error) {
          console.warn(
            "VERITY location upload failed:",
            error.message
          );
        }
      }
    );

    return {
      success: true,
      message: "GPS tracking started.",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to start GPS tracking.";

    return {
      success: false,
      message,
    };
  }
}

export function stopTripLocationTracking(): void {
  if (activeSubscription) {
    activeSubscription.remove();
    activeSubscription = null;
  }
}
