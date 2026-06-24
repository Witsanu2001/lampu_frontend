/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { getSuccessOrders } from "../../../api/api_order";

export default function OrderHistory() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // กำหนดวันที่เริ่มต้น
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  // 🌟 State สำหรับ Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // 🌟 State สำหรับ Modal แสดงสลิป
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [currentSlipURL, setCurrentSlipURL] = useState("");

  const [selectedFilter, setSelectedFilter] = useState("");

  const [expandedAddOns, setExpandedAddOns] = useState<Record<string, boolean>>(
    {},
  );

  const toggleAddOn = (orderId: string) => {
    setExpandedAddOns((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  // ดึงข้อมูลเมื่อ วันที่, หน้า หรือ จำนวนต่อหน้า เปลี่ยนแปลง
  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const data = await getSuccessOrders(
          selectedDate,
          currentPage,
          rowsPerPage,
        );
        // สมมติว่า data เป็น Array ที่ดึงมาได้
        setOrders(data || []);
      } catch (error: any) {
        console.error("Error fetching orders:", error);
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, [selectedDate, currentPage, rowsPerPage]);

  // ค้นหาข้อมูล (Client-side สำหรับข้อมูลในหน้านั้นๆ)
  const filteredOrders = orders.filter((order) => {
    // 1. เช็คคำค้นหา
    const matchesSearch =
      (order.shipping?.recipient || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (order.id || "").toLowerCase().includes(searchTerm.toLowerCase());

    // 2. เช็คตัวกรองจาก Dropdown
    let matchesFilter = true;
    if (selectedFilter !== "") {
      if (selectedFilter === "menu_อิ่มจุใจ") {
        // ตรวจสอบว่าในออเดอร์มีเมนูนี้หรือไม่
        matchesFilter = order.mainItems?.some((item: any) =>
          item.name.includes("อิ่มจุใจ"),
        );
      } else if (selectedFilter === "menu_ครอบครัว") {
        matchesFilter = order.mainItems?.some((item: any) =>
          item.name.includes("ครอบครัว"),
        );
      } else if (selectedFilter.startsWith("rider_")) {
        // สมมติว่าใน order มีข้อมูลไรเดอร์ (ถ้ามี)
        // matchesFilter = order.rider?.id === selectedFilter.replace("rider_", "");
      }
    }

    return matchesSearch && matchesFilter;
  });

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

  // 🌟 อัปเดตฟังก์ชัน checkMethod ให้เปิด Modal แทน window.open
  const checkMethod = (order: any) => {
    if (order.payment?.method === "เก็บเงินปลายทาง") {
      return (
        <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-md whitespace-nowrap">
          ปลายทาง
        </span>
      );
    } else {
      return (
        <button
          onClick={() => {
            setCurrentSlipURL(order.payment?.slipURL || "");
            setIsSlipModalOpen(true);
          }}
          className="text-blue-600 hover:text-blue-800 underline font-medium flex items-center justify-center gap-1 mx-auto transition-colors"
        >
          โอนเงิน 📄
        </button>
      );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 relative">
      {/* 🌟 Modal สำหรับแสดงสลิป */}
      {isSlipModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full relative shadow-2xl flex flex-col items-center">
            <button
              onClick={() => setIsSlipModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full transition-colors"
            >
              ❌
            </button>
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
              หลักฐานการโอนเงิน
            </h3>
            {currentSlipURL ? (
              <img
                src={currentSlipURL}
                alt="Slip"
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
              />
            ) : (
              <p className="text-gray-500 py-10">ไม่พบรูปภาพสลิป</p>
            )}
          </div>
        </div>
      )}

      {/* ตัวกรองวันที่ และ ค้นหา */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center mb-6">
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* 1. ค้นหาด้วยวันที่ */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none w-full sm:w-auto"
          />

          {/* 2. 🌟 เพิ่ม Dropdown ตัวกรอง */}
          <select
            value={selectedFilter}
            onChange={(e) => {
              setSelectedFilter(e.target.value);
              setCurrentPage(1); // เปลี่ยนตัวกรอง ให้กลับไปหน้า 1 เสมอ
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none w-full sm:w-auto cursor-pointer"
          >
            <option value="">ทั้งหมด (รวมทุกรายการ)</option>

            <optgroup label="👨‍🏍 เลือกไรเดอร์">
              <option value="rider_somchai">สมชาย</option>
              <option value="rider_somsri">สมศรี</option>
            </optgroup>

            <optgroup label="🍲 เลือกชุดเมนูหลัก">
              <option value="menu_อิ่มจุใจ">ชุดหมูกระทะอิ่มจุใจ</option>
              <option value="menu_ครอบครัว">ชุดหมูกระทะครอบครัว</option>
            </optgroup>
          </select>

          {/* 3. ค้นหาด้วยข้อความ */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="ค้นหาลูกค้า, เลขออเดอร์..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
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

        <div className="bg-gray-50 dark:bg-gray-700/40 p-4 rounded-xl border border-gray-200 dark:border-gray-600 min-w-[280px] w-full lg:w-auto shadow-sm">
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">
                ยอดรวมค่าส่ง:
              </span>
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                ฿0.00
              </span>{" "}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">
                ยอดรวมเมนูเพิ่มเติม:
              </span>
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                ฿0.00
              </span>{" "}
            </div>
            <div className="flex justify-between items-center pt-2 mt-1 border-t border-gray-200 dark:border-gray-600">
              <span className="font-bold text-gray-800 dark:text-white">
                ยอดรวมทั้งหมด:
              </span>
              <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                ฿0.00
              </span>{" "}
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full">
          <thead className="bg-blue-200/80 dark:bg-blue-400/80">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-white uppercase tracking-wider">
                ออเดอร์
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-white uppercase tracking-wider">
                ลูกค้า
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-white uppercase tracking-wider">
                สถานที่
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-white uppercase tracking-wider">
                เบอร์โทร
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold whitespace-nowrap text-gray-600 dark:text-white uppercase tracking-wider">
                ยอดเมนูเพิ่มเติม
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold whitespace-nowrap text-gray-600 dark:text-white uppercase tracking-wider">
                ค่าส่ง
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold whitespace-nowrap text-gray-600 dark:text-white uppercase tracking-wider">
                ยอดรวม
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold whitespace-nowrap text-gray-600 dark:text-white uppercase tracking-wider">
                การจ่ายเงิน
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold whitespace-nowrap text-gray-600 dark:text-white uppercase tracking-wider">
                เวลาที่สั่งซื้อ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-6 py-12 text-center text-gray-500 font-medium"
                >
                  <div className="flex justify-center items-center gap-2">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    กำลังโหลดข้อมูล...
                  </div>
                </td>
              </tr>
            ) : filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                const dateTime = formatDateTime(
                  order.created_at || order.CreatedAt,
                );

                const isExpanded = expandedAddOns[order.id] || false;

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 min-w-[250px] max-w-[300px]">
                      <ul className="list-none space-y-1">
                        {/* --- ชุดหลัก --- */}
                        {order.mainItems && order.mainItems.length > 0 && (
                          <div className="mb-2">
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1 block">
                              ชุดหลัก
                            </span>
                            <ul className="list-none space-y-1 w-full">
                              {order.mainItems.map(
                                (item: any, index: number) => (
                                  <li
                                    key={`main-${index}`}
                                    className="flex justify-between items-center gap-2 w-full"
                                  >
                                    <span
                                      className="flex-1 truncate font-medium text-gray-900 dark:text-white"
                                      title={item.name}
                                    >
                                      {index + 1}. {item.name}
                                    </span>
                                    <span className="flex-shrink-0 whitespace-nowrap text-gray-500 dark:text-gray-400 font-semibold">
                                      x {item.quantity}
                                    </span>
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}

                        {/* --- เมนูเพิ่มเติม (มีปุ่ม Toggle ยืดหด) --- */}
                        {order.addOnItems && order.addOnItems.length > 0 && (
                          <div className="pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                            {/* ปุ่มกดเปิด-ปิด */}
                            <button
                              onClick={() => toggleAddOn(order.id)}
                              className="flex items-center gap-1 text-xs font-bold text-orange-500 dark:text-orange-400 mb-1 hover:text-orange-600 transition-colors w-full outline-none"
                            >
                              <svg
                                className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                              เมนูเพิ่มเติม ({order.addOnItems.length} รายการ)
                            </button>

                            {/* แสดงรายการเมื่อกดเปิด (isExpanded === true) */}
                            {isExpanded && (
                              <ul className="list-none space-y-1 w-full pl-5 mt-2 transition-all duration-300">
                                {order.addOnItems.map(
                                  (item: any, index: number) => (
                                    <li
                                      key={`addon-${index}`}
                                      className="flex justify-between items-center gap-2 w-full"
                                    >
                                      <span
                                        className="flex-1 truncate font-medium text-gray-900 dark:text-white"
                                        title={item.name}
                                      >
                                        - {item.name}
                                      </span>
                                      <span className="flex-shrink-0 whitespace-nowrap text-gray-500 dark:text-gray-400 font-semibold">
                                        x {item.quantity}
                                      </span>
                                    </li>
                                  ),
                                )}
                              </ul>
                            )}
                          </div>
                        )}
                      </ul>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {order.shipping?.recipient || "ไม่ระบุ"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
                      {order.shipping?.address || "ไม่ระบุ"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {order.shipping?.phone || "ไม่ระบุ"}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                      ฿{order.totals?.addOnTotal || "0"}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                      ฿{order.totals?.shippingFee || "0"}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      ฿{order.totals?.grandTotal || "0"}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                      {checkMethod(order)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {dateTime.date} {dateTime.time} น.
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={10}
                  className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  ไม่พบข้อมูลออเดอร์
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            แสดงหน้าละ:
          </span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1); // รีเซ็ตไปหน้า 1 เมื่อเปลี่ยน limit
            }}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white outline-none cursor-pointer"
          >
            <option value={9999}>ทั้งหมด</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
            | โชว์ข้อมูล <strong>{orders.length}</strong> รายการในหน้านี้
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            หน้าที่{" "}
            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md">
              {currentPage}
            </span>
          </span>

          <div className="flex gap-2">
            <button
              disabled={currentPage === 1 || isLoading}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              {"<<"}
            </button>
            <button
              // ปิดปุ่ม "ถัดไป" หากข้อมูลที่ดึงมาน้อยกว่า limit (แปลว่าหน้าสุดท้ายแล้ว)
              disabled={orders.length < rowsPerPage || isLoading}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              {">>"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}