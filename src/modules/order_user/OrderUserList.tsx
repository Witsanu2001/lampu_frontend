/* eslint-disable @typescript-eslint/no-unused-vars */
// src/modules/order/Order.tsx

import { useEffect,useState } from "react";
import { useNavigate } from "react-router-dom";
import {getOrderUserById } from "../api/api_order";
import type { Order } from "../const/order";
import {onValue, ref } from "firebase/database";
import { db } from "../const/firebase";

type OrderStatus = "new" | "preparing" | "ready" | "shipping" | "delivered";

const getStatusConfig = (status: OrderStatus) => {
  const configs = {
    // new: {
    //   label: "ออเดอร์ใหม่",
    //   bgColor: "bg-blue-100 dark:bg-blue-900",
    //   textColor: "text-blue-800 dark:text-blue-200",
    //   borderColor: "border-blue-300 dark:border-blue-700",
    // },
    new: {
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

export default function OrderUserList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    let isFirstFirebaseLoad = true; // ✨ ตัวแปรพระเอก: ป้องกัน Firebase ยิง API ตอนเปิดหน้าเว็บ
    let debounceTimer: ReturnType<typeof setTimeout>;

    // ฟังก์ชันสำหรับเรียก API (เขียนไว้ที่เดียว จะได้ไม่สับสน)
    const fetchAPI = async () => {
      try {
        const data = await getOrderUserById();
        if (isMounted) {
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) setError("Failed to load orders");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // 1. เปิดหน้าเว็บมาปุ๊บ สั่งโหลด API เลย 1 ครั้ง
    fetchAPI();

    // 2. ใช้ onValue ดักฟังข้อมูล "ทั้งก้อน"
    const liveOrdersRef = ref(db, "live_orders");
    
    const unsubscribe = onValue(liveOrdersRef, () => {
      // 🛑 เมื่อ onValue ทำงานครั้งแรกสุด (ตอนเพิ่งเชื่อมต่อติด) 
      // เราจะ "เตะทิ้ง" ทันที เพราะเราใช้ fetchAPI() โหลดไปแล้ว ไม่ต้องให้มันเรียกซ้ำ
      if (isFirstFirebaseLoad) {
        isFirstFirebaseLoad = false;
        return; 
      }

      // 🟢 ถ้าหลุดมาถึงบรรทัดนี้ได้ แปลว่ามีการเปลี่ยนแปลงจริงๆ (มีคนสั่งอาหารเพิ่ม หรือเปลี่ยนสถานะ)
      // onValue จะทำงานแค่ 1 ครั้งถ้วน! เราก็แค่หน่วงเวลาไว้ 1 วินาทีแล้วดึง API ได้เลย
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        console.log("🔥 Firebase มีการขยับ! เรียก API ก้อนใหม่...");
        fetchAPI();
      }, 1000);
    });

    // ล้างข้อมูลเมื่อปิดหน้าเว็บ
    return () => {
      isMounted = false;
      unsubscribe();
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
    navigate(`/orders_user/${orderId}`);
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
          // ✨ นำ order.status มาใช้งานโดยตรง และแปลง type ให้ถูกต้อง
          const statusConfig = getStatusConfig(
            (order.status as OrderStatus) || "new",
          );

          return (
            <div
              key={order.id}
              onClick={() => handleOrderClick(order.id)}
              className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            >
              {/* Order Header */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex justify-between items-start">
                <div>
                  <p className="font-semibold text-sm">{order.id}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}
                >
                  {statusConfig.label}
                </span>
              </div>

              {/* Order Items */}
              <div className="px-4 py-3">
                <div className="space-y-2">
                  {order.mainItems?.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">
                        {item.name} x{item.quantity}
                      </span>
                      <span className="font-medium">
                        ฿{item.subtotal?.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {order.addOnItems?.length > 0 && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        เพิ่มเติม:
                      </p>
                      {order.addOnItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-600 dark:text-gray-300">
                            {item.name} x{item.quantity}
                          </span>
                          <span className="font-medium">
                            ฿{item.subtotal?.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Footer */}
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-600 border-t border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ที่อยู่:
                  </span>
                  <span className="text-sm font-medium truncate max-w-[200px]">
                    {order.shipping?.address}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold">ยอดรวม:</span>
                  <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
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
