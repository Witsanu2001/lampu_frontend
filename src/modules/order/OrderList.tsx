/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/modules/order/OrderList.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { assignBulkOrders, getAllOrders } from "../api/api_order"; // 🌟 นำเข้า updateStatus
import { getRiders } from "../api/api_user"; // 🌟 นำเข้า getRiders
import type { Order } from "../const/order";
import { onValue, ref } from "firebase/database";
import { db } from "../const/firebase";

// 🌟 1. Component Modal สำหรับเลือกไรเดอร์
interface Rider {
  uid: string; // 🌟 ตรวจสอบว่า API ของคุณคืนค่าเป็น uid หรือ id (ถ้าเป็น id ให้เพิ่มรับค่า id เข้ามาด้วย)
  name?: string;
  email?: string;
}

const RiderModal = ({
  isOpen,
  onClose,
  onAssign,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (riderId: string) => void;
}) => {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [selectedRiderId, setSelectedRiderId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // ถ้า Modal ปิดอยู่ ไม่ต้องทำอะไร (ข้ามไปเลย)
    if (!isOpen) return;

    let isMounted = true; 

    const fetchRiders = async () => {
      // 🌟 เคลียร์ค่าเก่าทิ้งในจังหวะที่กำลังจะเริ่มโหลดข้อมูลใหม่
      setLoading(true);
      setSelectedRiderId("");
      setRiders([]);
      
      try {
        // 🌟 เรียกใช้ API ของจริงเพื่อดึงข้อมูล Rider
        const data = await getRiders();
        if (isMounted) {
          setRiders(data || []);
        }
      } catch (error) {
        console.error("Error fetching riders:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRiders();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-sm shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">เลือกไรเดอร์</h2>
        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin mb-2"></div>
            <p className="text-gray-500 text-sm">กำลังโหลดข้อมูลไรเดอร์...</p>
          </div>
        ) : (
          <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-2">
            {riders.length === 0 ? (
               <p className="text-center text-gray-500 py-4">ไม่พบข้อมูลไรเดอร์</p>
            ) : (
              riders.map((rider) => (
                <label
                  key={rider.uid}
                  className={`flex items-center space-x-3 cursor-pointer p-3 rounded-xl border transition-colors ${
                    selectedRiderId === rider.uid
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="rider"
                    value={rider.uid}
                    checked={selectedRiderId === rider.uid}
                    onChange={(e) => setSelectedRiderId(e.target.value)}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                  <span className="text-gray-700 dark:text-gray-200 font-medium">
                    {rider.name || rider.email}
                  </span>
                </label>
              ))
            )}
          </div>
        )}
        <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => onAssign(selectedRiderId)}
            disabled={!selectedRiderId || loading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium shadow-sm"
          >
            เริ่มงาน
          </button>
        </div>
      </div>
    </div>
  );
};

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
  return configs[status] || configs["new"];
};

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 🌟 2. State สำหรับการจัดการเลือกออเดอร์
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    let isFirstFirebaseLoad = true;
    let debounceTimer: ReturnType<typeof setTimeout>;

    const fetchOrders = async () => {
      try {
        let token = "";
        let retries = 10;
        while (!token && retries > 0) {
          token = localStorage.getItem("auth_token") || localStorage.getItem("firebase_token") || "";
          if (!token) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            retries--;
          }
        }

        if (!token) {
          console.warn("⚠️ ไม่พบ Token หรือผู้ใช้ยังไม่ได้ล็อกอิน");
          if (isMounted) setLoading(false);
          return;
        }

        const data = await getAllOrders();
        if (isMounted) {
          setOrders((prev) => {
            const newData = Array.isArray(data) ? data : [];

            // 🌟 1. สร้างฟังก์ชันดึงค่า Signature (เอาแค่ ID กับ Status มาต่อกัน)
            const getSignature = (ordersArr: any[]) => {
              return ordersArr
                .map((o) => `${o.id}-${o.status}`)
                .sort() // เรียงลำดับตัวอักษรเพื่อป้องกันปัญหา Array สลับตำแหน่ง
                .join("|");
            };

            // 🌟 2. เปรียบเทียบแค่ลายเซ็น (Signature)
            if (getSignature(prev) === getSignature(newData)) {
              return prev; // ถ้า ID และ Status เหมือนเดิมเป๊ะ ให้ข้ามไปเลย ไม่รีเฟรชหน้าจอ
            }

            return newData; // อัปเดต State ใหม่เฉพาะเมื่อมีออเดอร์เพิ่ม/ลด หรือสถานะเปลี่ยนเท่านั้น
          });
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to load orders");
          setLoading(false);
        }
      }
    };

    fetchOrders();

    const liveOrdersRef = ref(db, "live_orders");
    const unsubscribe = onValue(liveOrdersRef, (_snapshot) => {
      if (isFirstFirebaseLoad) {
        isFirstFirebaseLoad = false;
        return;
      }
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        console.log("Firebase signal received, fetching latest data...");
        fetchOrders();
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
    navigate(`/orders/${orderId}`);
  };

  const handleToggleOrder = (e: React.MouseEvent, orderId: string, status: string) => {
    e.stopPropagation(); // สำคัญ: ป้องกันไม่ให้การกดเลือกเด้งไปหน้า รายละเอียด
    
    if (status !== "preparing") return; // อนุญาตให้เลือกได้แค่พร้อมส่ง (แก้ตามที่คุณระบุว่าให้เช็ค preparing)

    setSelectedOrders((prev) => {
      if (prev.includes(orderId)) return prev.filter((id) => id !== orderId);
      return [...prev, orderId];
    });
  };

  // 🌟 4. ฟังก์ชันยืนยันการมอบหมายงาน
  // 🌟 ฟังก์ชันยืนยันการมอบหมายงาน (ส่งแบบก้อนเดียว)
  const handleAssignJobs = async (riderId: string) => {
    try {
      const payload = selectedOrders.map((orderId, index) => ({
        order_id: orderId,
        rider_id: riderId,
        queue_number: index + 1 // บันทึกลำดับคิว (เริ่มที่ 1)
      }));

      // 2. ส่งไปให้ API ก้อนเดียวเลย
      await assignBulkOrders(payload);

      setIsModalOpen(false);
      setSelectedOrders([]); // ล้างค่าที่เลือกไว้
      alert(`มอบหมายสำเร็จ ${selectedOrders.length} รายการ (จัดคิวเรียบร้อย)!`);
      
    } catch (error: any) {
      alert(`เกิดข้อผิดพลาดในการมอบหมายงาน: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">กำลังโหลดรายการออเดอร์...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full p-6 w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full p-6 pb-[160px] xl:pb-24 w-full overflow-y-auto bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <div className="border-gray-200 dark:border-gray-700 z-10">
        <h1 className="text-xl font-bold mb-3">รายการออเดอร์ทั้งหมด</h1>
      </div>
      <div className="space-y-3">
        {orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">ยังไม่มีออเดอร์ในขณะนี้</div>
        ) : (
          orders.map((order) => {
            const statusConfig = getStatusConfig((order.status as OrderStatus) || "new");
            
            // ตรวจสอบการเลือก
            const isPreparing = order.status === "preparing";
            const selectionIndex = selectedOrders.indexOf(order.id);
            const isSelected = selectionIndex !== -1;

            return (
              <div
                key={order.id}
                onClick={() => handleOrderClick(order.id)}
                className={`bg-white dark:bg-gray-800 rounded-2xl border ${
                  isSelected ? "border-emerald-500 shadow-md" : "border-gray-200 dark:border-gray-700 shadow-sm"
                } overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200`}
              >
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-start gap-4">
                    
                    {/* 🌟 กล่องกดเลือกออเดอร์ (อยู่ด้านซ้ายสุดของ Card) */}
                    <div
                      onClick={(e) => handleToggleOrder(e, order.id, order.status)}
                      className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-lg border-2 text-sm font-bold transition-all select-none ${
                        !isPreparing
                          ? "bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed opacity-50"
                          : isSelected
                          ? "bg-emerald-500 border-emerald-500 text-white transform scale-105"
                          : "bg-white border-gray-300 text-transparent hover:border-emerald-400"
                      }`}
                    >
                      {isSelected ? selectionIndex + 1 : ""}
                    </div>

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
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                <div className="px-5 py-3 space-y-2 bg-gray-50/50 dark:bg-gray-800/50">
                  {order.mainItems?.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">
                        {item.name} <span className="text-gray-400">x{item.quantity}</span>
                      </span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        ฿{item.subtotal?.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {order.addOnItems?.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm italic">
                      <span className="text-gray-500 dark:text-gray-400">
                        {item.name} <span className="text-gray-400">x{item.quantity}</span>
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        ฿{item.subtotal?.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

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
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">ยอดรวมทั้งสิ้น</span>
                    <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                      ฿{order.totals?.grandTotal?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 🌟 5. แถบมอบหมายงานด้านล่าง จะแสดงเมื่อมีการเลือก Order เท่านั้น */}
      <div
        className={`fixed bottom-[76px] xl:bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] p-4 flex justify-between items-center transition-all duration-300 z-40 ${
          selectedOrders.length > 0 
            ? "opacity-100 translate-y-0" 
            : "opacity-0 translate-y-10 pointer-events-none"
        }`}
      >
        <div className="ml-8 text-gray-700 dark:text-gray-300 font-medium">
          เลือกแล้ว <span className="text-emerald-600 text-xl font-bold mx-1">{selectedOrders.length}</span> รายการ
        </div>
        <div className="mr-8">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all hover:shadow-lg"
          >
            มอบหมายงาน
          </button>
        </div>
      </div>

      {/* เรียกใช้งาน Modal */}
      <RiderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAssign={handleAssignJobs}
      />
    </div>
  );
}