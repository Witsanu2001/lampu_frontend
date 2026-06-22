/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { getStoveOrders, type StoveJob } from "../../../api/api_order";

// สร้าง Interface ให้ตรงกับโครงสร้างที่ API ส่งมา

export default function OrderStove() {
  const [jobs, setJobs] = useState<StoveJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchStoveJobs = async () => {
      setIsLoading(true);
      try {
        const data = await getStoveOrders();

        // เนื่องจากฟังก์ชัน getSuccessOrders รีเทิร์น json.data ออกมาให้เลย
        setJobs(data || []);
      } catch (error: any) {
        console.error("Error fetching orders:", error);
        setJobs([]);
        // 💡 เพิ่มเติม: คุณสามารถเพิ่ม state เก็บข้อความ error ไปโชว์ที่หน้าจอได้หากต้องการ
        // setError(error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล");
      } finally {
        setIsLoading(false); // ปิดสถานะโหลด
      }
    };

    fetchStoveJobs();
  }, []);

  // ฟังก์ชันค้นหาจาก ชื่อ หรือ เลขออเดอร์
  const filteredJobs = jobs.filter((job: any) => {
    const recipient = job.shipping?.recipient || ""; // ✨ เปลี่ยนตรงนี้
    const matchesSearch =
      recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.order_id || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header & ค้นหา */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            รายการเก็บเตา
          </h2>
          <p className="text-sm text-gray-500">
            ออเดอร์ที่จัดส่งสำเร็จและรอรับอุปกรณ์คืน
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <input
            type="text"
            placeholder="ค้นหาลูกค้า, เลขออเดอร์..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
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

      {/* Stove Jobs Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full">
          <thead className="bg-orange-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-orange-800 dark:text-gray-300 uppercase tracking-wider">
                สถานะ
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-orange-800 dark:text-gray-300 uppercase tracking-wider">
                ลูกค้า
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-orange-800 dark:text-gray-300 uppercase tracking-wider">
                สถานที่เก็บเตา
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-orange-800 dark:text-gray-300 uppercase tracking-wider">
                จำนวนเตา
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-orange-800 dark:text-gray-300 uppercase tracking-wider">
                จำนวนกระทะ
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
            ) : filteredJobs.length > 0 ? (
              filteredJobs.map((job: any) => {
                // 🎯 1. แก้ไขตรงนี้: ดึง shipping มาจาก job โดยตรงเลย ไม่ต้องผ่าน order_details
                const shipping = job.shipping;

                return (
                  <tr
                    key={job.order_id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {job.status === "pending" ? (
                        <span className="px-4 py-2 inline-flex text-xs font-semibold rounded-lg border border-red-300 bg-red-50 text-red-500 dark:border-red-600 dark:bg-red-700/50 dark:text-red-400">
                          รอเก็บ
                        </span>
                      ) : job.status === "success" ? (
                        <span className="px-4 py-2 inline-flex text-xs font-semibold rounded-lg bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
                          เก็บแล้ว
                        </span>
                      ) : (
                        <span className="px-3 py-1 inline-flex text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                          {job.status}
                        </span>
                      )}
                    </td>

                    {/* 🎯 2. แก้ไขตรงนี้: เติมเครื่องหมาย ? หลังตัวแปร shipping ทั้งหมด */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      <div>{shipping?.recipient || "ไม่ระบุ"}</div>
                      <div className="text-xs text-gray-500">
                        {shipping?.phone || ""}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate"
                      title={shipping?.address}
                    >
                      {shipping?.address || "ไม่ระบุ"}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-orange-600 dark:text-orange-400">
                      {job.equipment?.stoveCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-orange-600 dark:text-orange-400">
                      {job.equipment?.panCount || 0}
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
                  ไม่มีรายการรอเก็บเตาในขณะนี้
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
