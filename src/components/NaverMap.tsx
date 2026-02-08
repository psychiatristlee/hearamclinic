"use client";

import { useEffect, useRef } from "react";

const CLINIC_LAT = 37.5575;
const CLINIC_LNG = 126.9252;
const CLINIC_NAME = "해람정신건강의학과";

declare global {
  interface Window {
    naver: typeof naver;
  }
}

export default function NaverMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID;
    if (!clientId) return;

    function initMap() {
      if (!mapRef.current || mapInstanceRef.current) return;

      const position = new window.naver.maps.LatLng(CLINIC_LAT, CLINIC_LNG);

      const map = new window.naver.maps.Map(mapRef.current, {
        center: position,
        zoom: 16,
        zoomControl: true,
        zoomControlOptions: {
          position: window.naver.maps.Position.TOP_RIGHT,
        },
      });

      const marker = new window.naver.maps.Marker({
        position,
        map,
      });

      const infoWindow = new window.naver.maps.InfoWindow({
        content: `<div style="padding:10px;font-size:13px;font-weight:600;">${CLINIC_NAME}</div>`,
      });

      window.naver.maps.Event.addListener(marker, "click", () => {
        if (infoWindow.getMap()) {
          infoWindow.close();
        } else {
          infoWindow.open(map, marker);
        }
      });

      mapInstanceRef.current = map;
    }

    // 이미 로드된 경우
    if (window.naver?.maps) {
      initMap();
      return;
    }

    // 스크립트 로드
    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
    script.async = true;
    script.onload = () => initMap();
    document.head.appendChild(script);

    return () => {
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div
      ref={mapRef}
      className="w-full h-[300px] rounded-xl"
    />
  );
}
