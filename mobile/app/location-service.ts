
import * as Location from "expo-location";

export type ScanLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
  capturedAt: string;
  placeName: string;
  locationText: string;
};

const MAX_LOCATION_ACCURACY_METRES = 50;

export async function detectLocation(): Promise<ScanLocation> {
  const servicesEnabled =
    await Location.hasServicesEnabledAsync();

  if (!servicesEnabled) {
    throw new Error(
      "Your device location is switched off. Turn on GPS and try again."
    );
  }

  const permission =
    await Location.requestForegroundPermissionsAsync();

  if (permission.status !== "granted") {
    throw new Error(
      "VERITY needs location permission before you can scan a product."
    );
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  const { latitude, longitude, accuracy } = position.coords;

  if (
    typeof accuracy !== "number" ||
    !Number.isFinite(accuracy) ||
    accuracy > MAX_LOCATION_ACCURACY_METRES
  ) {
    throw new Error(
      "Your location is not accurate enough yet. Move to an area with a clearer GPS signal and try again."
    );
  }

  let placeName = "Location identified";
  let locationText =
    `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (addresses.length > 0) {
      const address = addresses[0];

      placeName =
        address.name ||
        address.street ||
        address.district ||
        address.city ||
        address.region ||
        "Location identified";

      const formattedAddress = [
        address.name,
        address.street,
        address.district,
        address.city,
        address.region,
        address.country,
      ]
        .filter(Boolean)
        .join(", ");

      if (formattedAddress) {
        locationText = formattedAddress;
      }
    }
  } catch {
    // Coordinates remain available if address lookup fails.
  }

  return {
    latitude,
    longitude,
    accuracy,
    capturedAt: new Date().toISOString(),
    placeName,
    locationText,
  };
}
