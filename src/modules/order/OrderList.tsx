/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/modules/order/OrderList.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { assignBulkOrders, getNewOrders, getDeliveryOrders } from "../api/api_order"; 
import { getRiders } from "../api/api_user";
import type { Order } from "../const/order";
import { onValue, ref } from "firebase/database";
import { db } from "../const/firebase";

// Component Modal สำหรับเลือกไรเดอร์
interface Rider {
  uid: string;
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
    if (!isOpen) return;
    let isMounted = true; 

    const fetchRiders = async () => {
      setLoading(true);
      setSelectedRiderId("");
      setRiders([]);
      
      try {
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
  
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<"kitchen" | "delivery">("kitchen");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 🌟 State สำหรับ Server-Side Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const limit = 10; // ดึงทีละ 10 รายการ

  // 🌟 ตัวกระตุ้นรีเฟรชเมื่อ Firebase แจ้งเตือนอัปเดต
  const [refreshKey, setRefreshKey] = useState(0);
  
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      // จัดการสถานะ Loading ตามสถานการณ์
      if (page === 1 && !isInitialLoading) setIsTabLoading(true);
      if (page > 1) setIsFetchingMore(true);
      
      try {
        // 🌟 เอา while loop เช็ค Token ตรงนี้ออกได้เลย
        // เพราะด้านใน getNewOrders() มันถูกครอบด้วย getFreshToken() ที่รอ Firebase ให้แล้ว

        // 🌟 ยิง API พร้อมส่ง page และ limit
        let data: Order[] = [];
        if (activeTab === "kitchen") {
          data = await getNewOrders();
        } else {
          data = await getDeliveryOrders(page, limit);
        }

        if (isMounted) {
          // ตรวจสอบว่ายังมีข้อมูลให้ดึงต่อไหม
          if (data.length < limit) {
            setHasMore(false);
          } else {
            setHasMore(true);
          }

          setOrders((prev) => {
            if (page === 1) return data;
            
            const existingIds = new Set(prev.map(o => o.id));
            const newOrders = data.filter(o => !existingIds.has(o.id));
            return [...prev, ...newOrders];
          });
          
          setIsInitialLoading(false);
          setIsTabLoading(false);
          setIsFetchingMore(false);
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to load orders");
          setIsInitialLoading(false);
          setIsTabLoading(false);
          setIsFetchingMore(false);
        }
      }
    };

    fetchOrders();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, page, refreshKey]); // โหลดใหม่เมื่อ แท็บ, หน้า, หรือคีย์รีเฟรชเปลี่ยน

  // 🌟 Firebase Listener: เมื่อมีการอัปเดต ให้รีเซ็ตกลับไปหน้า 1 เสมอเพื่อให้ได้คิวล่าสุด
  useEffect(() => {
    let isFirstFirebaseLoad = true;
    let debounceTimer: ReturnType<typeof setTimeout>;

    const liveOrdersRef = ref(db, "live_orders");
    const unsubscribe = onValue(liveOrdersRef, (_snapshot) => {
      if (isFirstFirebaseLoad) {
        isFirstFirebaseLoad = false;
        return;
      }
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        // เมื่อมีสัญญาณอัปเดต สั่งกลับไปโหลดหน้า 1 ใหม่ทั้งหมด
        setPage(1);
        setRefreshKey(prev => prev + 1);
      }, 1000);
    });

    return () => {
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
    e.stopPropagation(); 
    if (status !== "preparing" && status !== "ready") return; 
    setSelectedOrders((prev) => {
      if (prev.includes(orderId)) return prev.filter((id) => id !== orderId);
      return [...prev, orderId];
    });
  };

  const handleAssignJobs = async (riderId: string) => {
    try {
      const payload = selectedOrders.map((orderId, index) => ({
        order_id: orderId,
        rider_id: riderId,
        queue_number: index + 1 
      }));

      await assignBulkOrders(payload);
      setIsModalOpen(false);
      setSelectedOrders([]); 
      alert(`มอบหมายสำเร็จ ${selectedOrders.length} รายการ (จัดคิวเรียบร้อย)!`);
    } catch (error: any) {
      alert(`เกิดข้อผิดพลาดในการมอบหมายงาน: ${error.message}`);
    }
  };

  const handleCompleteOrder = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation(); 
    const confirmComplete = window.confirm("ยืนยันว่าออเดอร์นี้จัดส่งเสร็จสิ้นแล้วใช่หรือไม่?");
    if (!confirmComplete) return;

    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("firebase_token") || "";
      const userDataString = localStorage.getItem("userData");
      const currentUser = userDataString ? JSON.parse(userDataString) : { uid: "admin" };
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

      const response = await fetch(`${apiUrl}/api/orders/orders_put/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: currentUser.uid, status: "delivered" })
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || "Failed to update order");
      }
      alert("อัปเดตสถานะเป็นส่งสำเร็จแล้ว! 🎉");
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    }
  };

  // 🌟 ดักจับ Scroll ถ้าใกล้สุดขอบล่าง และยังมีข้อมูลเหลือ ให้สั่งบวก Page (API จะยิงอัตโนมัติ)
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      if (hasMore && !isFetchingMore && !isTabLoading) {
        setPage((prev) => prev + 1);
      }
    }
  };

  if (isInitialLoading) {
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
    <div className="h-full w-full flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 overflow-hidden">
      
      {/* ส่วน Header */}
      <div className="shrink-0 p-6 pb-2 border-gray-200 dark:border-gray-700 z-10 bg-gray-50 dark:bg-gray-900">
        <h1 className="text-xl font-bold mb-4">จัดการออเดอร์</h1>

        {/* UI ส่วน Tabs */}
        <div className="flex bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <button
            onClick={() => {
              if (activeTab !== "kitchen") {
                setActiveTab("kitchen");
                setSelectedOrders([]);
                setOrders([]); // เคลียร์ UI รอรับข้อมูลใหม่
                setPage(1);    // รีเซ็ตเลขหน้า
                setHasMore(true);
              }
            }}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 text-sm font-bold rounded-lg transition-all ${
              activeTab === "kitchen"
                ? "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <span>ออเดอร์ใหม่ 🍳</span>
          </button>
          <button
            onClick={() => {
              if (activeTab !== "delivery") {
                setActiveTab("delivery");
                setSelectedOrders([]);
                setOrders([]); // เคลียร์ UI รอรับข้อมูลใหม่
                setPage(1);    // รีเซ็ตเลขหน้า
                setHasMore(true);
              }
            }}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 text-sm font-bold rounded-lg transition-all ${
              activeTab === "delivery"
                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <span>การจัดส่ง 🛵</span>
          </button>
        </div>
      </div>

      {/* ส่วนแสดงรายการออเดอร์ พร้อมรับ Scroll */}
      <div 
        className="flex-1 overflow-y-auto px-6 pb-[160px] xl:pb-24 pt-4 space-y-3"
        onScroll={handleScroll} 
      >
        {isTabLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin mb-3"></div>
            <p className="text-gray-500 text-sm animate-pulse">กำลังโหลดข้อมูลแท็บนี้...</p>
          </div>
        ) : (
          <>
            {orders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">ไม่มีออเดอร์ในหมวดหมู่นี้</div>
            ) : (
              orders.map((order) => {
                const statusConfig = getStatusConfig((order.status as OrderStatus) || "new");
                const isSelectable = order.status === "preparing" || order.status === "ready";
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
                        
                        {activeTab === "kitchen" && (
                          <div
                            onClick={(e) => handleToggleOrder(e, order.id, order.status)}
                            className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-lg border-2 text-sm font-bold transition-all select-none ${
                              !isSelectable
                                ? "bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed opacity-50"
                                : isSelected
                                ? "bg-emerald-500 border-emerald-500 text-white transform scale-105"
                                : "bg-white border-gray-300 text-transparent hover:border-emerald-400"
                            }`}
                          >
                            {isSelected ? selectionIndex + 1 : ""}
                          </div>
                        )}

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

                    {activeTab === "delivery" && order.status !== "ready" && order.status !== "shipping" && (
                      <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                        <button
                          onClick={(e) => handleCompleteOrder(e, order.id)}
                          className="px-6 py-2 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white active:scale-95"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                          เสร็จสิ้นแล้ว
                        </button>
                      </div>
                    )}
                    
                  </div>
                );
              })
            )}

            {/* 🌟 แสดงไอคอนโหลดต่อท้าย เมื่อเลื่อนจนสุดแล้ว API กำลังทำงาน */}
            {isFetchingMore && hasMore && (
              <div className="py-4 text-center">
                <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin"></div>
                <p className="text-xs text-gray-400 mt-2">กำลังโหลดเพิ่มเติม...</p>
              </div>
            )}
            
          </>
        )}
      </div>

      {/* แถบมอบหมายงานด้านล่าง */}
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