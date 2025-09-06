import React from "react";
import Map from "../Map/Map";
import styles from "./MapContainer.module.css";

export default function MapContainer({ userLocation }) {
  return (
    <div className={styles.mapContainer}>
      <Map userLocation={userLocation} />
    </div>
  );
}
