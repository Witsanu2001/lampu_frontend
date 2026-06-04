/* eslint-disable react-hooks/static-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useRef, useMemo, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// --- แก้ปัญหา Leaflet ไม่แสดงรูปไอคอนหมุดเริ่มต้น ---
const markerIcon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

interface SelectLocationProps {
  onLocationConfirm?: (lat: number, lng: number) => void;
}

function SelectLocation({ onLocationConfirm }: SelectLocationProps) {
  const defaultCenter = { lat: 13.7563, lng: 100.5018 }; // กรุงเทพฯ (เผื่อไว้เป็นค่าเริ่มต้น)
  const [position, setPosition] = useState(defaultCenter);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // ฟังก์ชันสำหรับเรียกพิกัด GPS ของเครื่อง
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("บราวเซอร์ของคุณไม่รองรับการดึงตำแหน่งปัจจุบัน");
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition({ lat: latitude, lng: longitude });
        setLoadingLocation(false);
      },
      (err) => {
        console.error(err);
        alert("ไม่สามารถดึงตำแหน่งได้ กรุณาเปิดสิทธิ์เข้าถึง GPS หรือเลือกปักหมุดเองบนแผนที่");
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ดึงตำแหน่งปัจจุบันให้ทันทีที่เปิดหน้านี้ขึ้นมา
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // 🌟 Component พิเศษสำหรับบังคับให้แผนที่เลื่อนหน้าจอตามหมุด (ย้ายตามค่า position)
  const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
    const map = useMap();
    useEffect(() => {
      map.setView([lat, lng], 16); // ย่อขยายแผนที่เข้าไปใกล้ระดับ 16 เมื่อได้ตำแหน่งปัจจุบัน
    }, [lat, lng, map]);
    return null;
  };

  // ตรวจจับการกระทำบนแผนที่
  const LocationMarker = () => {
    const markerRef = useRef<any>(null);

    useMapEvents({
      click(e) {
        setPosition(e.latlng);
      },
    });

    const eventHandlers = useMemo(
      () => ({
        dragend() {
          const marker = markerRef.current;
          if (marker != null) {
            setPosition(marker.getLatLng());
          }
        },
      }),
      []
    );

    return (
      <Marker
        draggable={true}
        eventHandlers={eventHandlers}
        position={position}
        ref={markerRef}
        icon={markerIcon}
      />
    );
  };

  const handleConfirm = () => {
    if (onLocationConfirm) {
      onLocationConfirm(position.lat, position.lng);
    } else {
      alert(`พิกัดที่เลือก: Latitude ${position.lat.toFixed(5)}, Longitude ${position.lng.toFixed(5)}`);
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ background: "var(--bg, #ffffff)", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", border: "1px solid var(--border, #e5e7eb)" }}>
        
        <h2 style={{ marginTop: "0", marginBottom: "8px", textAlign: "center", color: "var(--text-h, #1f2937)" }}>
          📍 ปักหมุดสถานที่จัดส่ง
        </h2>
        <p style={{ textAlign: "center", fontSize: "14px", color: "var(--text, #6b7280)", marginBottom: "16px" }}>
          ขยับหมุดให้ตรงกับตำแหน่งบ้านของคุณ
        </p>

        {/* ปุ่มกดสำหรับดึงตำแหน่งใหม่ */}
        <button
          onClick={getCurrentLocation}
          disabled={loadingLocation}
          style={{
            width: "100%",
            padding: "10px",
            background: "#4285F4",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "bold",
            cursor: "pointer",
            marginBottom: "12px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "6px"
          }}
        >
          {loadingLocation ? "⏳ กำลังค้นหาตำแหน่ง..." : "🎯 ดึงตำแหน่งปัจจุบันของฉัน"}
        </button>

        {/* กรอบแผนที่ */}
        <div style={{ height: "350px", width: "100%", borderRadius: "8px", overflow: "hidden", border: "2px solid #e5e7eb", marginBottom: "20px", zIndex: 0 }}>
          <MapContainer 
            center={defaultCenter} 
            zoom={13} 
            scrollWheelZoom={true} 
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker />
            {/* เรียกใช้คอมโพเนนต์ย่อยเพื่อบังคับเลื่อนกล้องแผนที่ */}
            <RecenterMap lat={position.lat} lng={position.lng} />
          </MapContainer>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", background: "#f3f4f6", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", color: "#4b5563" }}>
          <div><strong>Lat:</strong> {position.lat.toFixed(5)}</div>
          <div><strong>Lng:</strong> {position.lng.toFixed(5)}</div>
        </div>

        <button
          onClick={handleConfirm}
          style={{
            width: "100%",
            padding: "14px",
            background: "#06C755",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(6, 199, 85, 0.3)"
          }}
        >
          ยืนยันตำแหน่งนี้
        </button>

      </div>
    </div>
  );
}

export default SelectLocation;