/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/modules/order/OrderUserList.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOrderUserById } from "../api/api_order";
import type { Order } from "../const/order";
import { onValue, ref } from "firebase/database";
import { db } from "../const/firebase";

type OrderStatus = "new" | "preparing" | "ready" | "shipping" | "delivered";

// 🌟 ปรับขนาดของ Badge ให้เล็กลงและดูกระชับขึ้น
const getStatusConfig = (status: OrderStatus) => {
  const configs = {
    new: {
      label: "รอยืนยัน",
      bgColor: "bg-yellow-50 dark:bg-yellow-500/10",
      textColor: "text-yellow-700 dark:text-yellow-400",
      dotColor: "bg-yellow-500",
    },
    preparing: {
      label: "กำลังเตรียม",
      bgColor: "bg-orange-50 dark:bg-orange-500/10",
      textColor: "text-orange-700 dark:text-orange-400",
      dotColor: "bg-orange-500",
    },
    ready: {
      label: "พร้อมส่ง",
      bgColor: "bg-purple-50 dark:bg-purple-500/10",
      textColor: "text-purple-700 dark:text-purple-400",
      dotColor: "bg-purple-500",
    },
    shipping: {
      label: "กำลังมาส่ง",
      bgColor: "bg-indigo-50 dark:bg-indigo-500/10",
      textColor: "text-indigo-700 dark:text-indigo-400",
      dotColor: "bg-indigo-500",
    },
    delivered: {
      label: "ส่งสำเร็จ",
      bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
      textColor: "text-emerald-700 dark:text-emerald-400",
      dotColor: "bg-emerald-500",
    }
  };
  return configs[status] || configs["new"];
};

export default function OrderUserList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    let isFirstFirebaseLoad = true;
    let debounceTimer: ReturnType<typeof setTimeout>;

    const fetchAPI = async () => {
      try {
        let token = "";
        let userData = "";
        let retries = 10;
        
        while ((!token || !userData) && retries > 0) {
          token = localStorage.getItem("auth_token") || localStorage.getItem("firebase_token") || "";
          userData = localStorage.getItem("userData") || "";
          if (!token || !userData) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            retries--;
          }
        }

        if (!token) {
          if (isMounted) setLoading(false);
          return;
        }

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

    fetchAPI();

    const liveOrdersRef = ref(db, "live_orders");
    const unsubscribe = onValue(liveOrdersRef, () => {
      if (isFirstFirebaseLoad) {
        isFirstFirebaseLoad = false;
        return;
      }
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchAPI();
      }, 1000);
    });

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
      <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin mb-3"></div>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium animate-pulse">กำลังโหลดออเดอร์...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full p-6 w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-red-50 dark:bg-red-900/20 px-6 py-4 rounded-xl border border-red-200 dark:border-red-800">
           <p className="text-red-600 dark:text-red-400 text-sm font-medium text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 overflow-hidden">
      
      {/* Header แบบกระทัดรัด */}
      <div className="shrink-0 px-5 pt-5 pb-3 border-b border-gray-200 dark:border-gray-800 z-10 bg-white dark:bg-gray-900 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
          ประวัติการสั่งซื้อ
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
            <span className="text-4xl mb-3 opacity-50">🍽️</span>
            <p className="text-sm font-medium">คุณยังไม่มีออเดอร์ในขณะนี้</p>
          </div>
        ) : (
          orders.map((order) => {
            const statusConfig = getStatusConfig((order.status as OrderStatus) || "new");

            // 🌟 ลอจิกดึงข้อมูล Rider
            const riderData = (order as any).rider_name || (order as any).rider_profile;
            const hasRider = !!order.rider_id || !!riderData;
            let riderNameStr = "ไรเดอร์";
            let riderPhoto = "";
            
            if (hasRider) {
              if (typeof riderData === "string") {
                riderNameStr = riderData;
              } else if (riderData) {
                riderNameStr = riderData.displayName || riderData.name;
                riderPhoto = riderData.photoURL || "";
              }
              if (!riderPhoto) {
                riderPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(riderNameStr)}&background=10b981&color=fff&rounded=true&bold=true`;
              }
            }

            return (
              <div
                key={order.id}
                onClick={() => handleOrderClick(order.id)}
                className="bg-white dark:bg-gray-800/90 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 overflow-hidden"
              >
                <div className="p-4">
                  {/* 1. Header (เลขออเดอร์ + สถานะ) */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h2 className="font-bold text-gray-900 dark:text-white text-[15px]">
                        #{order.id.slice(-6)}
                      </h2>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor} ${order.status !== 'delivered' ? 'animate-pulse' : ''}`}></span>
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* 🌟 2. ข้อมูลไรเดอร์แบบแถบเล็ก (ถ้ามี) */}
                  {order.rider_id && order.rider_id !== "" && (
                    <div className="flex items-center gap-2 mb-3 bg-blue-50/60 dark:bg-blue-900/20 px-3 py-2 rounded-xl border border-blue-100/50 dark:border-blue-800/30">
                      <img 
                        src={riderPhoto} 
                        alt="Rider" 
                        className="w-6 h-6 rounded-full object-cover border border-white dark:border-gray-700 shadow-sm"
                      />
                      <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300">
                        ผู้จัดส่ง: <span className="font-bold text-gray-800 dark:text-white ml-1">{riderNameStr}</span>
                      </span>
                    </div>
                  )}

                  {/* 3. รายการอาหาร (จัดชิด ลดขนาดตัวอักษร) */}
                  {/* 3. รายการอาหาร (จัดชิด ซ่อนราคาชุดหลัก และเอาเมนูเพิ่มเติมออก) */}
                  <div className="space-y-1.5 mb-3">
                    {order.mainItems?.map((item, index) => (
                      <div key={index} className="flex justify-between text-[13px] items-center">
                        <span className="text-gray-700 dark:text-gray-300 truncate pr-2">
                          {item.name} <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1">x{item.quantity}</span>
                        </span>
                        {/* ❌ นำราคาส่วนนี้ออกตามที่ต้องการ */}
                      </div>
                    ))}
                    {/* ❌ ลบโค้ดส่วน addOnItems (เมนูเพิ่มเติม) ออกทั้งหมด */}
                  </div>

                  {/* 4. Footer (ที่อยู่ + สถานะอุปกรณ์ & ยอดรวม) */}
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700/80 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                      <div className="flex items-start gap-1.5 flex-1">
                        <span className="text-red-400 shrink-0 mt-0.5">📍</span>
                        <span className="line-clamp-2">{order.shipping?.address || "ไม่มีที่อยู่"}</span>
                      </div>
                      
                      {/* สถานะอุปกรณ์ รับเตากระทะ */}
                      {order.equipment?.needEquipment && (
                        <span className="shrink-0 bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 px-2 py-0.5 rounded-md font-semibold border border-orange-100 dark:border-orange-800/30">
                          รับเตากระทะ {Math.max(order.equipment.stoveCount || 1, order.equipment.panCount || 1)} ชุด
                        </span>
                      )}
                    </div>
                    
                    {/* 🌟 แสดงช่องทางชำระเงินแทนยอดรวม */}
                    <div className="flex justify-between items-end mt-1">
                      {/* <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">ช่องทางชำระเงิน</span> */}
                      <span className="text-[13px] font-bold text-gray-800 dark:text-gray-200">
                        {order.payment?.method === "cash" ? "💵 เงินสดปลายทาง" : 
                         order.payment?.method === "promptpay" || order.payment?.method === "transfer" ? "📱 โอนเงิน / สแกนจ่าย" : 
                         order.payment?.method ? order.payment.method.toUpperCase() : "ไม่ระบุ"}
                      </span>
                      <span className="text-lg font-black text-orange-500 dark:text-orange-400 leading-none">
                        ฿{order.totals?.grandTotal?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}