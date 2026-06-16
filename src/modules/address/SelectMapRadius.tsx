/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import Map, { Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const SHOP_LAT = 8.300893140259126;
const SHOP_LNG = 99.36760271084832;
const FREE_RADIUS_KM = 1.8;

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

const generateCircleGeoJSON = (centerLng: number, centerLat: number, radiusInKm: number) => {
  const points = 64; 
  const coords = [];
  const distanceX = radiusInKm / (111.32 * Math.cos(centerLat * Math.PI / 180));
  const distanceY = radiusInKm / 110.574;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([centerLng + x, centerLat + y]);
  }
  coords.push(coords[0]); 

  return {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'Polygon' as const,
      coordinates: [coords]
    }
  };
};

export const SelectMapRadius = () => {
  const [viewState, setViewState] = useState({
    longitude: SHOP_LNG,
    latitude: SHOP_LAT,
    zoom: 14
  });

  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  
  // ✨ [NEW] 1. เพิ่ม State สำหรับเก็บชื่อที่อยู่/ตำบล
  const [addressName, setAddressName] = useState<string>("กำลังดึงข้อมูลที่อยู่...");
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);

  // ✨ [NEW] 2. สร้างฟังก์ชัน Reverse Geocoding เพื่อดึงชื่อที่อยู่จาก Mapbox API
  const fetchAddressName = async (lng: number, lat: number) => {
    setIsFetchingAddress(true);
    try {
      const token = import.meta.env.VITE_MAPBOX_TOKEN;
      // เรียก API โดยระบุ language=th เพื่อขอข้อมูลเป็นภาษาไทย
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&language=th&types=poi,address,neighborhood,locality,place`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        // ดึงชื่อสถานที่ที่ตรงกับพิกัดมากที่สุด (มักจะเป็น index 0)
        setAddressName(data.features[0].place_name_th || data.features[0].place_name);
      } else {
        setAddressName("ไม่พบข้อมูลพื้นที่ในบริเวณนี้");
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      setAddressName("เกิดข้อผิดพลาดในการดึงข้อมูลที่อยู่");
    } finally {
      setIsFetchingAddress(false);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setViewState({
            longitude: position.coords.longitude,
            latitude: position.coords.latitude,
            zoom: 15
          });
          setIsLoadingLocation(false);
          // ✨ [NEW] ดึงชื่อที่อยู่เมื่อได้ตำแหน่งเริ่มต้นจาก GPS
          fetchAddressName(position.coords.longitude, position.coords.latitude);
        },
        () => {
          setIsLoadingLocation(false); 
          // ✨ [NEW] ดึงชื่อที่อยู่หน้าร้าน (กรณีลูกค้าไม่เปิด GPS)
          fetchAddressName(SHOP_LNG, SHOP_LAT);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setIsLoadingLocation(false);
      fetchAddressName(SHOP_LNG, SHOP_LAT);
    }
  }, []);

  const distanceFromShop = calculateDistance(
    SHOP_LAT,
    SHOP_LNG,
    viewState.latitude,
    viewState.longitude
  );

  const isOverRadius = distanceFromShop > FREE_RADIUS_KM;
  const deliveryFee = isOverRadius ? 10 : 0;
  const circleData = generateCircleGeoJSON(SHOP_LNG, SHOP_LAT, FREE_RADIUS_KM);

  const layerStyle: any = {
    id: 'circle-layer',
    type: 'fill',
    paint: {
      'fill-color': '#ff7a00',
      'fill-opacity': 0.15, 
      'fill-outline-color': '#ff5100'
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden text-slate-800">
      <div className="p-4 bg-orange-500 text-white text-center font-bold text-xl z-20 shadow-md">
        Lampu Moo Krata Delivery 🥓
      </div>

      <div className="flex-1 relative w-full h-full">
        <Map
          {...viewState}
          // onMove คืออัปเดตพิกัดให้หมุดเคลื่อนตามนิ้วแบบเรียลไทม์
          onMove={evt => setViewState(evt.viewState)}
          // ✨ [NEW] 3. onMoveEnd คือจังหวะที่ลูกค้า "ปล่อยนิ้ว" เลื่อนแผนที่เสร็จแล้ว ค่อยยิง API
          onMoveEnd={evt => fetchAddressName(evt.viewState.longitude, evt.viewState.latitude)}
          mapStyle="mapbox://styles/janos2001/cmq4te5bc007c01s3f63xa5ll" 
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
        >
          <Source id="shop-radius" type="geojson" data={circleData}>
            <Layer {...layerStyle} />
          </Source>
        </Map>

        {/* หมุดปักกึ่งกลางหน้าจอ */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full pointer-events-none z-10 text-4xl filter drop-shadow-md">
          📍
        </div>

        <div className="absolute top-4 right-4 bg-white px-3 py-2 rounded-lg shadow-md font-semibold text-xs z-10 border border-orange-100 flex items-center gap-1">
          <span className="text-sm">🏠</span> ที่ตั้งร้าน ลำพูหมูกระทะ
        </div>

        {isLoadingLocation && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-30">
            <div className="bg-white px-6 py-4 rounded-xl shadow-lg font-bold flex items-center gap-3">
              <span className="animate-spin text-orange-500">⏳</span> กำลังค้นหาตำแหน่งของคุณ...
            </div>
          </div>
        )}
      </div>

      {/* 📊 ส่วนแสดงผลวิเคราะห์ราคาและกิโลเมตรด้านล่าง */}
      <div className="p-5 bg-white shadow-xl z-20 relative border-t border-slate-100 rounded-t-2xl">
        
        {/* ✨ [NEW] 4. แสดงชื่อตำบล / ที่อยู่ ที่ดึงมาได้ */}
        <div className="mb-4 p-3 bg-orange-50 rounded-xl border border-orange-100">
          <p className="text-xs text-orange-600 font-bold mb-1">📍 ตำแหน่งจัดส่ง:</p>
          <p className="text-sm text-slate-700 line-clamp-2">
            {isFetchingAddress ? (
              <span className="animate-pulse text-slate-400">กำลังระบุพื้นที่...</span>
            ) : (
              addressName
            )}
          </p>
        </div>

        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-400 font-medium">ระยะทางจากร้าน</p>
            <p className="text-lg font-bold text-slate-700">
              {distanceFromShop.toFixed(2)} <span className="text-sm font-normal">กม.</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-medium">ค่าบริการจัดส่ง</p>
            <p className={`text-xl font-extrabold ${deliveryFee === 0 ? 'text-green-600' : 'text-orange-600'}`}>
              {deliveryFee === 0 ? 'ส่งฟรี 🎉' : `${deliveryFee} บาท`}
            </p>
          </div>
        </div>

        <button 
          className="w-full bg-orange-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-orange-700 transition-colors shadow-md active:scale-[0.98] transform"
          onClick={() => {
            alert(
              `บันทึกออเดอร์สำเร็จ!\n` +
              `• พิกัด: ${viewState.latitude.toFixed(6)}, ${viewState.longitude.toFixed(6)}\n` +
              `• พื้นที่: ${addressName}\n` +
              `• ระยะทาง: ${distanceFromShop.toFixed(2)} กม.\n` +
              `• ค่าส่ง: ${deliveryFee} บาท`
            );
          }}
        >
          ยืนยันตำแหน่งนี้ (ค่าส่ง {deliveryFee === 0 ? '0' : deliveryFee}.-)
        </button>
      </div>
    </div>
  );
};