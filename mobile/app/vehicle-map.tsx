
import React, { useEffect, useMemo, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
} from "react-native";

import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
} from "@maplibre/maplibre-react-native";

export type VehicleLocation = {
  id: string;
  latitude: number;
  longitude: number;
  registration_number: string;
};

type Props = {
  locations: VehicleLocation[];
};

export default function VehicleMap({ locations }: Props) {
  const geoJSON = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: locations.map((vehicle) => ({
        type: "Feature" as const,
        id: vehicle.id,
        properties: {
          registration_number: vehicle.registration_number,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [
            vehicle.longitude,
            vehicle.latitude,
          ],
        },
      })),
    }),
    [locations]
  );

  const first = locations[0];
  const cameraRef = useRef<React.ComponentRef<typeof Camera>>(null);
  const hasCentered = useRef(false);

  useEffect(() => {
    if (!first || hasCentered.current) return;

    cameraRef.current?.flyTo({
      center: [first.longitude, first.latitude],
      zoom: 11,
      duration: 1200,
    });

    hasCentered.current = true;
  }, [first]);
  

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>▣</Text>
        </View>

        <View style={styles.headerText}>
          <Text style={styles.title}>Vehicle Live Map</Text>
          <Text style={styles.subtitle}>
            Location of assigned vehicles
          </Text>
        </View>

        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <Map
          style={styles.map}
          mapStyle="https://tiles.openfreemap.org/styles/liberty"
        >
           <Camera
            ref={cameraRef}
            initialViewState={{
              center: first
                ? [first.longitude, first.latitude]
                : [8, 9],
              zoom: first ? 11 : 5,
            }}
          />

          <GeoJSONSource
            id="verity-vehicle-locations"
            data={geoJSON}
          >
            <Layer
              id="verity-vehicle-markers"
              type="circle"
              paint={{
                "circle-radius": 9,
                "circle-color": "#C5A66D",
                "circle-stroke-width": 3,
                "circle-stroke-color": "#0D1920",
              }}
            />
          </GeoJSONSource>
        </Map>

        {locations.length === 0 && (
          <View style={styles.emptyOverlay}>
            <Text style={styles.emptyText}>
              No vehicle locations recorded yet.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <View style={styles.goldDot} />
          <Text style={styles.footerText}>
            {locations.length} Vehicles
          </Text>
        </View>

        <Text style={styles.updatedText}>
          GPS location data
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#E9E5DC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  iconBox: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: "#F1E5C9",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 25,
    color: "#0D1920",
  },
  headerText: {
    flex: 1,
    marginLeft: 11,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0D1920",
  },
  subtitle: {
    fontSize: 11,
    color: "#737772",
    marginTop: 3,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E9F5E9",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#36834B",
    marginRight: 5,
  },
  liveText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#36834B",
  },
  mapContainer: {
    height: 300,
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#E9E5DC",
  },
  map: {
    flex: 1,
  },
  emptyOverlay: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    padding: 10,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 11,
    color: "#0D1920",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  goldDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#C5A66D",
    marginRight: 7,
  },
  footerText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0D1920",
  },
  updatedText: {
    fontSize: 10,
    color: "#737772",
  },
});
