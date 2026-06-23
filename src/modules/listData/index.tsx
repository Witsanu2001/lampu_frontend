import { Link } from "react-router-dom";

export default function Listdata() {
  return (
    <div className="p-6 max-w-5xl mx-auto font-sans">
      {/* Grid Layout สำหรับการ์ด */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Link
          to="/listData/history"
          className="flex items-start bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 border-l-4 border-l-blue-500 dark:border-l-blue-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-gray-200 dark:hover:border-gray-600"
        >
          <div className="text-4xl mr-5 bg-blue-50 text-blue-500 w-16 h-16 flex items-center justify-center rounded-xl shrink-0">
            📜
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              ประวัติการสั่งซื้อ
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              ดูประวัติการสั่งซื้อ
            </p>
          </div>
        </Link>

      </div>
    </div>
  );
}