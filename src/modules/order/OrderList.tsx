/* eslint-disable @typescript-eslint/no-unused-vars */
// src/modules/order/Order.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllOrders } from "../api/api_order";
import type { Order } from "../const/order";
import { onValue, ref } from "firebase/database";
import { db } from "../const/firebase";

type OrderStatus =
  | "new"
  | "pending"
  | "preparing"
  | "ready"
  | "shipping"
  | "delivered";

const getStatusConfig = (status: OrderStatus) => {
  const configs = {
    new: {
      label: "ออเดอร์ใหม่",
      bgColor: "bg-blue-100 dark:bg-blue-900",
      textColor: "text-blue-800 dark:text-blue-200",
      borderColor: "border-blue-300 dark:border-blue-700",
    },
    pending: {
      label: "รอยืนยัน",
      bgColor: "bg-yellow-100 dark:bg-yellow-900",
      textColor: "text-yellow-800 dark:text-yellow-200",
      borderColor: "border-yellow-300 dark:border-yellow-700",
    },
    preparing: {
      label: "กำลังเตรียมออเดอร์",
      bgColor: "bg-orange-100 dark:bg-orange-900",
      textColor: "text-orange-800 dark:text-orange-200",
      borderColor: "border-orange-300 dark:border-orange-700",
    },
    ready: {
      label: "พร้อมส่ง",
      bgColor: "bg-purple-100 dark:bg-purple-900",
      textColor: "text-purple-800 dark:text-purple-200",
      borderColor: "border-purple-300 dark:border-purple-700",
    },
    shipping: {
      label: "กำลังไปส่ง",
      bgColor: "bg-indigo-100 dark:bg-indigo-900",
      textColor: "text-indigo-800 dark:text-indigo-200",
      borderColor: "border-indigo-300 dark:border-indigo-700",
    },
    delivered: {
      label: "ส่งสำเร็จ",
      bgColor: "bg-green-100 dark:bg-green-900",
      textColor: "text-green-800 dark:text-green-200",
      borderColor: "border-green-300 dark:border-green-700",
    },
  };
  // เผื่อกรณีที่ status ส่งมาผิดปกติ ให้ fallback กลับไปที่ "new"
  return configs[status] || configs["new"];
};

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    // ใช้ Ref เพื่อเก็บสถานะว่าโหลดครั้งแรกไปหรือยัง
    let isFirstFirebaseLoad = true;
    let debounceTimer: ReturnType<typeof setTimeout>;

    // 1. ฟังก์ชันดึงข้อมูลจาก API (ยิงครั้งเดียวตอนเรียกใช้)
    const fetchOrders = async () => {
      try {
        const data = await getAllOrders();
        if (isMounted) {
          setOrders(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to load orders");
          setLoading(false);
        }
      }
    };

    // 2. รัน API ครั้งแรกตอนเปิดหน้า
    fetchOrders();

    // 3. เริ่มดักฟัง Firebase
    const liveOrdersRef = ref(db, "live_orders");

    // ใช้ onValue ดักข้อมูลทั้งก้อน (ดีกว่า onChildAdded เพราะได้ข้อมูลแบบ Snapshot ทีเดียว)
    const unsubscribe = onValue(liveOrdersRef, (_snapshot) => {
      // 🛑 Guard: ข้ามตอนที่ Firebase เชื่อมต่อครั้งแรก
      if (isFirstFirebaseLoad) {
        isFirstFirebaseLoad = false;
        return;
      }

      // 🟢 ถ้ามีการเปลี่ยนแปลงจริงๆ (ออเดอร์เข้า/เปลี่ยนสถานะ)
      // ให้ทำ Debounce หน่วงเวลา 1 วินาที เพื่อรวบยอดการยิง API
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        console.log("Firebase signal received, fetching latest data...");
        fetchOrders(); // ดึงก้อนใหม่มาแทนที่ก้อนเดิม จบในครั้งเดียว
      }, 1000);
    });

    // 4. Cleanup: ล้างทุกอย่างเมื่อออกจากหน้า
    return () => {
      isMounted = false;
      unsubscribe(); // ยกเลิกการฟัง Firebase
      clearTimeout(debounceTimer);
    };
  }, []);

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

  const handleOrderClick = (orderId: string) => {
    navigate(`/orders/${orderId}`);
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

  if (error) {
    return (
      <div className="h-full p-6 w-full overflow-y-auto bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
        <div className="flex items-center justify-center h-full">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-6 w-full overflow-y-auto bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <div className="border-gray-200 dark:border-gray-700 z-10">
        <h1 className="text-xl font-bold mb-3">รายการออเดอร์หมูกระทะ</h1>
      </div>
      <div className="space-y-3">
        {orders.map((order) => {
          const statusConfig = getStatusConfig(
            (order.status as OrderStatus) || "new",
          );

          return (
            <div
              key={order.id}
              onClick={() => handleOrderClick(order.id)}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200"
            >
              {/* Header: ชื่อลูกค้า + สถานะ */}
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                      {order.shipping?.recipient || "ไม่ระบุชื่อ"}
                    </h2>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex flex-wrap gap-2">
                      <span>{order.id}</span>
                      <span>•</span>
                      <span>{formatDate(order.created_at)}</span>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusConfig.bgColor} ${statusConfig.textColor}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>
              </div>

              {/* Body: รายการสินค้า */}
              <div className="px-5 py-3 space-y-2 bg-gray-50/50 dark:bg-gray-800/50">
                {order.mainItems?.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      {item.name}{" "}
                      <span className="text-gray-400">x{item.quantity}</span>
                    </span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      ฿{item.subtotal?.toLocaleString()}
                    </span>
                  </div>
                ))}
                {/* ส่วน Add-on ถ้ามี */}
                {order.addOnItems?.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between text-sm italic"
                  >
                    <span className="text-gray-500 dark:text-gray-400">
                      {item.name}{" "}
                      <span className="text-gray-400">x{item.quantity}</span>
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      ฿{item.subtotal?.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer: ที่อยู่ + ราคารวม */}
              <div className="px-5 py-4 bg-white dark:bg-gray-800">
                <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <div className="flex items-center gap-1">
                    <span>📍</span>
                    <span className="truncate max-w-[200px]">
                      {order.shipping?.address || "ไม่มีที่อยู่"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-700 pt-3">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    ยอดรวมทั้งสิ้น
                  </span>
                  <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                    ฿{order.totals?.grandTotal?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
