/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { getSuccessOrders, type OrderSummary } from "../../../api/api_order";
import { getFreshToken } from "../../../../shared/infra/auth/token";

export default function OrderHistory() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // วันที่สำหรับแสดงตารางหลัก
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  // 🌟 State สำหรับ Modal PDF
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfStartDate, setPdfStartDate] = useState(selectedDate);
  const [pdfEndDate, setPdfEndDate] = useState(selectedDate);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // ฟังก์ชันยิง API สำหรับตารางหลัก
  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const data = await getSuccessOrders(selectedDate);
        setOrders(data || []);
      } catch (error: any) {
        console.error("Error fetching orders:", error);
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, [selectedDate]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      (order.recipient || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (order.order_id || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
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

  // 🌟 ฟังก์ชันจัดการ PDF Preview
  const handlePreviewPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfUrl(null); // เคลียร์ของเก่าก่อนโหลดใหม่
    const token = await getFreshToken();
    try {
      // 💡 เปลี่ยน URL ตรงนี้ให้ตรงกับ Backend API ของคุณ
      const apiUrl = `http://localhost:8080/api/orders/orders_get/success/pdf?start_date=${pdfStartDate}&end_date=${pdfEndDate}`;
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error("ไม่พบข้อมูลออเดอร์ หรือเกิดข้อผิดพลาดจากเซิร์ฟเวอร์");
      }

      // แปลงข้อมูลที่ได้มาเป็น Blob (ก้อนไฟล์ PDF)
      const blob = await response.blob();
      
      // สร้าง URL จำลองเพื่อให้ iframe เอาไปแสดงผลได้
      const objectUrl = URL.createObjectURL(blob);
      setPdfUrl(objectUrl);

    } catch (error: any) {
      console.error("PDF Preview Error:", error);
      alert(error.message || "เกิดข้อผิดพลาดในการสร้าง PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 🌟 ฟังก์ชันปิด Modal (และลบ URL จำลองเพื่อคืน Memory)
  const handleCloseModal = () => {
    setIsPdfModalOpen(false);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* ตัวกรองวันที่, ค้นหา และ ปุ่ม PDF */}
      <div className="flex flex-col md:flex-row gap-4 justify-between mb-6">
        <div className="flex flex-wrap items-center gap-4">
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

          <div className="relative w-full sm:w-64">
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* 🌟 ปุ่มเปิด Modal PDF */}
        <button
          onClick={() => setIsPdfModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          สร้างรายงาน PDF
        </button>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">สถานะ</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">ลูกค้า</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">สถานที่จัดส่ง</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">ยอดรวม</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">เวลาที่สั่งซื้อ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">กำลังโหลดข้อมูล...</td>
              </tr>
            ) : filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                const dateTime = formatDateTime(order.created_at);
                return (
                  <tr key={order.order_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">สำเร็จ</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{order.recipient || "ไม่ระบุ"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate" title={order.address}>{order.address || "ไม่ระบุ"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-white">฿{order.grand_total.toLocaleString()}</td>
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
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">ไม่พบข้อมูลออเดอร์ในวันที่ {selectedDate}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🌟 Modal สำหรับสร้าง PDF */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">สร้างรายงานสรุปยอด (PDF)</h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-red-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col flex-1 overflow-hidden">
              {/* ส่วนเลือกวันที่ */}
              <div className="flex flex-col sm:flex-row gap-4 items-end mb-6">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">วันที่เริ่มต้น</label>
                  <input
                    type="date"
                    value={pdfStartDate}
                    onChange={(e) => setPdfStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">วันที่สิ้นสุด</label>
                  <input
                    type="date"
                    value={pdfEndDate}
                    onChange={(e) => setPdfEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                </div>
                <button
                  onClick={handlePreviewPdf}
                  disabled={isGeneratingPdf}
                  className="w-full sm:w-auto px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-lg font-medium transition-colors"
                >
                  {isGeneratingPdf ? "กำลังสร้าง..." : "ดูตัวอย่าง (Preview)"}
                </button>
              </div>

              {/* พื้นที่แสดง Preview PDF */}
              <div className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900 flex items-center justify-center min-h-[400px]">
                {isGeneratingPdf ? (
                  <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                    <svg className="animate-spin w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>กำลังโหลดเอกสาร...</span>
                  </div>
                ) : pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    className="w-full h-full border-0"
                    title="PDF Preview"
                  />
                ) : (
                  <div className="text-gray-400 dark:text-gray-500 text-center">
                    <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>กรุณากดปุ่ม "ดูตัวอย่าง" เพื่อแสดงรายงาน</p>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}