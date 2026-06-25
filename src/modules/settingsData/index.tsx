import { Link } from "react-router-dom";

export default function Settingsdata() {
  return (
    <div className="h-full p-6 w-full overflow-y-auto bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors duration-200 max-lg:[&::-webkit-scrollbar]:hidden max-lg:[scrollbar-width:none]">
      <div className="grid grid-cols-1 gap-4">
        <Link
          to="/settingsData/dashboards"
          className="flex items-start bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 shadow-sm border border-blue-100 dark:border-blue-800 border-l-4 border-l-blue-500 dark:border-l-blue-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-green-400 dark:hover:border-green-600"
        >
          <div className="text-4xl mr-5 bg-blue-100/80 dark:bg-blue-400/20 text-blue-500 w-16 h-16 flex items-center justify-center rounded-xl shrink-0">
            📊
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
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
          className="flex items-start bg-blue-50  dark:bg-blue-900/20 rounded-2xl p-6 shadow-sm border border-blue-100 dark:border-blue-800 border-l-4 border-l-blue-500 dark:border-l-blue-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-green-400 dark:hover:border-green-600"
        >
          <div className="text-4xl mr-5 bg-blue-100/80 dark:bg-blue-400/20 w-16 h-16 flex items-center justify-center rounded-xl shrink-0">
            👥
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
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
          className="flex items-start bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 shadow-sm border border-blue-100 dark:border-blue-800 border-l-4 border-l-blue-500 dark:border-l-blue-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-green-400 dark:hover:border-green-600"
        >
          <div className="text-4xl mr-5 bg-blue-100/80 dark:bg-blue-400/20 w-16 h-16 flex items-center justify-center rounded-xl shrink-0">
            🍔
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
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
          className="flex items-start bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 shadow-sm border border-blue-100 dark:border-blue-800 border-l-4 border-l-blue-500 dark:border-l-blue-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-green-400 dark:hover:border-green-600"
        >
          <div className="text-4xl mr-5 bg-blue-100/80 dark:bg-blue-400/20 w-16 h-16 flex items-center justify-center rounded-xl shrink-0">
            🛒
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Orders
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              ดูประวัติและจัดการสถานะออเดอร์ทั้งหมด
            </p>
          </div>
        </Link>

        <Link
          to="/settingsData/systems"
          className="flex items-start bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 shadow-sm border border-blue-100 dark:border-blue-800 border-l-4 border-l-blue-500 dark:border-l-blue-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-green-400 dark:hover:border-green-600"
        >
          <div className="text-4xl mr-5 bg-blue-100/80 dark:bg-blue-400/20 w-16 h-16 flex items-center justify-center rounded-xl shrink-0">
            ⚙️
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Systems
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              ตั้งค่าระบบร้านค้า
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
