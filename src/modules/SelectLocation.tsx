import { useState } from 'react';
import Map from 'react-map-gl'; // ไม่ต้องใช้ Marker แล้ว
import 'mapbox-gl/dist/mapbox-gl.css'; 

const SelectLocation = () => {
  // ตั้งค่ามุมกล้องเริ่มต้น (สลับพิกัด Lat/Lng ให้ถูกต้องแล้วครับ)
  const [viewState, setViewState] = useState({
    longitude: 99.365736, // ลองจิจูด (เส้นแกน X ประเทศไทยจะอยู่ประมาณ 99-105)
    latitude: 8.301677,   // ละติจูด (เส้นแกน Y ภาคใต้จะอยู่ประมาณ 7-9)
    zoom: 15 // ซูมใกล้ขึ้นให้เห็นถนนชัดๆ
  });

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 bg-orange-500 text-white text-center font-bold text-xl z-20 shadow-md">
        Lampu Moo Krata Delivery 🥓
      </div>

      <div className="flex-1 relative">
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)} // ให้แผนที่อัปเดตพิกัดตามการเลื่อน
          mapStyle="mapbox://styles/janos2001/cmq4te5bc007c01s3f63xa5ll" // ธีมที่คุณออกแบบไว้
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN} 
          style={{ width: '100%', height: '100%' }}
        />
        
        {/* 📍 หมุดปักกึ่งกลางหน้าจอ ลอยอยู่กับที่ตลอดเวลา (Grab Style) */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full pointer-events-none z-10 text-5xl filter drop-shadow-md pb-1">
          📍
        </div>
      </div>

      <div className="p-4 bg-white shadow-md z-10 relative">
        <button 
          className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-orange-700 transition-colors shadow-md active:scale-[0.98] transform"
          onClick={() => alert(`ยืนยันจัดส่งที่พิกัด:\nLat: ${viewState.latitude.toFixed(6)}\nLng: ${viewState.longitude.toFixed(6)}`)}
        >
          ยืนยันตำแหน่งจัดส่ง
        </button>
      </div>
    </div>
  );
};

export default SelectLocation;