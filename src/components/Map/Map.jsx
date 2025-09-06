// src/components/Map/Map.jsx
import React, { useRef, useState, useEffect } from "react";
import mapImage from "../../assets/map.svg";
import styles from "./Map.module.css";

const Map = () => {
  // Example coordinates for "Your location"
  const location = { lat: 37.7749, lng: -122.4194 };

  // Map bounds (adjust to match your map.svg's projection)
  const bounds = {
    north: 38.0,
    south: 37.0,
    west: -123.0,
    east: -122.0,
  };

  // Map SVG dimensions (adjust to match your actual map.svg size)
  const mapWidth = 800;
  const mapHeight = 600;

  // Convert lat/lng to pixel positions inside map.svg
  const x =
    ((location.lng - bounds.west) / (bounds.east - bounds.west)) * mapWidth;
  const y =
    ((bounds.north - location.lat) / (bounds.north - bounds.south)) * mapHeight;

  // Clamp to keep the red dot inside the map
  const clampedX = Math.min(Math.max(x, 0), mapWidth);
  const clampedY = Math.min(Math.max(y, 0), mapHeight);

  // Zoom and Drag states
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Center map on load
  useEffect(() => {
    const centerX = (window.innerWidth - mapWidth) / 2;
    const centerY = (window.innerHeight - mapHeight) / 2;
    setTranslate({ x: centerX, y: centerY });
  }, []);

  const handleZoomIn = () => {
    setScale((prev) => prev + 0.2);
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleMouseDown = (e) => {
    setDragging(true);
    dragStart.current = {
      x: e.clientX - translate.x,
      y: e.clientY - translate.y,
    };
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    setTranslate({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  return (
    <div
      className={styles.mapContainer}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: dragging ? "grabbing" : "grab" }}
    >
      {/* Zoom Controls (Top-Right) */}
      <div className={styles.zoomControls}>
        <button className={styles.zoomBtn} onClick={handleZoomIn}>
          +
        </button>
        <button className={styles.zoomBtn} onClick={handleZoomOut}>
          −
        </button>
      </div>

      {/* Map Wrapper */}
      <div
        className={styles.svgWrapper}
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transformOrigin: "top left",
          position: "relative",
          width: mapWidth,
          height: mapHeight,
        }}
      >
        <img
          src={mapImage}
          alt="Map"
          style={{
            width: mapWidth,
            height: mapHeight,
            display: "block",
            userSelect: "none",
            pointerEvents: "none",
          }}
          draggable="false"
        />
        {/* Red Dot Marker */}
        <div
          style={{
            position: "absolute",
            left: clampedX - 5,
            top: clampedY - 5,
            width: 10,
            height: 10,
            backgroundColor: "red",
            borderRadius: "50%",
            border: "2px solid white",
          }}
          aria-label="current-location"
        ></div>
      </div>
    </div>
  );
};

export default Map;
