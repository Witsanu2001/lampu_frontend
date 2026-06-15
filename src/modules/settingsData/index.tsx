import { Link } from "react-router-dom";

export default function Settingsdata() {
  return (
    <div className="p-6 max-w-5xl mx-auto font-sans">
      {/* Header Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          จัดการระบบ (System Settings)
        </h2>
      </div>

      {/* Grid Layout สำหรับการ์ด */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        
        {/* 1. Dashboard Card */}
        <Link
          to="/settingsData/dashboards"
          className="flex items-start bg-white rounded-2xl p-6 shadow-sm border border-gray-100 border-l-4 border-l-blue-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-gray-200"
        >
          <div className="text-4xl mr-5 bg-blue-50 text-blue-500 w-16 h-16 flex items-center justify-center rounded-xl shrink-0">
            📊
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Dashboard
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              ดูสรุปยอดขาย สถิติรายวัน และภาพรวมของร้าน
            </p>
          </div>
        </Link>

        {/* 2. Users Card */}
        <Link
          to="/settingsData/users"
          className="flex items-start bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-gray-200"
        >
          <div className="text-4xl mr-5 bg-gray-50 w-16 h-16 flex items-center justify-center rounded-xl shrink-0">
            👥
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Users
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              จัดการข้อมูลผู้ใช้งานและสิทธิ์ต่างๆ ในระบบ
            </p>
          </div>
        </Link>

        {/* 3. Menu Card */}
        <Link
          to="/settingsData/menu"
          className="flex items-start bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-gray-200"
        >
          <div className="text-4xl mr-5 bg-gray-50 w-16 h-16 flex items-center justify-center rounded-xl shrink-0">
            🍔
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Menu
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              จัดการรายการอาหาร ราคา และสถานะการขาย
            </p>
          </div>
        </Link>

        {/* 4. Orders Card */}
        <Link
          to="/settingsData/orders"
          className="flex items-start bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-gray-200"
        >
          <div className="text-4xl mr-5 bg-gray-50 w-16 h-16 flex items-center justify-center rounded-xl shrink-0">
            🛒
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Orders
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              ดูประวัติและจัดการสถานะออเดอร์ทั้งหมด
            </p>
          </div>
        </Link>

      </div>
    </div>
  );
}