import { useState } from "react";
import OrderHistory from "./components/OrderHistory";
import OrderStove from "./components/OrderStove";

export default function OrderSetting() {
  // กำหนดให้หน้า history เป็นหน้าเริ่มต้น
  const [activeTab, setActiveTab] = useState<"history" | "stove">("history");

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header & Tabs */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
          จัดการคำสั่งซื้อ
        </h1>

        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-colors ${
              activeTab === "history"
                ? "bg-emerald-50 text-emerald-600 border-b-2 border-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            ประวัติการสั่ง (สำเร็จ)
          </button>
          
          <button
            onClick={() => setActiveTab("stove")}
            className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-colors ${
              activeTab === "stove"
                ? "bg-emerald-50 text-emerald-600 border-b-2 border-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            รายการเก็บเตา
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div>
        {activeTab === "history" ? <OrderHistory /> : <OrderStove />}
      </div>
    </div>
  );
}