/* eslint-disable @typescript-eslint/no-explicit-any */
// src/modules/order/OrderDetail.tsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

// 🌟 นำเข้า Mapbox และ Turf.js สำหรับแสดงแผนที่
import Map, { Marker, Source, Layer } from "react-map-gl";
import turfCircle from "@turf/circle";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Order } from "../const/order";
import { cancelOrder, getOrderById, updateStatus } from "../api/api_order";

// 🌟 กำหนดพิกัดร้าน
const SHOP_LAT = 8.301677;
const SHOP_LNG = 99.365736;

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [viewState, setViewState] = useState({
    latitude: SHOP_LAT,
    longitude: SHOP_LNG,
    zoom: 10,
  });
  const [routeData, setRouteData] = useState<any>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);

  const [isRefuseModalOpen, setIsRefuseModalOpen] = useState(false);
  const [refuseReason, setRefuseReason] = useState("การชำระเงินไม่ถูกต้อง");
  const [customReason, setCustomReason] = useState("");

  // ✨ State สำหรับ Loading ตอนส่ง API
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✨ State สำหรับ Custom Popup แจ้งเตือน (แทน alert)
  const [popup, setPopup] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "warning";
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  // ✨ ฟังก์ชันเรียกใช้ Popup
  const showPopup = (
    type: "success" | "error" | "warning",
    title: string,
    message: string,
    onConfirm?: () => void,
  ) => {
    setPopup({ isOpen: true, type, title, message, onConfirm });
  };

  // ✨ ฟังก์ชันปิด Popup
  const closePopup = () => {
    if (popup.onConfirm) {
      popup.onConfirm();
    }
    setPopup((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError("Order ID not found");
        setLoading(false);
        return;
      }

      try {
        const data = await getOrderById(orderId);
        setOrder(data);

        // ถ้ามีพิกัดลูกค้า ให้เซ็ตจุดศูนย์กลางแผนที่
        if (data?.shipping?.location?.lat && data?.shipping?.location?.lng) {
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

  useEffect(() => {
    if (isMapModalOpen && order?.shipping?.location) {
      const fetchRoute = async () => {
        try {
          const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
          const start = `${SHOP_LNG},${SHOP_LAT}`;
          const end = `${order.shipping.location.lng},${order.shipping.location.lat}`;

          const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start};${end}?geometries=geojson&overview=full&access_token=${mapboxToken}`;

          const response = await fetch(url);
          const data = await response.json();

          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];

            setRouteData({
              type: "Feature",
              properties: {},
              geometry: route.geometry,
            });

            setRouteDistance(route.distance / 1000);
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

  // ✨ ปรับปรุงปุ่มรับออเดอร์
  const handleConfirmOrder = async () => {
    if (!orderId) return;

    setIsSubmitting(true); // เริ่ม Loading
    try {
      const successMessage = await updateStatus(orderId, "preparing");
      setOrder((prev) => (prev ? { ...prev, status: "preparing" } : prev));

      // แสดง Popup สำเร็จ และเมื่อกดปิดให้กลับไปหน้ารายการ
      showPopup("success", "รับออเดอร์สำเร็จ", successMessage, () => {
        navigate("/orders");
      });
    } catch (error: any) {
      showPopup("error", "เกิดข้อผิดพลาด", error.message);
    } finally {
      setIsSubmitting(false); // ปิด Loading
    }
  };

  const handleRefuseOrder = () => {
    setIsRefuseModalOpen(true);
  };

  // ✨ ปรับปรุงปุ่มยืนยันการปฏิเสธ
  const submitRefuseOrder = async () => {
    if (!orderId) return;

    const finalReason = refuseReason === "อื่นๆ" ? customReason : refuseReason;

    if (refuseReason === "อื่นๆ" && !customReason.trim()) {
      showPopup("warning", "ข้อมูลไม่ครบถ้วน", "กรุณาระบุเหตุผล");
      return;
    }

    const userDataString = localStorage.getItem("userData");
    const userData = userDataString ? JSON.parse(userDataString) : null;
    const currentUserId = userData?.uid;

    if (!currentUserId) {
      showPopup(
        "error",
        "ข้อผิดพลาด",
        "ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่อีกครั้ง",
      );
      return;
    }

    setIsSubmitting(true); // เริ่ม Loading
    try {
      const successMessage = await cancelOrder(
        orderId,
        finalReason,
        currentUserId,
      );

      // ✨ แก้ไข Syntax ตรงนี้ให้ถูกต้อง
      setOrder((prev) => (prev ? { ...prev, status: "refuse" } : prev));
      setIsRefuseModalOpen(false);

      // แสดง Popup สำเร็จ
      showPopup(
        "success",
        "ปฏิเสธออเดอร์สำเร็จ",
        `${successMessage}\n(บันทึกเหตุผล: ${finalReason})`,
      );
    } catch (error: any) {
      showPopup("error", "เกิดข้อผิดพลาด", error.message);
    } finally {
      setIsSubmitting(false); // ปิด Loading
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
          className="flex items-center text-2xl text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 mb-3"
        >
          <svg
            className="w-6 h-6 mt-1"
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
          รายละเอียดออเดอร์
        </button>

        <div className="flex flex-wrap w-full items-center justify-between gap-x-4 gap-y-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap">
            เลขที่ออเดอร์: {order.id}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap">
            {formatDate(order.created_at)}
          </p>
        </div>
      </div>

      {/* 🌟 แจ้งเตือนแอดมิน หากเป็นออเดอร์ที่ถูกส่งสลิปมาใหม่ */}
      {order.status === "edit" && (
        <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-xl p-4 flex items-start gap-3">
          <svg
            className="w-6 h-6 text-yellow-600 dark:text-yellow-500 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="font-bold text-yellow-800 dark:text-yellow-400">
              ออเดอร์นี้มีการแก้ไขสลิป
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              ลูกค้าได้ทำการอัปโหลดสลิปการโอนเงินมาใหม่
              กรุณาตรวจสอบสลิปใบใหม่และกดยืนยันออเดอร์
            </p>
          </div>
        </div>
      )}

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

        {/* Shipping */}
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
                  : "เก็บเงินปลายทาง"}
              </span>
            </p>
          </div>

          {/* Payment Slip */}
          {order.payment?.hasSlip && order.slip_url && (
            <div>
              <p className="text-sm font-medium mb-2">
                {order.status === "edit"
                  ? "✨ สลิปการโอนเงิน (อัปโหลดใหม่ล่าสุด):"
                  : "สลิปการโอนเงิน:"}
              </p>
              <div
                className={`rounded-lg overflow-hidden border p-2 flex justify-center ${order.status === "edit" ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"}`}
              >
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

          {/* 🌟 แสดงสลิปเดิมที่เคยถูกปฏิเสธให้แอดมินเทียบ */}
          {order.old_slip_url && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <p className="text-sm font-medium mb-2 text-red-500 dark:text-red-400">
                ❌ สลิปเดิมที่ถูกปฏิเสธ:
              </p>
              <div className="rounded-lg overflow-hidden border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-2 flex justify-center">
                <img
                  src={order.old_slip_url}
                  alt="Old Rejected Slip"
                  className="w-full max-h-64 object-contain rounded opacity-75 grayscale-[30%] hover:grayscale-0 hover:opacity-100 transition-all"
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
            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-2 flex justify-center">
              <img
                src={order.home_image_url}
                alt="Home Image"
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

        {/* 🌟 แสดงปุ่มเมื่อสถานะเป็น "new" (ออเดอร์ใหม่) หรือ "edit" (แก้สลิปใหม่) */}
        {(order.status === "new" || order.status === "edit") && (
          <div className="flex gap-3 pt-4 pb-8">
            <button
              onClick={handleRefuseOrder}
              disabled={isSubmitting}
              className="flex-1 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-xl font-bold transition-colors shadow-sm disabled:opacity-50"
            >
              ❌ ปฏิเสธ
            </button>
            <button
              onClick={handleConfirmOrder}
              disabled={isSubmitting}
              className="flex-[2] py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-sm transition-colors disabled:opacity-50"
            >
              ✅ รับออเดอร์
            </button>
          </div>
        )}
      </div>

      {/* 🌟 Modal สำหรับแสดงแผนที่ */}
      {isMapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col h-[80vh] animate-in fade-in zoom-in duration-200">
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

                {routeData && (
                  <Source id="route-source" type="geojson" data={routeData}>
                    <Layer
                      id="route-layer"
                      type="line"
                      paint={{
                        "line-color": "#3b82f6",
                        "line-width": 5,
                        "line-opacity": 0.8,
                      }}
                      layout={{ "line-cap": "round", "line-join": "round" }}
                    />
                  </Source>
                )}

                <Marker
                  longitude={SHOP_LNG}
                  latitude={SHOP_LAT}
                  anchor="bottom"
                >
                  <div className="relative flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-transform origin-bottom">
                    <div className="bg-orange-500 rounded-full w-10 h-10 flex items-center justify-center shadow-md border-2 border-white z-10">
                      <span className="text-xl">🥘</span>
                    </div>
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
                      <div className="bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center shadow-md border-2 border-white z-10">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                      </div>
                      <div className="w-3 h-3 bg-blue-600 rotate-45 -mt-2 border-b-2 border-r-2 border-white shadow-sm rounded-sm"></div>
                    </div>
                  </Marker>
                )}
              </Map>
            </div>

            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row justify-between gap-2">
                <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                  <span className="font-bold text-gray-900 dark:text-white">
                    ที่อยู่จัดส่ง:
                  </span>{" "}
                  {order.shipping?.address}
                </p>
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

      {/* 🌟 Modal สำหรับปฏิเสธออเดอร์ */}
      {isRefuseModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>❌</span> เหตุผลที่ปฏิเสธออเดอร์
              </h3>

              <div className="space-y-3 text-gray-700 dark:text-gray-300">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value="การชำระเงินไม่ถูกต้อง"
                    checked={refuseReason === "การชำระเงินไม่ถูกต้อง"}
                    onChange={(e) => setRefuseReason(e.target.value)}
                    className="w-4 h-4 text-red-600"
                  />
                  <span>การชำระเงินไม่ถูกต้อง / สลิปปลอม</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value="อยู่นอกพื้นที่ให้บริการ"
                    checked={refuseReason === "อยู่นอกพื้นที่ให้บริการ"}
                    onChange={(e) => setRefuseReason(e.target.value)}
                    className="w-4 h-4 text-red-600"
                  />
                  <span>อยู่นอกพื้นที่ให้บริการ</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value="สินค้าหมด / วัตถุดิบไม่พอ"
                    checked={refuseReason === "สินค้าหมด / วัตถุดิบไม่พอ"}
                    onChange={(e) => setRefuseReason(e.target.value)}
                    className="w-4 h-4 text-red-600"
                  />
                  <span>สินค้าหมด / วัตถุดิบไม่พอ</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value="อื่นๆ"
                    checked={refuseReason === "อื่นๆ"}
                    onChange={(e) => setRefuseReason(e.target.value)}
                    className="w-4 h-4 text-red-600"
                  />
                  <span>อื่นๆ (โปรดระบุ)</span>
                </label>

                {refuseReason === "อื่นๆ" && (
                  <textarea
                    placeholder="พิมพ์เหตุผลที่นี่..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full mt-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={3}
                  />
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsRefuseModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={submitRefuseOrder}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  ยืนยันการปฏิเสธ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✨ Overlay Loading (แสดงตอนกดยืนยัน/ปฏิเสธ) */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl flex flex-col items-center shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 font-bold text-gray-800 dark:text-white">
              กำลังดำเนินการ...
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              กรุณารอสักครู่
            </p>
          </div>
        </div>
      )}

      {/* ✨ Custom Popup Modal (แสดงผลลัพธ์แทน alert) */}
      {popup.isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 text-center">
            <div className="p-6">
              {/* Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                {popup.type === "success" && (
                  <svg
                    className="h-10 w-10 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
                {popup.type === "error" && (
                  <svg
                    className="h-10 w-10 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
                {popup.type === "warning" && (
                  <svg
                    className="h-10 w-10 text-orange-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                )}
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {popup.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line text-sm">
                {popup.message}
              </p>

              <button
                onClick={closePopup}
                className={`mt-6 w-full py-2.5 px-4 rounded-xl font-bold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  popup.type === "success"
                    ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                    : popup.type === "error"
                      ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                      : "bg-orange-500 hover:bg-orange-600 focus:ring-orange-500"
                }`}
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
