/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import Map, { Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// 📍 1. พิกัดร้าน ลำพูหมูกระทะ (ถ้ำพรรณรา)
const SHOP_LAT = 8.301677;
const SHOP_LNG = 99.365736;

// 💰 2. ตั้งค่าโซนระยะทางและราคา
const ZONE_1_MAX = 1.3; // ไม่เกิน 2 กม. (ส่งฟรี)
const ZONE_2_MAX = 9.0; // เกิน 2 แต่ไม่เกิน 9 กม. (10 บาท)
const ZONE_3_MAX = 10.0; // 🔴 วงสีแดง ไม่เกิน 12 กม. (20 บาท สำหรับนัดรับเท่านั้น)

// 🧮 3. ฟังก์ชันคำนวณระยะทางเส้นตรง (Haversine Formula)
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371; // รัศมีโลก (กม.)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// 🌐 4. ฟังก์ชันสร้างรูปวงกลม GeoJSON
const generateCircleGeoJSON = (
  centerLng: number,
  centerLat: number,
  radiusInKm: number,
) => {
  const points = 64;
  const coords = [];
  const distanceX =
    radiusInKm / (111.32 * Math.cos((centerLat * Math.PI) / 180));
  const distanceY = radiusInKm / 110.574;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([centerLng + x, centerLat + y]);
  }
  coords.push(coords[0]);

  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [coords],
    },
  } as any;
};

interface SelectMapsProps {
  onLocationConfirm: (lat: number, lng: number, fee: number, distance: number, isMeetup: boolean) => void;
}

const SelectMaps = ({ onLocationConfirm }: SelectMapsProps) => {
  const [viewState, setViewState] = useState({
    longitude: 99.365736,
    latitude: 8.301677,
    zoom: 15
  });

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  // 🎯 1. State เช็กว่าลูกค้าติ๊กเลือกนัดรับออเดอร์หรือไม่
  const [isMeetupMode, setIsMeetupMode] = useState(false);

  // ดึงตำแหน่ง GPS ของลูกค้าเมื่อเปิดหน้าเว็บครั้งแรก
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setViewState({
            longitude: position.coords.longitude,
            latitude: position.coords.latitude,
            zoom: 15,
          });
          setIsLoadingLocation(false);
        },
        () => {
          setIsLoadingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 5000 },
      );
    } else {
      setIsLoadingLocation(false);
    }
  }, []);

  // คำนวณระยะทางจริงจากร้านถึงจุดกึ่งกลางหน้าจอ
  const distanceFromShop = calculateDistance(
    SHOP_LAT,
    SHOP_LNG,
    viewState.latitude,
    viewState.longitude,
  );

  // 💵 2. ปรับ Logic เงื่อนไขจัดส่งปกติ vs นัดรับ
  let deliveryFee = 0;
  let isDeliverable: boolean;
  let isMeetup = false; 
  let zoneName: string;

  if (!isMeetupMode) {
    // 🛵 กรณีไม่ได้ติ๊ก Checkbox (จัดส่งปกติ) ตัดที่ 9 กิโลเมตร
    isMeetup = false;
    if (distanceFromShop <= ZONE_1_MAX) {
      deliveryFee = 0;
      zoneName = "โซนใกล้ร้าน 🟢";
      isDeliverable = true;
    } else if (distanceFromShop <= ZONE_2_MAX) {
      deliveryFee = 10;
      zoneName = "โซนรอบนอก 🟡";
      isDeliverable = true;
    } else {
      // 🚫 เกิน 9 กิโลเมตร (จัดส่งปกติ) บล็อกปุ่มทันที
      deliveryFee = 0;
      zoneName = "อยู่นอกพื้นที่จัดส่ง 🚫";
      isDeliverable = false; 
    }
  } else {
    // 🤝 กรณีติ๊ก Checkbox "นัดรับออเดอร์" ขยายระยะเป็น 12 กิโลเมตร
    isMeetup = true;
    if (distanceFromShop <= ZONE_1_MAX) {
      deliveryFee = 0;
      zoneName = "จุดนัดรับโซนใกล้ 🟢";
      isDeliverable = true;
    } else if (distanceFromShop <= ZONE_2_MAX) {
      deliveryFee = 10;
      zoneName = "จุดนัดรับโซนสีส้ม 🟡";
      isDeliverable = true;
    } else if (distanceFromShop <= ZONE_3_MAX) {
      // ✨ อยู่ในระยะวงแดง (ไม่เกิน 12 กิโลเมตร) คิด 20 บาท
      deliveryFee = 20;
      zoneName = "จุดนัดรับโซนสีแดง 🔴";
      isDeliverable = true;
    } else {
      // 🚫 เกิน 12 กิโลเมตร บล็อกปุ่มทันที
      deliveryFee = 0;
      zoneName = "เกินขอบเขตนัดรับ 🚫";
      isDeliverable = false;
    }
  }

  // สร้างข้อมูลวงกลมแต่ละโซน
  const zone3Circle = generateCircleGeoJSON(SHOP_LNG, SHOP_LAT, ZONE_3_MAX);
  const zone2Circle = generateCircleGeoJSON(SHOP_LNG, SHOP_LAT, ZONE_2_MAX);
  const zone1Circle = generateCircleGeoJSON(SHOP_LNG, SHOP_LAT, ZONE_1_MAX);

  return (
    <div className="flex flex-col h-full overflow-hidden text-slate-800 font-sans">
      {/* แถบหัวเว็บ */}
      <div className="p-4 bg-emerald-500 text-white text-center font-bold text-xl z-20 shadow-md">
        Lampu Moo Krata Delivery 🥓
      </div>

      {/* พื้นที่แสดงแผนที่ */}
      <div className="flex-1 relative w-full h-full">
        <Map
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          mapStyle="mapbox://styles/janos2001/cmq4te5bc007c01s3f63xa5ll"
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
          style={{ width: "100%", height: "100%" }}
          onLoad={() => setIsMapLoaded(true)}
        >
          {isMapLoaded && (
            <>
              {/* ✨ ชั้นที่ 3: วงนอกสุด (สีแดงอ่อน 12 กม.) ซ่อน/แสดงตาม Checkbox นัดรับ */}
              {isMeetupMode && (
                <Source id="zone3-source" type="geojson" data={zone3Circle}>
                  <Layer
                    id="zone3-layer"
                    type="fill"
                    paint={{
                      "fill-color": "#ef4444",
                      "fill-opacity": 0.06,
                      "fill-outline-color": "#ef4444",
                    }}
                  />
                </Source>
              )}

              {/* ชั้นที่ 2: วงกลาง (สีเหลือง/ส้มอ่อน 9 กม.) แสดงตลอด */}
              <Source id="zone2-source" type="geojson" data={zone2Circle}>
                <Layer
                  id="zone2-layer"
                  type="fill"
                  paint={{
                    "fill-color": "#f59e0b",
                    "fill-opacity": 0.1,
                    "fill-outline-color": "#f59e0b",
                  }}
                />
              </Source>

              {/* ชั้นที่ 1: วงในสุด (สีเขียวอ่อน 1.3 กม.) แสดงตลอด */}
              <Source id="zone1-source" type="geojson" data={zone1Circle}>
                <Layer
                  id="zone1-layer"
                  type="fill"
                  paint={{
                    "fill-color": "#10b981",
                    "fill-opacity": 0.12,
                    "fill-outline-color": "#10b981",
                  }}
                />
              </Source>
            </>
          )}
        </Map>

        {/* หมุด📍 ตรึงแน่นกึ่งกลางหน้าจอ */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full pointer-events-none z-10 text-4xl filter drop-shadow-md">
          📍
        </div>

        {/* ป้ายบอกตำแหน่งร้าน */}
        <div className="absolute top-4 right-4 bg-white px-3 py-2 rounded-lg shadow-md font-semibold text-xs z-10 border border-orange-100 flex items-center gap-1">
          <span className="text-sm">🏠</span> ร้านลำพูหมูกระทะ
        </div>

        {/* หน้าจอกำลังโหลดตำแหน่งตอนเปิดเว็บครั้งแรก */}
        {isLoadingLocation && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-30">
            <div className="bg-white px-6 py-4 rounded-xl shadow-lg font-bold flex items-center gap-3">
              <span className="animate-spin text-orange-500">⏳</span>{" "}
              กำลังค้นหาตำแหน่งของคุณ...
            </div>
          </div>
        )}
      </div>

      {/* 📊 บอร์ดวิเคราะห์ระยะทางและตั้งค่าด้านล่าง */}
      <div className="p-5 bg-white shadow-xl z-20 relative border-t border-slate-100 rounded-t-2xl">
        
        {/* 🎯 3. Checkbox สำหรับเลือกนัดรับ */}
        <div className="flex items-center mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <input
            type="checkbox"
            id="meetup-checkbox"
            checked={isMeetupMode}
            onChange={(e) => setIsMeetupMode(e.target.checked)}
            className="w-5 h-5 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
          />
          <label 
            htmlFor="meetup-checkbox" 
            className="ml-3 text-sm font-bold text-slate-700 cursor-pointer select-none"
          >
            🤝 นัดรับออเดอร์ในโซนสีแดง (เกิน 9 กม.) คิดค่าส่ง 20 บาท
          </label>
        </div>

        {/* ป้ายบอกสถานะโซนปัจจุบัน */}
        <div className="mb-3">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              !isDeliverable
                ? "bg-red-100 text-red-600 animate-pulse" // กระพริบเตือนถ้านอกเขต
                : isMeetupMode && distanceFromShop > ZONE_2_MAX
                  ? "bg-red-100 text-red-700" // สีแดงสำหรับจุดนัดรับ 9-12 กิโล
                  : isMeetupMode
                    ? "bg-blue-100 text-blue-700" 
                    : deliveryFee === 0
                      ? "bg-green-100 text-green-700"
                      : "bg-orange-100 text-orange-700"
            }`}
          >
            {zoneName}
          </span>
        </div>

        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-400 font-medium">
              {isMeetupMode ? "ระยะทางจากร้าน" : "ระยะทางจัดส่ง"}
            </p>
            <p className="text-xl font-extrabold text-slate-700">
              {distanceFromShop.toFixed(2)}{" "}
              <span className="text-sm font-normal text-slate-500">กม.</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-medium">
              {isMeetupMode ? "ค่าบริการ" : "ค่าบริการจัดส่งต่อชุด"}
            </p>
            <p
              className={`text-2xl font-black ${
                !isDeliverable
                  ? "text-red-500 text-lg"
                  : isMeetupMode && distanceFromShop > ZONE_2_MAX
                    ? "text-red-600"
                    : isMeetupMode
                      ? "text-blue-600"
                      : deliveryFee === 0
                        ? "text-green-600"
                        : "text-orange-600"
              }`}
            >
              {!isDeliverable 
                ? "ไม่อยู่ในพื้นที่บริการ" 
                : deliveryFee === 0
                  ? "ส่งฟรี 🎉"
                  : `${deliveryFee} บาท`}
            </p>
          </div>
        </div>

        {/* 🚫 4. ปุ่มกดยืนยันออเดอร์ */}
        <button
          disabled={!isDeliverable}
          className={`w-full py-3.5 rounded-xl font-bold text-lg transition-all shadow-md transform active:scale-[0.98] ${
            isDeliverable
              ? isMeetupMode
                ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                : "bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
              : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
          }`}
          onClick={() => {
            onLocationConfirm(viewState.latitude, viewState.longitude, deliveryFee, distanceFromShop, isMeetup);
            alert(`📍 บันทึกพิกัดและราคาเข้าสู่ระบบสำเร็จ!`);
          }}
        >
          {isDeliverable 
            ? isMeetupMode
              ? `ยืนยันจุดนัดรับ (ค่าบริการ ${deliveryFee}.-)`
              : `ยืนยันตำแหน่งนี้ (ค่าส่ง ${deliveryFee}.-)`
            : isMeetupMode 
              ? "❌ เกินขอบเขตนัดรับ 12 กม. (กรุณาขยับหมุด)"
              : "❌ นอกเขตส่ง 9 กม. (กรุณาขยับหมุด หรือติ๊กนัดรับ)"}
        </button>
      </div>
    </div>
  );
};

export default SelectMaps;