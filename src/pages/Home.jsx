import React, { useState } from "react";
import Header from "../components/Header/Header";
import MapContainer from "../components/MapContainer/MapContainer";
import Controls from "../components/Controls/Controls";
import Footer from "../components/Footer/Footer";
import LocationPermission from "../components/LocationPermission/LocationPermission";
import styles from "./Home.module.css";

export default function Home() {
  const [userLocation, setUserLocation] = useState(null);
  const [permissionError, setPermissionError] = useState(null);
  const [locationData, setLocationData] = useState({
    location: null,
    accuracy: null,
    lastUpdate: null,
  });

  // Handle averaged location updates (location object from LocationPermission)
  const handleLocationUpdate = (locationObj) => {
    // locationObj expected: { lat, lng, accuracy, timestamp }
    if (!locationObj) return;

    setUserLocation({ lat: locationObj.lat, lng: locationObj.lng });

    setLocationData({
      location: {
        lat: locationObj.lat,
        lng: locationObj.lng,
        accuracy: locationObj.accuracy,
      },
      accuracy: locationObj.accuracy,
      lastUpdate: locationObj.timestamp
        ? new Date(locationObj.timestamp)
        : new Date(),
    });
  };

  const handlePermissionDenied = (error) => {
    setPermissionError(error);
  };

  return (
    <div className={styles.page}>
      <Header />
      <main
        className={styles.main}
        style={{ position: "relative", height: "100vh" }}
      >
        {/* Request permission immediately */}
        {!permissionError && (
          <LocationPermission
            onLocationGranted={handleLocationUpdate}
            onPermissionDenied={handlePermissionDenied}
          />
        )}

        {/* Show map and controls if location is available or while waiting for permission */}
        <div style={{ display: permissionError ? "none" : "block" }}>
          <MapContainer userLocation={userLocation} />
          <Controls
            location={locationData.location}
            accuracy={locationData.accuracy}
            lastUpdate={locationData.lastUpdate}
            error={permissionError}
          />
        </div>

        {/* If denied, show a message */}
        {permissionError && (
          <div style={{ padding: "20px", textAlign: "center" }}>
            <p>
              Location access denied. Please enable it in your browser settings
              and refresh the page.
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
