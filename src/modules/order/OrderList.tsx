/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/modules/order/OrderList.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  assignBulkOrders,
  getNewOrders,
  getDeliveryOrders,
} from "../api/api_order";
import { getRiders } from "../api/api_user";
import type { Order } from "../const/order";
import { onValue, ref } from "firebase/database";
import { db } from "../const/firebase";
const RiderModal = ({
  isOpen,
  onClose,
  onAssign,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (riderId: string) => void;
}) => {
  const [riders, setRiders] = useState<any[]>([]);
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

  const availableRiders = riders.filter(
    (rider) =>
      rider.jobs_event?.status !== "pending" &&
      rider.jobs_event?.status !== "start",
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl w-full max-w-sm shadow-2xl border border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
          เลือกไรเดอร์
        </h2>
        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin mb-2"></div>
            <p className="text-gray-500 text-sm">กำลังโหลดข้อมูลไรเดอร์...</p>
          </div>
        ) : (
          <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {availableRiders.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                ไม่พบข้อมูลไรเดอร์ที่ว่างในขณะนี้
              </p>
            ) : (
              availableRiders.map((rider) => (
                <label
                  key={rider.uid}
                  className={`flex items-center space-x-3 cursor-pointer p-3 rounded-2xl border transition-all ${
                    selectedRiderId === rider.uid
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-sm"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="rider"
                    value={rider.uid}
                    checked={selectedRiderId === rider.uid}
                    onChange={(e) => setSelectedRiderId(e.target.value)}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 shrink-0"
                  />

                  <img
                    src={
                      rider.photoURL ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        rider.displayName,
                      )}&background=random&color=fff`
                    }
                    alt={rider.displayName}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600 shrink-0 bg-white"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src =
                        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
                    }}
                  />

                  <div className="flex justify-between w-full">
                    <span className="text-gray-700 dark:text-gray-200 font-medium">
                      {rider.displayName}
                    </span>

                    <span className="text-gray-700 dark:text-gray-200 font-medium">
                      🛵 {rider.jobs_event?.total_order_sets || "0"}
                    </span>
                  </div>
                </label>
              ))
            )}
          </div>
        )}
        <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700 pt-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors font-medium"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => onAssign(selectedRiderId)}
            disabled={!selectedRiderId || loading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:dark:bg-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-xl transition-all font-medium shadow-md hover:shadow-lg active:scale-95"
          >
            เริ่มงาน
          </button>
        </div>
      </div>
    </div>
  );
};

type OrderStatus = "new" | "preparing" | "ready" | "shipping" | "delivered";

const getStatusConfig = (status: OrderStatus) => {
  const configs = {
    new: {
      label: "ออเดอร์ใหม่",
      bgColor: "bg-blue-100 dark:bg-blue-500/20",
      textColor: "text-blue-700 dark:text-blue-400",
      dotColor: "bg-blue-500",
    },
    refuse: {
      label: "ปฎิเสธ",
      bgColor: "bg-red-100 dark:bg-red-500/20",
      textColor: "text-red-700 dark:text-red-400",
      dotColor: "bg-red-500",
    },
    edit: {
       label: "รอตรวจสอบ",
      bgColor: "bg-yellow-50 dark:bg-yellow-500/10",
      textColor: "text-yellow-700 dark:text-yellow-400",
      dotColor: "bg-yellow-500",
    },
    preparing: {
      label: "กำลังเตรียม",
      bgColor: "bg-orange-100 dark:bg-orange-500/20",
      textColor: "text-orange-700 dark:text-orange-400",
      dotColor: "bg-orange-500",
    },
    ready: {
      label: "พร้อมส่ง",
      bgColor: "bg-purple-100 dark:bg-purple-500/20",
      textColor: "text-purple-700 dark:text-purple-400",
      dotColor: "bg-purple-500",
    },
    shipping: {
      label: "กำลังไปส่ง",
      bgColor: "bg-indigo-100 dark:bg-indigo-500/20",
      textColor: "text-indigo-700 dark:text-indigo-400",
      dotColor: "bg-indigo-500",
    },
    delivered: {
      label: "ส่งสำเร็จ",
      bgColor: "bg-emerald-100 dark:bg-emerald-500/20",
      textColor: "text-emerald-700 dark:text-emerald-400",
      dotColor: "bg-emerald-500",
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

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const limit = 10;

  const [refreshKey, setRefreshKey] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      if (page > 1) setIsFetchingMore(true);

      try {
        let rawData: any;
        if (activeTab === "kitchen") {
          rawData = await getNewOrders();
        } else {
          rawData = await getDeliveryOrders(page, limit);
        }

        // 🌟 ป้องกันกรณี API คืนค่า null หรือ undefined ให้แปลงเป็น Array ว่างเสมอ
        const data: Order[] = Array.isArray(rawData) ? rawData : [];

        if (isMounted) {
          if (data.length < limit) {
            setHasMore(false);
          } else {
            setHasMore(true);
          }

          setOrders((prev) => {
            if (page === 1) return data;
            const existingIds = new Set(prev.map((o) => o.id));
            const newOrders = data.filter((o) => !existingIds.has(o.id));
            return [...prev, ...newOrders];
          });

          setError(null); // เคลียร์ Error ทิ้ง (ถ้าก่อนหน้านี้เคยมี)
          setIsInitialLoading(false);
          setIsTabLoading(false);
          setIsFetchingMore(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Fetch orders error:", err);
          // 🌟 แก้ไขตรงนี้: แทนที่จะโยน Error ให้เซ็ตเป็นหน้าว่างแทน
          if (page === 1) {
            setOrders([]); // เพื่อให้ไปเข้าเงื่อนไขแสดง "ไม่มีออเดอร์ในหมวดหมู่นี้"
          }
          setError(null); // ไม่ต้องเซ็ตคำว่า Failed to load orders
          setHasMore(false);
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
  }, [activeTab, page, refreshKey]);

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
        setPage(1);
        setRefreshKey((prev) => prev + 1);
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

  const handleToggleOrder = (
    e: React.MouseEvent,
    orderId: string,
    status: string,
  ) => {
    e.stopPropagation();
    if (status !== "preparing" && status !== "ready") return;
    setSelectedOrders((prev) => {
      if (prev.includes(orderId)) return prev.filter((id) => id !== orderId);
      return [...prev, orderId];
    });
  };

  const handleAssignJobs = async (riderId: string) => {
    try {
      const payload = selectedOrders.map((orderId, index) => {
        return {
          order_id: orderId,
          rider_id: riderId,
          queue_number: index + 1,
        };
      });
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
    const confirmComplete = window.confirm(
      "ยืนยันว่าออเดอร์นี้จัดส่งเสร็จสิ้นแล้วใช่หรือไม่?",
    );
    if (!confirmComplete) return;

    try {
      const token =
        localStorage.getItem("auth_token") ||
        localStorage.getItem("firebase_token") ||
        "";
      const userDataString = localStorage.getItem("userData");
      const currentUser = userDataString
        ? JSON.parse(userDataString)
        : { uid: "admin" };
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

      const response = await fetch(
        `${apiUrl}/api/orders/orders_put/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ user_id: currentUser.uid, status: "pending" }),
        },
      );

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || "Failed to update order");
      }
      alert("อัปเดตสถานะเป็นส่งสำเร็จแล้ว! 🎉");
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    }
  };

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
        <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">
          กำลังโหลดรายการออเดอร์...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full p-6 w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-red-50 dark:bg-red-900/20 px-6 py-4 rounded-2xl border border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 font-medium text-center">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 overflow-hidden">
      <div className="shrink-0 px-5 pt-5 pb-4 border-b border-gray-200 dark:border-gray-800 z-10 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex bg-gray-100/80 dark:bg-gray-800 p-1.5 rounded-2xl shadow-inner border border-gray-200/50 dark:border-gray-700/50">
          <button
            onClick={() => {
              if (activeTab !== "kitchen") {
                setActiveTab("kitchen");
                setSelectedOrders([]);
                setOrders([]);
                setPage(1);
                setHasMore(true);
                setIsTabLoading(true);
              }
            }}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
              activeTab === "kitchen"
                ? "bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-[0_2px_8px_rgba(0,0,0,0.08)] ring-1 ring-black/5 dark:ring-white/10"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🍳</span>
              <span>ออเดอร์ใหม่</span>
            </div>
          </button>
          <button
            onClick={() => {
              if (activeTab !== "delivery") {
                setActiveTab("delivery");
                setSelectedOrders([]);
                setOrders([]);
                setPage(1);
                setHasMore(true);
                setIsTabLoading(true);
              }
            }}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
              activeTab === "delivery"
                ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-[0_2px_8px_rgba(0,0,0,0.08)] ring-1 ring-black/5 dark:ring-white/10"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🛵</span>
              <span>การจัดส่ง</span>
            </div>
          </button>
        </div>
      </div>

      {/* ส่วนแสดงรายการออเดอร์ พร้อมรับ Scroll */}
      <div
        className="flex-1 overflow-y-auto px-4 pb-6 xl:pb-28 pt-4 space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-gray-50/50 dark:bg-gray-900"
        onScroll={handleScroll}
      >
        {isTabLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin mb-4 shadow-sm"></div>
            <p className="text-gray-500 font-medium animate-pulse">
              กำลังโหลดข้อมูลแท็บนี้...
            </p>
          </div>
        ) : (
          <>
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
                <span className="text-6xl mb-4 opacity-50">📂</span>
                <p className="text-lg font-medium">ไม่มีออเดอร์ในหมวดหมู่นี้</p>
              </div>
            ) : (
              orders.map((order) => {
                const statusConfig = getStatusConfig(
                  (order.status as OrderStatus) || "new",
                );
                const isSelectable =
                  order.status === "preparing" || order.status === "ready";
                const selectionIndex = selectedOrders.indexOf(order.id);
                const isSelected = selectionIndex !== -1;

                // ดึงข้อมูล Rider จาก Backend
                const riderData =
                  (order as any).rider_name || (order as any).rider_profile;
                let riderNameStr = "ไรเดอร์ทั่วไป";
                let riderPhoto = "";

                if (riderData) {
                  if (typeof riderData === "string") {
                    riderNameStr = riderData;
                  } else {
                    riderNameStr =
                      riderData.displayName ||
                      riderData.name ||
                      "ไรเดอร์ทั่วไป";
                    riderPhoto = riderData.photoURL || "";
                  }
                }

                if (!riderPhoto) {
                  riderPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(riderNameStr)}&background=10b981&color=fff&rounded=true&bold=true`;
                }

                return (
                  <div
                    key={order.id}
                    onClick={() => handleOrderClick(order.id)}
                    className={`group relative bg-white dark:bg-gray-800/90 rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 ${
                      isSelected
                        ? "border-emerald-500 shadow-[0_4px_20px_rgb(16,185,129,0.15)] ring-1 ring-emerald-500"
                        : "border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                    }`}
                  >
                    {/* Header ของ Card */}
                    <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 flex justify-between items-start gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* 🌟 ปุ่ม Checkbox จัดคิว (มีเฉพาะแท็บ Kitchen) ย่อขนาดลง */}
                        {activeTab === "kitchen" && (
                          <div
                            onClick={(e) =>
                              handleToggleOrder(e, order.id, order.status)
                            }
                            className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-xl border-2 text-[15px] font-black transition-all duration-300 select-none shadow-sm ${
                              !isSelectable
                                ? "bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-600"
                                : isSelected
                                  ? "bg-gradient-to-br from-emerald-400 to-emerald-600 border-transparent text-white transform scale-105 shadow-emerald-500/30"
                                  : "bg-white border-gray-200 text-transparent hover:border-emerald-400 dark:bg-gray-700 dark:border-gray-600 dark:hover:border-emerald-500"
                            }`}
                          >
                            {isSelected ? selectionIndex + 1 : ""}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h2 className="text-[15px] font-bold text-gray-900 dark:text-white truncate">
                            {order.shipping?.recipient || "ไม่ระบุชื่อ"}
                          </h2>
                          <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                            <span className="opacity-80">
                              #{order.id.slice(-6)}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                            <span>{formatDate(order.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* 🌟 ด้านขวา: จัดกลุ่มป้าย Status และ เหตุผล ไว้ด้วยกัน (ชิดขวา) */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {/* ป้าย Status */}
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap flex items-center gap-1.5 ${statusConfig.bgColor} ${statusConfig.textColor}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor} animate-pulse`}
                          ></span>
                          {statusConfig.label}
                        </span>

                        {/* เหตุผลที่ปฏิเสธ (อยู่ใต้สถานะ และจะตรงกับระดับของเวลาฝั่งซ้ายพอดี) */}
                        {order.status === "refuse" && order.cancel_reason && (
                          <span
                            className="text-[10px] font-medium text-red-500 dark:text-red-400 truncate max-w-[120px]"
                            title={order.cancel_reason} // วางเมาส์เพื่อดูข้อความเต็มๆ ได้ถ้ามันยาวเกินไป
                          >
                            {order.cancel_reason}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ข้อมูล Rider แสดงแบบแถบเล็กกระทัดรัด */}
                    {activeTab === "delivery" &&
                      order.rider_id &&
                      order.rider_id !== "" && (
                        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-50 dark:border-gray-700/50 bg-blue-50/60 dark:bg-blue-900/10">
                          <img
                            src={riderPhoto}
                            alt="Rider"
                            className="w-6 h-6 rounded-full object-cover border border-white dark:border-gray-700 shadow-sm"
                          />
                          <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300">
                            ผู้จัดส่ง:{" "}
                            <span className="font-bold text-gray-800 dark:text-white ml-1">
                              {riderNameStr}
                            </span>
                          </span>
                        </div>
                      )}

                    {/* รายการอาหารหลัก (ซ่อนราคาและซ่อน Add-on) */}
                    <div className="px-4 py-2 space-y-1 bg-gray-50/30 dark:bg-gray-800/30">
                      {order.mainItems?.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center text-[13px]"
                        >
                          <span className="text-gray-700 dark:text-gray-300 truncate pr-2">
                            {item.name}
                            <span className="text-emerald-600 dark:text-emerald-400 ml-1.5 font-bold">
                              x{item.quantity}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Footer (ที่อยู่ + สถานะอุปกรณ์ & ช่องทางชำระเงิน) */}
                    <div className="px-4 py-3 bg-white dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                        <div className="flex items-start gap-1.5 flex-1">
                          <span className="text-red-400 shrink-0 mt-0.5">
                            📍
                          </span>
                          <span className="line-clamp-2 leading-relaxed">
                            {order.shipping?.address || "ไม่มีที่อยู่"}
                          </span>
                        </div>

                        {/* สถานะอุปกรณ์ รับเตากระทะ */}
                        {order.equipment?.needEquipment && (
                          <span className="shrink-0 bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 px-2 py-0.5 rounded-md font-semibold border border-orange-100 dark:border-orange-800/30">
                            รับเตากระทะ{" "}
                            {Math.max(
                              order.equipment.stoveCount || 1,
                              order.equipment.panCount || 1,
                            )}{" "}
                            ชุด
                          </span>
                        )}
                      </div>

                      {/* ช่องทางชำระเงิน */}
                      <div className="flex justify-between items-end mt-1">
                        <span className="text-[13px] font-bold text-gray-800 dark:text-gray-200">
                          {order.payment?.method === "cash"
                            ? "💵 เงินสดปลายทาง"
                            : order.payment?.method === "promptpay" ||
                                order.payment?.method === "transfer"
                              ? "📱 โอนเงิน / สแกนจ่าย"
                              : order.payment?.method
                                ? order.payment.method.toUpperCase()
                                : "ไม่ระบุ"}
                        </span>
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                          ฿{order.totals?.grandTotal?.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* ปุ่ม Action (แท็บการจัดส่ง) */}
                    {activeTab === "delivery" &&
                      order.status !== "ready" &&
                      order.status !== "shipping" && (
                        <div className="px-4 pb-4 bg-white dark:bg-gray-800/80 border-t-0">
                          <button
                            onClick={(e) => handleCompleteOrder(e, order.id)}
                            className="w-full py-2.5 rounded-xl font-bold text-[14px] shadow-sm transition-all flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white active:scale-[0.98]"
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
                                strokeWidth="2.5"
                                d="M5 13l4 4L19 7"
                              ></path>
                            </svg>
                            ยืนยันรับเงิน / ส่งสำเร็จ
                          </button>
                        </div>
                      )}
                  </div>
                );
              })
            )}

            {/* แสดงไอคอนโหลดต่อท้าย */}
            {isFetchingMore && hasMore && (
              <div className="py-6 flex flex-col items-center justify-center">
                <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin shadow-sm"></div>
                <p className="text-sm font-medium text-gray-500 mt-3 animate-pulse">
                  กำลังโหลดเพิ่มเติม...
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* แถบมอบหมายงานด้านล่าง */}
      <div
        className={`fixed bottom-[76px] xl:bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] p-3 sm:p-4 flex justify-between items-center transition-all duration-400 z-40 ${
          selectedOrders.length > 0
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-20 pointer-events-none"
        }`}
      >
        <div className="ml-2 sm:ml-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
            <span className="text-emerald-600 dark:text-emerald-400 text-lg font-black">
              {selectedOrders.length}
            </span>
          </div>
          <div className="text-gray-700 dark:text-gray-300 font-bold text-sm sm:text-base hidden sm:block">
            เลือกออเดอร์แล้ว
          </div>
        </div>
        <div className="mr-2 sm:mr-8">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 sm:px-10 py-3 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-emerald-500 dark:to-emerald-600 hover:from-black hover:to-gray-900 dark:hover:from-emerald-400 dark:hover:to-emerald-500 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
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
