let mapScale = 1;
let mapPan = { x: 0, y: 0 };
let isFullscreen = false;
let currentPosition = null;

export function loadSvgMap(svgRootRef) {
  // Using public folder path
  fetch(process.env.PUBLIC_URL + "/map.svg")
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load SVG map");
      return res.text();
    })
    .then((svgText) => {
      if (svgRootRef.current) {
        svgRootRef.current.innerHTML = svgText;
      }
    })
    .catch((err) => console.error("Error loading map:", err));
}

export function zoomMap(
  svgRootRef,
  mapContainerRef,
  scaleFactor,
  focalPoint = null
) {
  const oldScale = mapScale;
  mapScale = Math.max(0.5, Math.min(3, mapScale * scaleFactor));

  if (focalPoint && svgRootRef.current && mapContainerRef.current) {
    const rect = mapContainerRef.current.getBoundingClientRect();
    const containerX = focalPoint.x - rect.left;
    const containerY = focalPoint.y - rect.top;

    mapPan.x =
      containerX / mapScale -
      (containerX / oldScale - mapPan.x) * (mapScale / oldScale);
    mapPan.y =
      containerY / mapScale -
      (containerY / oldScale - mapPan.y) * (mapScale / oldScale);
  }

  if (svgRootRef.current) {
    svgRootRef.current.style.transition = "transform 0.2s ease-out";
    svgRootRef.current.style.transform = `scale(${mapScale}) translate(${mapPan.x}px, ${mapPan.y}px)`;
  }
}

export function toggleFullscreen(fullscreenBtnRef) {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.error(`Error attempting fullscreen: ${err.message}`);
    });
    if (fullscreenBtnRef?.current) {
      fullscreenBtnRef.current.innerHTML = '<i class="fas fa-compress"></i>';
    }
    isFullscreen = true;
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      if (fullscreenBtnRef?.current) {
        fullscreenBtnRef.current.innerHTML = '<i class="fas fa-expand"></i>';
      }
      isFullscreen = false;
    }
  }
}

export function setCurrentPosition(lat, lng) {
  currentPosition = { lat, lng };
}

export function getCurrentPosition() {
  return currentPosition;
}
