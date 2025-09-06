import React from "react";
import styles from "./Controls.module.css";

export default function Controls({ location, accuracy, lastUpdate, error }) {
  return (
    <div id="controlsContainer" className={styles.controlsContainer}>
      <div id="locationInfoCard" className={styles.infoCard}>
        <h3>
          <i
            className="fas fa-location-dot"
            style={{ color: "var(--flame-blue)" }}
          ></i>{" "}
          Your Location
        </h3>
        {error ? (
          <p className={styles.muted}>Error: {error}</p>
        ) : location ? (
          <>
            <p id="locationText" className={styles.muted}>
              Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
            </p>
            <div className={styles.infoRow}>
              <div className={styles.tag}>
                <span className={styles.smallMuted}>Accuracy:</span>{" "}
                <span id="accuracyText">
                  {accuracy ? `${accuracy} m` : "--"}
                </span>
              </div>
              <div className={styles.tag}>
                <span className={styles.smallMuted}>Last update:</span>{" "}
                <span id="lastUpdateText">
                  {lastUpdate ? lastUpdate.toLocaleTimeString() : "--"}
                </span>
              </div>
            </div>
          </>
        ) : (
          <p className={styles.muted}>Acquiring GPS signal...</p>
        )}
      </div>
    </div>
  );
}
