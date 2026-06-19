import { useState } from "react";
import OrderHistory from "./components/OrderHistory";
import OrderStove from "./components/OrderStove";
import { useNavigate } from "react-router-dom";

export default function OrderSetting() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"history" | "stove">("history");

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-6">
        <button
          onClick={() => navigate("/settingsData")}
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
          จัดการคำสั่งซื้อ 🛒
        </button>

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