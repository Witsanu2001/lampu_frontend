/* eslint-disable @typescript-eslint/no-explicit-any */
// src/modules/order/OrderDetail.tsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Order } from "../const/order";
import { getOrderById } from "../api/api_order";
import { getFreshToken } from "../../shared/infra/auth/token";

export default function HistoryOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // 🌟 State สำหรับอัปโหลดสลิปใหม่
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      } catch (err: any) {
        setError(err.message || "Failed to load order details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

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

  // 🌟 ฟังก์ชันจัดการเมื่อเลือกรูปสลิป
  const handleSlipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSlipPreview(URL.createObjectURL(file));
      setSlipFile(file);
    }
  };

  // 🌟 ฟังก์ชันกดส่งสลิปใหม่
  const handleResubmitSlip = async () => {
    if (!slipFile || !orderId) return;

    setIsSubmitting(true);
    try {
      // สร้าง FormData
      const formData = new FormData();
      formData.append("slip", slipFile);

      // ยิง API
      const token = await getFreshToken();
      const response = await fetch(
        `http://localhost:8080/api/orders/orders_put/${orderId}/edit_slip`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            // ❌ ไม่ต้องใส่ "Content-Type": "application/json" เพราะ fetch จะจัดการ boundary ของ FormData ให้เอง
          },
          body: formData,
        },
      );

      const data = await response.json();
      if (!data.success) throw new Error(data.message);

      alert("อัปโหลดสลิปใหม่สำเร็จ ร้านกำลังตรวจสอบใหม่อีกครั้งครับ");

      setSlipPreview(null);
      setSlipFile(null);
      navigate("/orders_user");
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message || "ไม่สามารถอัปโหลดสลิปได้"}`);
    } finally {
      setIsSubmitting(false);
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

  // เงื่อนไขตรวจสอบว่าต้องโชว์ UI ให้อัปสลิปใหม่หรือไม่
  const isRejectedPayment =
    order.status === "refuse" &&
    order.cancel_reason === "การชำระเงินไม่ถูกต้อง";

  return (
    <div className="h-full p-6 w-full overflow-y-auto bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 relative">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/listData/history")}
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

          {/* ซ่อนสลิปปกติถ้าโดนปฏิเสธเรื่องสลิป เพื่อเอาไปโชว์ในกล่องแดงแทน */}
          {order.payment?.hasSlip && order.slip_url && !isRejectedPayment && (
            <div>
              <p className="text-sm font-medium mb-2">
                สลิปการโอนเงิน (ล่าสุด):
              </p>
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

          {/* 🌟 แสดงประวัติสลิปเดิมที่เคยถูกปฏิเสธ (ถ้ามีข้อมูลใน old_slip_url) */}
          {order.old_slip_url && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <p className="text-sm font-medium mb-2 text-gray-500 dark:text-gray-400">
                🕒 ประวัติสลิปเดิมที่เคยถูกปฏิเสธ:
              </p>
              <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 flex justify-center">
                <img
                  src={order.old_slip_url}
                  alt="Old Rejected Slip"
                  className="w-full max-h-64 object-contain rounded opacity-70 grayscale-[30%] hover:grayscale-0 hover:opacity-100 transition-all"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.png";
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 🌟 🌟 กล่องแดง: อัปโหลดสลิปใหม่ + แสดงสลิปที่ถูกปฏิเสธ 🌟 🌟 */}
        {isRejectedPayment && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-300 dark:border-red-800 shadow-sm p-5 animate-in fade-in zoom-in duration-300">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-full text-red-600 dark:text-red-400">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-red-700 dark:text-red-400">
                  ออเดอร์ถูกปฏิเสธ
                </h2>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  เนื่องจาก: การชำระเงินไม่ถูกต้อง / รูปสลิปไม่ชัดเจน
                  <br />
                  กรุณาตรวจสอบสลิปเดิมและอัปโหลดสลิปใบใหม่เพื่อให้ร้านตรวจสอบอีกครั้ง
                </p>
              </div>
            </div>

            {/* 🌟 แสดงสลิปที่เพิ่งถูกปฏิเสธ (ดึงมาจาก slip_url ปัจจุบัน) */}
            {order.slip_url && (
              <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl p-3 border border-red-200 dark:border-red-800/50">
                <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1.5">
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  สลิปที่ถูกปฏิเสธ:
                </p>
                <div className="rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 flex justify-center p-2">
                  <img
                    src={order.slip_url}
                    alt="Rejected Slip"
                    className="w-full max-h-64 object-contain rounded opacity-90 hover:opacity-100 transition-opacity"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.png";
                    }}
                  />
                </div>
              </div>
            )}

            {/* 🌟 ส่วนอัปโหลดรูปสลิปใบใหม่ */}
            <div className="w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-red-300 dark:border-red-700 bg-white dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-8 h-8 mb-2 text-red-400 dark:text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm text-red-500 dark:text-red-400 font-medium">
                    กดเพื่อเลือกรูปภาพสลิปใบใหม่
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleSlipUpload}
                />
              </label>

              {/* พรีวิวสลิปใหม่ */}
              {slipPreview && (
                <div className="mt-4 relative animate-in fade-in zoom-in duration-200">
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                    ✨ สลิปใหม่ที่เตรียมอัปโหลด:
                  </p>
                  <img
                    src={slipPreview}
                    alt="New Slip Preview"
                    className="w-full max-h-64 object-contain rounded-lg border-2 border-emerald-400 dark:border-emerald-600"
                  />
                  <button
                    onClick={() => {
                      setSlipPreview(null);
                      setSlipFile(null);
                    }}
                    className="absolute top-8 right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-colors"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}

              <button
                onClick={handleResubmitSlip}
                disabled={!slipFile || isSubmitting}
                className="mt-4 w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-900 text-white font-bold rounded-xl shadow-md transition-all duration-200 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    กำลังอัปโหลด...
                  </>
                ) : (
                  "ยืนยันการอัปโหลดสลิปใหม่"
                )}
              </button>
            </div>
          </div>
        )}

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
      </div>
    </div>
  );
}
