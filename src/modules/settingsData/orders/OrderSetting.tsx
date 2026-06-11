import { useState } from "react";

export default function OrderSetting() {
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const orders = [
    {
      id: "#ORD-001",
      customer: "สมชาย ใจดี",
      items: "ชุดหมูกระทะ x2, น้ำโค้ก x1",
      total: 735,
      status: "เสร็จสิ้น",
      date: "2024-01-15",
      time: "10:30",
    },
    {
      id: "#ORD-002",
      customer: "วิภา สุขใจ",
      items: "ชุดไก่กระทะ x1, ยำสาหร่าย x2",
      total: 418,
      status: "กำลังจัดส่ง",
      date: "2024-01-15",
      time: "10:15",
    },
    {
      id: "#ORD-003",
      customer: "นิติ รักษ์ดี",
      items: "ชุดทะเลกระทะ x1, ถ่าน x2",
      total: 470,
      status: "รอดำเนินการ",
      date: "2024-01-15",
      time: "09:45",
    },
    {
      id: "#ORD-004",
      customer: "มานี มีสุข",
      items: "ชุดหมูกระทะ x1",
      total: 350,
      status: "เสร็จสิ้น",
      date: "2024-01-14",
      time: "18:30",
    },
    {
      id: "#ORD-005",
      customer: "ประยุทธ์ มั่นคง",
      items: "ชุดไก่กระทะ x1",
      total: 320,
      status: "ยกเลิก",
      date: "2024-01-14",
      time: "17:20",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "เสร็จสิ้น":
        return "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400";
      case "กำลังจัดส่ง":
        return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400";
      case "รอดำเนินการ":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400";
      case "ยกเลิก":
        return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400";
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = selectedStatus === "all" || order.status === selectedStatus;
    const matchesSearch =
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    all: orders.length,
    เสร็จสิ้น: orders.filter((o) => o.status === "เสร็จสิ้น").length,
    "กำลังจัดส่ง": orders.filter((o) => o.status === "กำลังจัดส่ง").length,
    "รอดำเนินการ": orders.filter((o) => o.status === "รอดำเนินการ").length,
    ยกเลิก: orders.filter((o) => o.status === "ยกเลิก").length,
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          จัดการคำสั่งซื้อ
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          ตรวจสอบและจัดการสถานะคำสั่งซื้อ
        </p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: "all", label: "ทั้งหมด" },
          { key: "รอดำเนินการ", label: "รอดำเนินการ" },
          { key: "กำลังจัดส่ง", label: "กำลังจัดส่ง" },
          { key: "เสร็จสิ้น", label: "เสร็จสิ้น" },
          { key: "ยกเลิก", label: "ยกเลิก" },
        ].map((status) => (
          <button
            key={status.key}
            onClick={() => setSelectedStatus(status.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedStatus === status.key
                ? "bg-emerald-500 text-white"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {status.label} ({statusCounts[status.key as keyof typeof statusCounts]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="ค้นหาคำสั่งซื้อ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
          />
          <svg
            className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  รหัสคำสั่งซื้อ
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  ลูกค้า
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  รายการ
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  ยอดรวม
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  วันที่/เวลา
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-white">
                    {order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {order.customer}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                    {order.items}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-white">
                    ฿{order.total}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        order.status,
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <div>{order.date}</div>
                      <div className="text-xs">{order.time}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-500/20 dark:hover:bg-blue-500/40 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-lg transition-colors">
                        ดูรายละเอียด
                      </button>
                      <button className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-xs font-medium rounded-lg transition-colors">
                        แก้ไข
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              ไม่พบคำสั่งซื้อ
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
