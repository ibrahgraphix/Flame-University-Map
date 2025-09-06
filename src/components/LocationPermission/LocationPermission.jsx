import React, { useEffect, useRef, useState } from "react";

/**
 * LocationPermission (improved accuracy via sample averaging)
 *
 * Props:
 * - onLocationGranted(locationObj) where locationObj = { lat, lng, accuracy, timestamp }
 * - onPermissionDenied(errorMessage)
 *
 * Behavior:
 * - Uses getCurrentPosition initially to trigger prompt.
 * - Starts watchPosition with enableHighAccuracy: true.
 * - Keeps a sliding window of recent samples and computes a weighted average
 *   using weights = 1 / accuracy (so more accurate samples count more).
 * - Calls onLocationGranted with averaged coords and averaged accuracy.
 */
export default function LocationPermission({
  onLocationGranted,
  onPermissionDenied,
}) {
  const [permissionState, setPermissionState] = useState("unknown");
  const samplesRef = useRef([]); // { lat, lng, accuracy, timestamp }[]
  const watchIdRef = useRef(null);
  const requestedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (!navigator.geolocation) {
      setPermissionState("denied");
      onPermissionDenied?.("Geolocation is not supported by your browser");
      return;
    }

    // Add a sample and emit averaged location
    const pushSampleAndEmit = (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      // Some browsers may report accuracy as undefined; set a fallback large value
      const rawAcc =
        typeof pos.coords.accuracy === "number" ? pos.coords.accuracy : 1000;
      const accuracy = Math.max(rawAcc, 1); // avoid zero
      const timestamp = pos.timestamp || Date.now();

      samplesRef.current.push({ lat, lng, accuracy, timestamp });
      // keep last N samples
      const MAX_SAMPLES = 8;
      if (samplesRef.current.length > MAX_SAMPLES) {
        samplesRef.current.shift();
      }

      // weighted average by inverse accuracy (1/accuracy)
      let sumWeight = 0;
      let sumLat = 0;
      let sumLng = 0;
      let latestTs = 0;
      for (const s of samplesRef.current) {
        const w = 1 / s.accuracy;
        sumWeight += w;
        sumLat += s.lat * w;
        sumLng += s.lng * w;
        if (s.timestamp > latestTs) latestTs = s.timestamp;
      }

      // If sumWeight is zero (shouldn't happen), fallback to last sample
      if (sumWeight <= 0) {
        const last = samplesRef.current[samplesRef.current.length - 1];
        onLocationGranted?.({
          lat: last.lat,
          lng: last.lng,
          accuracy: last.accuracy,
          timestamp: last.timestamp,
        });
        return;
      }

      const avgLat = sumLat / sumWeight;
      const avgLng = sumLng / sumWeight;
      // approximate combined accuracy as 1 / sum(1/acc) (harmonic-ish)
      const combinedAccuracy = 1 / sumWeight;

      onLocationGranted?.({
        lat: avgLat,
        lng: avgLng,
        accuracy: combinedAccuracy,
        timestamp: latestTs || Date.now(),
      });
    };

    const handleSuccessOnce = (position) => {
      if (!mountedRef.current) return;
      setPermissionState("granted");
      pushSampleAndEmit(position);

      // Start watching (if not already)
      if (watchIdRef.current == null) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            if (!mountedRef.current) return;
            pushSampleAndEmit(pos);
          },
          (err) => {
            console.error("watchPosition error:", err);
            if (!mountedRef.current) return;
            if (err?.code === err.PERMISSION_DENIED) {
              setPermissionState("denied");
              onPermissionDenied?.(err.message || "Permission denied");
            } else {
              onPermissionDenied?.(err.message || "Location watch error");
            }
            if (watchIdRef.current != null) {
              navigator.geolocation.clearWatch(watchIdRef.current);
              watchIdRef.current = null;
            }
          },
          {
            enableHighAccuracy: true,
            maximumAge: 2000, // prefer fresh samples
            timeout: 15000,
          }
        );
      }
    };

    const handleErrorOnce = (err) => {
      console.error("getCurrentPosition error:", err);
      if (!mountedRef.current) return;
      if (err.code === err.PERMISSION_DENIED) {
        setPermissionState("denied");
        onPermissionDenied?.(err.message || "Permission denied");
      } else {
        onPermissionDenied?.(err.message || "Unable to get location");
      }
    };

    const requestOnce = () => {
      if (requestedRef.current) return;
      requestedRef.current = true;

      // initial prompt: high accuracy, no caching, larger timeout
      navigator.geolocation.getCurrentPosition(
        handleSuccessOnce,
        handleErrorOnce,
        { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
      );
    };

    // Query Permissions API to avoid unnecessary UI changes
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((status) => {
          if (!mountedRef.current) return;
          setPermissionState(status.state);
          if (status.state === "granted") {
            // if already granted, fetch current and start watch
            navigator.geolocation.getCurrentPosition(
              handleSuccessOnce,
              handleErrorOnce,
              {
                enableHighAccuracy: true,
                maximumAge: 2000,
              }
            );
          } else if (status.state === "prompt") {
            // slight delay lets the page paint and avoids focus race
            setTimeout(requestOnce, 80);
          } else if (status.state === "denied") {
            onPermissionDenied?.("Location permission denied");
          }
          status.onchange = () => {
            if (!mountedRef.current) return;
            setPermissionState(status.state);
            if (status.state === "granted") {
              navigator.geolocation.getCurrentPosition(
                handleSuccessOnce,
                handleErrorOnce,
                {
                  enableHighAccuracy: true,
                  maximumAge: 2000,
                }
              );
            } else if (status.state === "denied") {
              onPermissionDenied?.("Location permission denied");
              if (watchIdRef.current != null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
              }
            }
          };
        })
        .catch(() => {
          requestOnce();
        });
    } else {
      // no Permissions API – directly request
      setTimeout(requestOnce, 80);
    }

    return () => {
      mountedRef.current = false;
      if (watchIdRef.current != null) {
        try {
          navigator.geolocation.clearWatch(watchIdRef.current);
        } catch (e) {
          /* ignore */
        }
        watchIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onLocationGranted, onPermissionDenied]);

  if (permissionState === "denied") {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            textAlign: "center",
            maxWidth: "90%",
            width: 360,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Location Access Denied</h3>
          <p>
            You have blocked location access for this site. To enable it, open
            your browser's site settings and allow Location for this page, then
            refresh.
          </p>
          <button
            onClick={() => {
              onPermissionDenied?.("Location access denied");
            }}
            style={{
              marginTop: 12,
              padding: "8px 14px",
              borderRadius: 6,
              border: "none",
              background: "#007bff",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  // no UI while prompting/granted — we want native browser dialog to be usable
  return null;
}
