/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { getSuccessOrders, type OrderSummary } from "../../../api/api_order";

export default function OrderHistory() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  // กำหนดวันที่เริ่มต้นเป็น 2026-06-16 ตามโจทย์
  const [selectedDate, setSelectedDate] = useState("2026-06-16");

  // ฟังก์ชันยิง API
  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true); // เปิดสถานะกำลังโหลด
      try {
        // 🌟 เรียกใช้งาน API Service แทนการสั่ง fetch เองตรงๆ
        const data = await getSuccessOrders(selectedDate);

        // เนื่องจากฟังก์ชัน getSuccessOrders รีเทิร์น json.data ออกมาให้เลย
        setOrders(data || []);
      } catch (error: any) {
        console.error("Error fetching orders:", error);
        setOrders([]);
        // 💡 เพิ่มเติม: คุณสามารถเพิ่ม state เก็บข้อความ error ไปโชว์ที่หน้าจอได้หากต้องการ
        // setError(error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล");
      } finally {
        setIsLoading(false); // ปิดสถานะโหลด
      }
    };

    fetchOrders();
  }, [selectedDate]); // ทำงานใหม่ทุกครั้งที่ selectedDate เปลี่ยนแปลง

  // ฟังก์ชันค้นหาจาก ชื่อ หรือ เลขออเดอร์
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      (order.recipient || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (order.order_id || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // ฟังก์ชันจัดฟอร์แมตเวลา
  const formatDateTime = (dateString: string) => {
    const d = new Date(dateString);
    return {
      date: d.toLocaleDateString("th-TH"),
      time: d.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* ตัวกรองวันที่ และ ค้นหา */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            เลือกวันที่:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          />
        </div>

        <div className="relative max-w-xs w-full">
          <input
            type="text"
            placeholder="ค้นหาลูกค้า, เลขออเดอร์..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
          />
          <svg
            className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
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
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                สถานะ
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                ลูกค้า
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                สถานที่จัดส่ง
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                ยอดรวม
              </th>
              {/* <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                สถานะ
              </th> */}
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                เวลาที่สั่งซื้อ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  กำลังโหลดข้อมูล...
                </td>
              </tr>
            ) : filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                const dateTime = formatDateTime(order.created_at);
                return (
                  <tr
                    key={order.order_id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
                        สำเร็จ
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {order.recipient || "ไม่ระบุ"}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate"
                      title={order.address}
                    >
                      {order.address || "ไม่ระบุ"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-white">
                      ฿{order.grand_total.toLocaleString()}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      <div>
                        <div>{dateTime.date}</div>
                        <div className="text-xs">{dateTime.time} น.</div>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  ไม่พบข้อมูลออเดอร์ในวันที่ {selectedDate}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
