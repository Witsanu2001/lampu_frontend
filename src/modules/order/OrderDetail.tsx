/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/modules/order/OrderDetail.tsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

// 🌟 นำเข้า Mapbox และ Turf.js สำหรับแสดงแผนที่
import Map, { Marker, Source, Layer } from "react-map-gl";
import turfCircle from "@turf/circle";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Order } from "../const/order";
import { getOrderById, updateStatus } from "../api/api_order";
import { getRiders } from "../api/api_user";

// 🌟 กำหนดพิกัดร้าน
const SHOP_LAT = 8.301677;
const SHOP_LNG = 99.365736;

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [riders, setRiders] = useState<any[]>([]);
  const [selectedRiderId, setSelectedRiderId] = useState<string>("");

  // 🌟 State สำหรับแผนที่และ Modal
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [viewState, setViewState] = useState({
    latitude: SHOP_LAT,
    longitude: SHOP_LNG,
    zoom: 10,
  });

  // 🌟 State สำหรับเส้นทางและระยะทาง
  const [routeData, setRouteData] = useState<any>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError("Order ID not found");
        setLoading(false);
        return;
      }

      try {
        // ✨ 2. ลบ fetch โค้ดยาวๆ ออกให้หมด แล้วเรียกใช้ getOrderById แทน!
        const data = await getOrderById(orderId);

        // 3. ตอนนี้ data คือตัวออเดอร์เพียวๆ แล้ว สามารถ setOrder ได้เลย
        setOrder(data);

        // ถ้ามีพิกัดลูกค้า ให้เซ็ตจุดศูนย์กลางแผนที่
        if (data.shipping?.location?.lat && data.shipping?.location?.lng) {
          setViewState({
            latitude: (SHOP_LAT + data.shipping.location.lat) / 2,
            longitude: (SHOP_LNG + data.shipping.location.lng) / 2,
            zoom: 11,
          });
        }
      } catch (err: any) {
        setError(err.message || "Failed to load order details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  // 🌟 ดึงข้อมูลเส้นทาง (Route) จาก Mapbox Directions API เมื่อเปิด Modal แผนที่
  // 🌟 ดึงข้อมูลเส้นทาง (Route) จาก Mapbox Directions API เมื่อเปิด Modal แผนที่
  useEffect(() => {
    if (isMapModalOpen && order?.shipping?.location) {
      const fetchRoute = async () => {
        try {
          const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
          const start = `${SHOP_LNG},${SHOP_LAT}`;
          const end = `${order.shipping.location.lng},${order.shipping.location.lat}`;

          // ✨ 1. เพิ่ม &overview=full เพื่อให้ได้เส้นทางแบบความละเอียดสูงสุด (โค้งตามถนนเป๊ะๆ)
          const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start};${end}?geometries=geojson&overview=full&access_token=${mapboxToken}`;

          const response = await fetch(url);
          const data = await response.json();

          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];

            // ✨ 2. ห่อข้อมูลให้อยู่ในรูปแบบ GeoJSON Feature ที่สมบูรณ์
            setRouteData({
              type: "Feature",
              properties: {},
              geometry: route.geometry,
            });

            setRouteDistance(route.distance / 1000); // ระยะทางที่ได้มาเป็นเมตร หาร 1000 ให้เป็นกิโลเมตร
          }
        } catch (error) {
          console.error("Error fetching route:", error);
        }
      };

      fetchRoute();
    }
  }, [isMapModalOpen, order?.shipping?.location]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 🌟 ฟังก์ชันสร้างวงกลมรัศมีจากร้าน
  const getZoneCircles = () => {
    const center = [SHOP_LNG, SHOP_LAT];
    const options = { steps: 64, units: "kilometers" as const };
    return {
      zone1: turfCircle(center, 1.3, options),
      zone2: turfCircle(center, 9, options),
      zone3: turfCircle(center, 12, options),
    };
  };

  const zones = getZoneCircles();

  const handleConfirmOrder = async () => {
    if (!orderId) return;
    try {
      const successMessage = await updateStatus(orderId, "preparing");
      alert(successMessage);
      setOrder((prev) => (prev ? { ...prev, status: "preparing" } : prev));
    } catch (error: any) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    }
  };

  const openRiderModal = async () => {
    try {
      const riderList = await getRiders();
      setRiders(riderList);
      setIsModalOpen(true);
    } catch (err: any) {
      alert("ไม่สามารถดึงรายชื่อไรเดอร์ได้");
    }
  };

  const handleStartOrder = async () => {
    if (!selectedRiderId) {
      alert("กรุณาเลือกไรเดอร์ก่อนครับ");
      return;
    }

    if (!orderId) return;
    try {
      const successMessage = await updateStatus(
        orderId,
        "ready",
        selectedRiderId,
      );

      alert(successMessage);
      setOrder((prev) => (prev ? { ...prev, status: "ready" } : prev));
      setIsModalOpen(false);
    } catch (error: any) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    }
  };

  const handleRefuseOrder = async () => {
    if (!orderId) return;
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธออเดอร์นี้?")) return;
    try {
      const successMessage = await updateStatus(orderId, "refuse");
      alert(successMessage);
      // อัปเดตข้อมูลบนหน้าจอให้เป็น refuse ทันที
      setOrder((prev) => (prev ? { ...prev, status: "refuse" } : prev));
    } catch (error: any) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="h-full p-6 w-full overflow-y-auto bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="h-full p-6 w-full overflow-y-auto bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <p className="text-red-500">{error || "Order not found"}</p>
          <button
            onClick={() => navigate("/orders")}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            กลับไปหน้ารายการออเดอร์
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-6 w-full overflow-y-auto bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 relative">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/orders")}
          className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 mb-3"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          กลับไปหน้ารายการออเดอร์
        </button>
        <h1 className="text-xl font-bold">รายละเอียดออเดอร์</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          เลขที่ออเดอร์: {order.id}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {formatDate(order.created_at)}
        </p>
      </div>

      <div className="space-y-4">
        {/* Main Items */}
        <div className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm p-4">
          <h2 className="font-semibold mb-3 text-orange-600 dark:text-orange-400">
            รายการหลัก
          </h2>
          <div className="space-y-2">
            {order.mainItems?.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-600 last:border-0"
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ฿{item.price?.toLocaleString()} x {item.quantity}
                  </p>
                </div>
                <span className="font-bold">
                  ฿{item.subtotal?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Add-on Items */}
        {order.addOnItems?.length > 0 && (
          <div className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm p-4">
            <h2 className="font-semibold mb-3 text-orange-600 dark:text-orange-400">
              รายการเพิ่มเติม
            </h2>
            <div className="space-y-2">
              {order.addOnItems.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-600 last:border-0"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ฿{item.price?.toLocaleString()} x {item.quantity}
                    </p>
                  </div>
                  <span className="font-bold">
                    ฿{item.subtotal?.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Equipment */}
        <div className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm p-4">
          <h2 className="font-semibold mb-3 text-orange-600 dark:text-orange-400">
            อุปกรณ์
          </h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">เตา:</span>
              <span>{order.equipment?.stoveCount} ชุด</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">กระทะ:</span>
              <span>{order.equipment?.panCount} ใบ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">ถ่าน:</span>
              <span>{order.equipment?.charcoalCount} ก้อน</span>
            </div>
            {order.equipment?.extraStoves > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  เตาเพิ่ม:
                </span>
                <span>{order.equipment.extraStoves} ชุด</span>
              </div>
            )}
            {order.equipment?.extraPans > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  กระทะเพิ่ม:
                </span>
                <span>{order.equipment.extraPans} ใบ</span>
              </div>
            )}
          </div>
        </div>

        {/* 🌟 Shipping (ปรับให้มีปุ่มดูสถานที่) */}
        <div className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-orange-600 dark:text-orange-400">
              ที่อยู่จัดส่ง
            </h2>
            {order.shipping?.location?.lat && order.shipping?.location?.lng && (
              <button
                onClick={() => setIsMapModalOpen(true)}
                className="text-xs px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg font-medium transition-colors flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                ดูสถานที่ส่ง
              </button>
            )}
          </div>
          <p className="text-sm">{order.shipping?.address}</p>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            <p>ค่าส่ง: ฿{order.shipping?.totalFee?.toLocaleString()}</p>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm p-4">
          <h2 className="font-semibold mb-3 text-orange-600 dark:text-orange-400">
            การชำระเงิน
          </h2>
          <div className="mb-3">
            <p className="text-sm">
              วิธีชำระเงิน:{" "}
              <span className="font-medium">
                {order.payment?.method === "promptpay"
                  ? "พร้อมเพย์"
                  : order.payment?.method}
              </span>
            </p>
          </div>

          {/* Payment Slip */}
          {order.payment?.hasSlip && order.slip_url && (
            <div>
              <p className="text-sm font-medium mb-2">สลิปการโอนเงิน:</p>
              <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-2 flex justify-center">
                <img
                  src={order.slip_url}
                  alt="Payment Slip"
                  className="w-full max-h-80 object-contain rounded"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.png";
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Home Image */}
        {order.home_image_url && (
          <div className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm p-4">
            <h2 className="font-semibold mb-3 text-orange-600 dark:text-orange-400">
              รูปบ้านลูกค้า
            </h2>
            {/* เปลี่ยน className ของ div และ img ด้านล่างนี้ครับ */}
            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-2 flex justify-center">
              <img
                src={order.home_image_url}
                alt="Home Image"
                // ✨ แก้ไขบรรทัดนี้เช่นกันครับ
                className="w-full max-h-80 object-contain rounded"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.png";
                }}
              />
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm p-4">
          <h2 className="font-semibold mb-3 text-orange-600 dark:text-orange-400">
            สรุปยอดชำระ
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                ยอดรายการหลัก:
              </span>
              <span>฿{order.totals?.cartTotal?.toLocaleString()}</span>
            </div>
            {order.totals?.addOnTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  ยอดรายการเพิ่มเติม:
                </span>
                <span>฿{order.totals.addOnTotal.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">ค่าส่ง:</span>
              <span>฿{order.totals?.shippingFee?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
              <span className="font-bold">ยอดรวมทั้งหมด:</span>
              <span className="font-bold text-lg text-orange-600 dark:text-orange-400">
                ฿{order.totals?.grandTotal?.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 pb-8">
          {order.status == "new" && (
            <button
              onClick={handleRefuseOrder}
              className="flex-1 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-xl font-bold transition-colors shadow-sm"
            >
              ❌ ปฏิเสธ
            </button>
          )}
          {order.status == "preparing" ? (
            <button
              onClick={openRiderModal}
              className="flex-[2] py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-sm transition-colors"
            >
              ✅ พร้อมส่ง
            </button>
          ) : order.status == "preparing" ? (
            <button
              onClick={openRiderModal}
              className="flex-[2] py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-sm transition-colors"
            >
              เลือกไรเดอร์และเริ่มงาน
            </button>
          ) : order.status == "ready" ? (
            <></>
          ) : (
            <button
              onClick={handleConfirmOrder}
              className="flex-[2] py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-sm transition-colors"
            >
              ✅ รับออเดอร์
            </button>
          )}
        </div>
      </div>

      {/* 🌟 Modal สำหรับแสดงแผนที่ */}
      {isMapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col h-[80vh] animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
              <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-orange-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                สถานที่จัดส่ง
              </h3>
              <button
                onClick={() => setIsMapModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-full transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body (Map) */}
            <div className="flex-1 relative bg-gray-100 dark:bg-gray-800">
              <Map
                {...viewState}
                onMove={(evt) => setViewState(evt.viewState)}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
                style={{ width: "100%", height: "100%" }}
              >
                <Source id="zone3-source" type="geojson" data={zones.zone3}>
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
                <Source id="zone2-source" type="geojson" data={zones.zone2}>
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
                <Source id="zone1-source" type="geojson" data={zones.zone1}>
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

                {/* 🌟 แสดงเส้นทาง (Route) ระหว่างร้านกับลูกค้า */}
                {routeData && (
                  <Source id="route-source" type="geojson" data={routeData}>
                    <Layer
                      id="route-layer"
                      type="line"
                      paint={{
                        "line-color": "#3b82f6", // สีเส้นทาง (ฟ้า)
                        "line-width": 5, // ความหนาเส้น
                        "line-opacity": 0.8,
                      }}
                      layout={{
                        "line-cap": "round",
                        "line-join": "round",
                      }}
                    />
                  </Source>
                )}

                {/* Marker: ตำแหน่งร้าน (สีส้ม) */}
                <Marker
                  longitude={SHOP_LNG}
                  latitude={SHOP_LAT}
                  anchor="bottom"
                >
                  <div className="relative flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-transform origin-bottom">
                    {/* วงกลมด้านบน */}
                    <div className="bg-orange-500 rounded-full w-10 h-10 flex items-center justify-center shadow-md border-2 border-white z-10">
                      <span className="text-xl">🥘</span>{" "}
                      {/* ไอคอนกระทะ/ของกิน */}
                    </div>
                    {/* ติ่งหมุดสามเหลี่ยมชี้ลง */}
                    <div className="w-3 h-3 bg-orange-500 rotate-45 -mt-2 border-b-2 border-r-2 border-white shadow-sm rounded-sm"></div>
                  </div>
                </Marker>

                {order.shipping?.location && (
                  <Marker
                    longitude={order.shipping.location.lng}
                    latitude={order.shipping.location.lat}
                    anchor="bottom"
                  >
                    <div className="relative flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-transform origin-bottom">
                      {/* วงกลมด้านบน */}
                      <div className="bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center shadow-md border-2 border-white z-10">
                        {/* ไอคอนแผนที่ Location */}
                        <svg
                          className="w-5 h-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                      </div>
                      {/* ติ่งหมุดสามเหลี่ยมชี้ลง */}
                      <div className="w-3 h-3 bg-blue-600 rotate-45 -mt-2 border-b-2 border-r-2 border-white shadow-sm rounded-sm"></div>
                    </div>
                  </Marker>
                )}
              </Map>
            </div>

            {/* Modal Footer (สรุปที่อยู่และระยะทาง) */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row justify-between gap-2">
                <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                  <span className="font-bold text-gray-900 dark:text-white">
                    ที่อยู่จัดส่ง:
                  </span>{" "}
                  {order.shipping?.address}
                </p>
                {/* 🌟 แสดงระยะทาง */}
                {routeDistance !== null && (
                  <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg flex items-center justify-center whitespace-nowrap">
                    🚗 ระยะทาง: {routeDistance.toFixed(2)} กม.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">เลือกไรเดอร์</h2>

            <div className="space-y-2 mb-6">
              {riders.map((rider) => (
                <label
                  key={rider.uid}
                  className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-100 rounded"
                >
                  <input
                    type="radio"
                    name="rider"
                    value={rider.uid}
                    checked={selectedRiderId === rider.uid}
                    onChange={(e) => setSelectedRiderId(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span>{rider.name || rider.email}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleStartOrder}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                เริ่มงาน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
