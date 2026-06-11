// src/modules/order/OrderDetail.tsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOrderById, type Order } from "../api/api_order";

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
      } catch (err) {
        setError("Failed to load order details");
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
    <div className="h-full p-6 w-full overflow-y-auto bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/orders")}
          className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 mb-3"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          กลับไปหน้ารายการออเดอร์
        </button>
        <h1 className="text-xl font-bold">รายละเอียดออเดอร์</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          เลขที่ออเดอร์: {order.id.substring(0, 8).toUpperCase()}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {formatDate(order.created_at)}
        </p>
      </div>

      <div className="space-y-4">
        {/* Main Items */}
        <div className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm p-4">
          <h2 className="font-semibold mb-3 text-orange-600 dark:text-orange-400">รายการหลัก</h2>
          <div className="space-y-2">
            {order.mainItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-600 last:border-0">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ฿{item.price.toLocaleString()} x {item.quantity}
                  </p>
                </div>
                <span className="font-bold">฿{item.subtotal.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Add-on Items */}
        {order.addOnItems.length > 0 && (
          <div className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm p-4">
            <h2 className="font-semibold mb-3 text-orange-600 dark:text-orange-400">รายการเพิ่มเติม</h2>
            <div className="space-y-2">
              {order.addOnItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-600 last:border-0">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ฿{item.price.toLocaleString()} x {item.quantity}
                    </p>
                  </div>
                  <span className="font-bold">฿{item.subtotal.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Equipment */}
        <div className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm p-4">
          <h2 className="font-semibold mb-3 text-orange-600 dark:text-orange-400">อุปกรณ์</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">เตา:</span>
              <span>{order.equipment.stoveCount} ชุด</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">กระทะ:</span>
              <span>{order.equipment.panCount} ใบ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">ถ่าน:</span>
              <span>{order.equipment.charcoalCount} ก้อน</span>
            </div>
            {order.equipment.extraStoves > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">เตาเพิ่ม:</span>
                <span>{order.equipment.extraStoves} ชุด</span>
              </div>
            )}
            {order.equipment.extraPans > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">กระทะเพิ่ม:</span>
                <span>{order.equipment.extraPans} ใบ</span>
              </div>
            )}
          </div>
        </div>

        {/* Shipping */}
        <div className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm p-4">
          <h2 className="font-semibold mb-3 text-orange-600 dark:text-orange-400">ที่อยู่จัดส่ง</h2>
          <p className="text-sm">{order.shipping.address}</p>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            <p>ค่าส่ง: ฿{order.shipping.totalFee.toLocaleString()}</p>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm p-4">
          <h2 className="font-semibold mb-3 text-orange-600 dark:text-orange-400">การชำระเงิน</h2>
          <div className="mb-3">
            <p className="text-sm">
              วิธีชำระเงิน:{" "}
              <span className="font-medium">
                {order.payment.method === "promptpay" ? "พร้อมเพย์" : order.payment.method}
              </span>
            </p>
          </div>
          
          {/* Payment Slip */}
          {order.payment.hasSlip && order.slip_url && (
            <div>
              <p className="text-sm font-medium mb-2">สลิปการโอนเงิน:</p>
              <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                <img
                  src={order.slip_url}
                  alt="Payment Slip"
                  className="w-full h-auto"
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
            <h2 className="font-semibold mb-3 text-orange-600 dark:text-orange-400">รูปบ้านลูกค้า</h2>
            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
              <img
                src={order.home_image_url}
                alt="Home Image"
                className="w-full h-auto"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.png";
                }}
              />
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm p-4">
          <h2 className="font-semibold mb-3 text-orange-600 dark:text-orange-400">สรุปยอดชำระ</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">ยอดรายการหลัก:</span>
              <span>฿{order.totals.cartTotal.toLocaleString()}</span>
            </div>
            {order.totals.addOnTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">ยอดรายการเพิ่มเติม:</span>
                <span>฿{order.totals.addOnTotal.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">ค่าส่ง:</span>
              <span>฿{order.totals.shippingFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
              <span className="font-bold">ยอดรวมทั้งหมด:</span>
              <span className="font-bold text-lg text-orange-600 dark:text-orange-400">
                ฿{order.totals.grandTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
