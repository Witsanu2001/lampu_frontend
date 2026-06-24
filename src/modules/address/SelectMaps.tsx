/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import Map, { Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { DEFAULT_DELIVERY_FEE, DEFAULT_MEET_UP_FEE, DEFAULT_SHOP_LATL, DEFAULT_SHOP_LNGL, DEFAULT_ZONE_FEE_10, DEFAULT_ZONE_FEE_20, DEFAULT_ZONE_FREE } from "../../shared/const/config";

// 📍 1. พิกัดร้าน ลำพูหมูกระทะ
const SHOP_LAT = DEFAULT_SHOP_LATL
const SHOP_LNG = DEFAULT_SHOP_LNGL

const ZONE_1_MAX = DEFAULT_ZONE_FREE
const ZONE_2_MAX = DEFAULT_ZONE_FEE_10
const ZONE_3_MAX = DEFAULT_ZONE_FEE_20

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371;
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

// 🌟 เพิ่ม isMeetup เข้ามาใน Props เพื่อรับค่าจากหน้า Address
interface SelectMapsProps {
  onLocationConfirm: (
    lat: number,
    lng: number,
    fee: number,
    distance: number,
    isMeetup: boolean,
  ) => void;
  isMeetup: boolean; 
}

export default function SelectMaps({ onLocationConfirm, isMeetup }: SelectMapsProps) {
  const [viewState, setViewState] = useState({
    latitude: SHOP_LAT,
    longitude: SHOP_LNG,
    zoom: 13,
  });

  const [distanceFromShop, setDistanceFromShop] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [isDeliverable, setIsDeliverable] = useState(true);

  // 🎯 อัปเดตการคำนวณราคาโดยอิงจาก isMeetup ที่ส่งมาจาก Props
  useEffect(() => {
    const dist = calculateDistance(
      SHOP_LAT,
      SHOP_LNG,
      viewState.latitude,
      viewState.longitude,
    );
    setDistanceFromShop(dist);

    let fee = 0;
    let deliverable = false;

    if (dist <= ZONE_1_MAX) {
      fee = 0;
      deliverable = true;
    } else if (dist <= ZONE_2_MAX) {
      fee = DEFAULT_DELIVERY_FEE;
      deliverable = true;
    } else if (dist <= ZONE_3_MAX && isMeetup) {
      fee = DEFAULT_MEET_UP_FEE;
      deliverable = true;
    }

    setDeliveryFee(fee);
    setIsDeliverable(deliverable);
  }, [viewState.latitude, viewState.longitude, isMeetup]);

  const createCircleFeature = (
    center: [number, number],
    radiusInKm: number,
    points = 64,
  ) => {
    const coords = [];
    const distanceX = radiusInKm / (111.32 * Math.cos((center[1] * Math.PI) / 180));
    const distanceY = radiusInKm / 110.574;

    for (let i = 0; i < points; i++) {
      const theta = (i / points) * (2 * Math.PI);
      const x = distanceX * Math.cos(theta);
      const y = distanceY * Math.sin(theta);
      coords.push([center[0] + x, center[1] + y]);
    }
    coords.push(coords[0]);

    return {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [coords] },
      properties: {},
    };
  };

  const zone1Data = createCircleFeature([SHOP_LNG, SHOP_LAT], ZONE_1_MAX) as any;
  const zone2Data = createCircleFeature([SHOP_LNG, SHOP_LAT], ZONE_2_MAX) as any;
  const zone3Data = createCircleFeature([SHOP_LNG, SHOP_LAT], ZONE_3_MAX) as any;

  return (
    <div className="w-full h-full flex flex-col relative bg-gray-50 dark:bg-gray-900">
      {/* 🗺️ 1. แผนที่หลัก */}
      <div className="flex-1 relative">
        <Map
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
          style={{ width: "100%", height: "100%" }}
        >
          {/* โซน 3: นัดรับ (ถ้า isMeetup เปิดอยู่ถึงจะแสดง) */}
          {isMeetup && (
            <Source id="zone3" type="geojson" data={zone3Data}>
              <Layer
                id="zone3-fill"
                type="fill"
                paint={{ "fill-color": "#ef4444", "fill-opacity": 0.08 }}
              />
              <Layer
                id="zone3-line"
                type="line"
                paint={{
                  "line-color": "#ef4444",
                  "line-width": 2,
                  "line-dasharray": [2, 2],
                }}
              />
            </Source>
          )}

          {/* โซน 2: ส่งฟรี / เสียค่าส่ง */}
          <Source id="zone2" type="geojson" data={zone2Data}>
            <Layer
              id="zone2-fill"
              type="fill"
              paint={{ "fill-color": "#f59e0b", "fill-opacity": 0.1 }}
            />
            <Layer
              id="zone2-line"
              type="line"
              paint={{ "line-color": "#f59e0b", "line-width": 2 }}
            />
          </Source>

          {/* โซน 1: ส่งฟรี */}
          <Source id="zone1" type="geojson" data={zone1Data}>
            <Layer
              id="zone1-fill"
              type="fill"
              paint={{ "fill-color": "#10b981", "fill-opacity": 0.15 }}
            />
            <Layer
              id="zone1-line"
              type="line"
              paint={{ "line-color": "#10b981", "line-width": 2 }}
            />
          </Source>
        </Map>

        {/* 📌 หมุดจุดศูนย์กลางแผนที่ (ตำแหน่งปัจจุบันที่จะเลือก) */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center -translate-y-6 drop-shadow-xl z-10">
          <div className="bg-blue-600 text-white px-3 py-1 rounded-full font-bold text-sm mb-1 shadow-md animate-bounce">
            {isMeetup ? "🤝 จุดนัดรับ" : "📍 จัดส่งที่นี่"}
          </div>
          <svg className="w-10 h-10 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        </div>
      </div>

      {/* 📦 2. แถบสรุปข้อมูลด้านล่างสุด */}
      <div className="bg-white dark:bg-gray-800 p-5 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] rounded-t-3xl z-20">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">ระยะทางจากร้าน</p>
            <p className="text-xl font-bold text-gray-800 dark:text-white">
              {distanceFromShop.toFixed(2)} <span className="text-sm">กม.</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">ค่าบริการ / ค่าส่ง</p>
            <p className={`text-xl font-bold ${!isDeliverable ? "text-red-500" : deliveryFee === 0 ? "text-emerald-500" : "text-orange-500"}`}>
              {!isDeliverable
                ? "ไม่อยู่ในพื้นที่บริการ"
                : deliveryFee === 0
                  ? "ส่งฟรี 🎉"
                  : `${deliveryFee} บาท`}
            </p>
          </div>
        </div>

        {/* 🚀 ปุ่มกดยืนยันพิกัด */}
        <button
          disabled={!isDeliverable}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-md transform active:scale-[0.98] ${
            isDeliverable
              ? isMeetup
                ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                : "bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
              : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
          }`}
          onClick={() => {
            onLocationConfirm(
              viewState.latitude,
              viewState.longitude,
              deliveryFee,
              distanceFromShop,
              isMeetup,
            );
          }}
        >
          {isDeliverable
            ? isMeetup
              ? `ยืนยันจุดนัดรับ (ค่าบริการ ${deliveryFee}.-)`
              : `ยืนยันตำแหน่งนี้ (ค่าส่ง ${deliveryFee}.-)`
            : isMeetup
              ? "จุดนัดรับอยู่นอกพื้นที่"
              : "อยู่นอกพื้นที่จัดส่ง (เกิน 9 กม.)"}
        </button>
      </div>
    </div>
  );
}