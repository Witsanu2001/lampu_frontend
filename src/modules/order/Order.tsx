// src/modules/order/Order.tsx
export default function Order() {
  return (
    // 🌟 ใส่ h-full และ overflow-y-auto เพื่อให้หน้านี้เลื่อนขึ้นลงได้โดยไม่กระทบเมนูหลัก
    <div className="h-full w-full overflow-y-auto p-6 text-gray-800 dark:text-gray-100">
      <div className="mx-auto bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        
        <h1 className="text-2xl font-bold mb-6 border-b pb-4 dark:border-gray-700">
          รายการออเดอร์ของคุณ
        </h1>
        
        {/* จำลองรายการออเดอร์ยาวๆ */}
        <div className="flex flex-col gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => (
            <div key={item} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="font-semibold">ออเดอร์ที่ #{item}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">สถานะ: กำลังดำเนินการ...</p>
            </div>
          ))}
        </div>
        
      </div>
    </div>
  );
}