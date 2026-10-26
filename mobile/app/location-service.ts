import * as Location from "expo-location";

export type ScanLocation = {
latitude: number;
longitude: number;
placeName: string;
locationText: string;
};

export async function detectLocation(): Promise<ScanLocation> {
const permission =
await Location.requestForegroundPermissionsAsync();

if (permission.status !== "granted") {
throw new Error(
"Location permission is required to record where the product was scanned."
);
}

const position = await Location.getCurrentPositionAsync({
accuracy: Location.Accuracy.Balanced,
});

const latitude = position.coords.latitude;
const longitude = position.coords.longitude;

let placeName = "Unknown location";
let locationText = "${latitude.toFixed(6)}, ${longitude.toFixed(6)}";

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
    "Unknown location";

  locationText = [
    address.name,
    address.street,
    address.city,
    address.region,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
}

} catch {
// GPS coordinates remain available if address lookup fails.
}

return {
latitude,
longitude,
placeName,
locationText,
};
}
