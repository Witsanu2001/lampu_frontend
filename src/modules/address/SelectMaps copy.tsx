/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import Map, { Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// 📍 1. พิกัดร้าน ลำพูหมูกระทะ (ทุ่งใหญ่)
const SHOP_LAT = 8.300893140259126;
const SHOP_LNG = 99.36760271084832;

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
  onLocationConfirm: (
    lat: number,
    lng: number,
    fee: number,
    distance: number,
    isMeetup: boolean,
    addressName: string // ✨ รับ parameter ชื่อที่อยู่
  ) => void;
}

const SelectMaps = ({ onLocationConfirm }: SelectMapsProps) => {
  const [viewState, setViewState] = useState({
    longitude: SHOP_LNG,
    latitude: SHOP_LAT,
    zoom: 15,
  });

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  // 🎯 1. State เช็กว่าลูกค้าติ๊กเลือกนัดรับออเดอร์หรือไม่
  const [isMeetupMode, setIsMeetupMode] = useState(false);

  // ✨ State สำหรับเก็บชื่อที่อยู่/ตำบล
  const [mapAddressName, setMapAddressName] = useState<string>("กำลังดึงข้อมูลที่อยู่...");
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);

  
  const fetchAddressName = async (lng: number, lat: number) => {
    setIsFetchingAddress(true);
    try {
      const token = import.meta.env.VITE_MAPBOX_TOKEN;

      // 🎯 1. ยิง API 2 ตัวพร้อมกัน: หา POI (สถานที่สำคัญ) และ หาข้อมูลที่อยู่
      const [poiResponse, addressResponse] = await Promise.all([
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&language=th&types=poi&limit=1`),
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&language=th&types=address,neighborhood,locality,place,region&limit=1`)
      ]);

      const poiData = await poiResponse.json();
      const addressData = await addressResponse.json();

      let nearestPOI = "";
      // ถ้าพบสถานที่สำคัญ (โรงพยาบาล, วัด, ปั๊ม) ที่อยู่ใกล้ๆ
      if (poiData.features && poiData.features.length > 0) {
        nearestPOI = poiData.features[0].text_th || poiData.features[0].text;
      }

      let soi = "";
      let village = "";
      let locality = ""; // ตำบล
      let place = "";    // อำเภอ
      let region = "";   // จังหวัด

      if (addressData.features && addressData.features.length > 0) {
        const f = addressData.features[0];
        
        // 🎯 1.1 สร้างฟังก์ชันช่วยคัดกรอง: ❌ ตัดถนนทิ้ง, ✅ เก็บซอย, ✅ เก็บหมู่บ้าน
        const analyzeText = (type: string, text: string) => {
          if (!text) return;
          const lower = text.toLowerCase();
          
          // 🚫 ข้ามทันทีถ้ามีคำว่า "ถนน", "road", หรือ "rd"
          if (lower.includes('ถนน') || lower.includes('road') || lower.match(/\brd\b/)) {
            return;
          }

          // ✅ ถ้ามีคำว่า "ซอย" หรือ "soi" ให้เก็บใส่ตัวแปรซอย
          if (lower.includes('ซอย') || lower.includes('soi')) {
            if (!soi) soi = text;
          } 
          // ✅ ถ้าไม่ใช่ซอยและไม่ใช่ถนน ให้เก็บเป็นหมู่บ้าน/ชุมชน
          else if (type.includes('neighborhood') || type.includes('address')) {
            if (!village) village = text;
          }
        };

        // สแกนข้อความหลัก
        analyzeText(f.id, f.text_th || f.text);

        // สแกนข้อความแวดล้อม (ตำบล อำเภอ ถนน ซอย)
        if (f.context) {
          f.context.forEach((c: any) => {
            const cText = c.text_th || c.text;
            analyzeText(c.id, cText); // โยนไปคัดกรองซอย/ถนน/หมู่บ้าน
            
            if (c.id.includes('locality')) locality = cText;
            if (c.id.includes('place')) place = cText;
            if (c.id.includes('region')) region = cText;
          });
        }
        
        // เผื่อกรณีที่ตัวหมุดตรงกับตำบล/อำเภอพอดี
        if (f.id.includes('locality') && !locality) locality = f.text_th || f.text;
        if (f.id.includes('place') && !place) place = f.text_th || f.text;
        if (f.id.includes('region') && !region) region = f.text_th || f.text;
      }

      // 🎯 2. ประกอบร่างข้อความ
      const parts = [];

      // 📍 ใส่สถานที่สำคัญ 
      if (nearestPOI) parts.push(`ใกล้${nearestPOI}`); 
      
      // 📍 ใส่ "ซอย" (ถ้ามี)
      if (soi && soi !== nearestPOI) parts.push(soi);

      // 📍 ใส่ "ชื่อชุมชน/หมู่บ้าน" (ถ้ามี และไม่ซ้ำกับซอย/POI)
      if (village && village !== nearestPOI && village !== soi) parts.push(village);

      // 📍 ใส่ตำบล (เติม ต. ให้ถ้ายังไม่มี)
      if (locality) {
        const lText = locality.startsWith('ต.') || locality.startsWith('ตำบล') ? locality : `ต.${locality}`;
        parts.push(lText);
      }
      
      // 📍 ใส่อำเภอ (เติม อ. ให้ถ้ายังไม่มี)
      if (place) {
        const pText = place.startsWith('อ.') || place.startsWith('อำเภอ') ? place : `อ.${place}`;
        parts.push(pText);
      }
      
      // 📍 ใส่จังหวัด (ตัดคำว่า "จังหวัด" หรือ "จ." ทิ้ง)
      if (region) {
        const cleanRegion = region.replace(/จังหวัด|จ\./g, '').trim();
        if (cleanRegion) parts.push(cleanRegion);
      }

      let finalAddress = parts.join(' ');

      // 🎯 3. คลีนข้อความให้สวยงาม และแปลงภาษาอังกฤษเป็นไทย
      finalAddress = finalAddress
        .replace(/Tha Yang/gi, 'ท่ายาง')
        .replace(/Thung Sang/gi, 'ทุ่งสัง')
        .replace(/Prik/gi, 'ปริก')
        .replace(/Kurae/gi, 'กุแหระ')
        .replace(/Sin Pun/gi, 'สินปุน')
        .replace(/Khok Han/gi, 'โคกหาร')
        .replace(/Tambon\s/gi, 'ต.')
        .replace(/Amphoe\s/gi, 'อ.')
        .replace(/Chang Wat\s/gi, '')
        .replace(/Province\s/gi, '')
        .replace(/Mueang\s/gi, 'เมือง')
        .replace(/Ban\s/gi, 'บ้าน')
        .replace(/Soi\s/gi, 'ซอย ') // ✨ เผื่อ Mapbox ส่งคำว่า Soi มา
        .replace(/Thailand|ประเทศไทย|[0-9]{5}/g, '')
        .replace(/\b\d{4}\b/g, '')
        .replace(/,\s*/g, ' ')
        .replace(/\s+/g, ' ') // ลบช่องว่างที่ซ้ำซ้อน
        .trim();

      if (!finalAddress) {
         finalAddress = "ระบุพื้นที่ไม่ได้ (กรุณาพิมพ์ที่อยู่เอง)";
      }

      setMapAddressName(finalAddress);

    } catch (error) {
      console.error("Error fetching address:", error);
      setMapAddressName("เกิดข้อผิดพลาดในการดึงข้อมูลที่อยู่");
    } finally {
      setIsFetchingAddress(false);
    }
  };

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
          fetchAddressName(position.coords.longitude, position.coords.latitude);
        },
        () => {
          setIsLoadingLocation(false);
          fetchAddressName(SHOP_LNG, SHOP_LAT);
        },
        { enableHighAccuracy: true, timeout: 5000 },
      );
    } else {
      setIsLoadingLocation(false);
      fetchAddressName(SHOP_LNG, SHOP_LAT);
    }
  }, []);

  const distanceFromShop = calculateDistance(SHOP_LAT, SHOP_LNG, viewState.latitude, viewState.longitude);

  // 💵 2. ปรับ Logic เงื่อนไขจัดส่งปกติ vs นัดรับ
  let deliveryFee = 0;
  let isDeliverable: boolean;
  let isMeetup = false;
  let zoneName: string;

  if (!isMeetupMode) {
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
      deliveryFee = 0;
      zoneName = "อยู่นอกพื้นที่จัดส่ง 🚫";
      isDeliverable = false;
    }
  } else {
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
      deliveryFee = 20;
      zoneName = "จุดนัดรับโซนสีแดง 🔴";
      isDeliverable = true;
    } else {
      deliveryFee = 0;
      zoneName = "เกินขอบเขตนัดรับ 🚫";
      isDeliverable = false;
    }
  }

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
          onMoveEnd={(evt) => fetchAddressName(evt.viewState.longitude, evt.viewState.latitude)}
          mapStyle="mapbox://styles/janos2001/cmq4te5bc007c01s3f63xa5ll"
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
          style={{ width: "100%", height: "100%" }}
          onLoad={() => setIsMapLoaded(true)}
        >
          {isMapLoaded && (
            <>
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
        <div className="absolute top-4 right-4 bg-white px-3 py-2 rounded-lg shadow-md font-semibold text-xs z-10 border border-emerald-100 flex items-center gap-1">
          <span className="text-sm">🏠</span> ร้านลำพูหมูกระทะ
        </div>

        {/* หน้าจอกำลังโหลดตำแหน่งตอนเปิดเว็บครั้งแรก */}
        {isLoadingLocation && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-30">
            <div className="bg-white px-6 py-4 rounded-xl shadow-lg font-bold flex items-center gap-3">
              <span className="animate-spin text-emerald-500">⏳</span>{" "}
              กำลังค้นหาตำแหน่งของคุณ...
            </div>
          </div>
        )}
      </div>

      {/* 📊 บอร์ดวิเคราะห์ระยะทางและตั้งค่าด้านล่าง */}
      <div className="p-5 bg-white shadow-xl z-20 relative border-t border-slate-100 rounded-t-2xl">
        
        {/* 🎯 3. Checkbox สำหรับเลือกนัดรับ */}
        <div className="flex items-center mb-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
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

        {/* ✨ กล่องแสดงชื่อพื้นที่ */}
        <div className="mb-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
          <p className="text-xs text-emerald-600 font-bold mb-1">📍 ตำแหน่งจัดส่ง/นัดรับ:</p>
          <p className="text-sm text-slate-700 line-clamp-2">
            {isFetchingAddress ? (
              <span className="animate-pulse text-slate-400">กำลังระบุพื้นที่...</span>
            ) : (
              mapAddressName
            )}
          </p>
        </div>

        {/* ป้ายบอกสถานะโซนปัจจุบัน */}
        <div className="mb-3">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              !isDeliverable
                ? "bg-red-100 text-red-600 animate-pulse" 
                : isMeetupMode && distanceFromShop > ZONE_2_MAX
                  ? "bg-red-100 text-red-700" 
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
            onLocationConfirm(
              viewState.latitude,
              viewState.longitude,
              deliveryFee,
              distanceFromShop,
              isMeetup, 
              mapAddressName 
            );
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