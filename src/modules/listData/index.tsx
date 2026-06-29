import { Link } from "react-router-dom";

export default function Listdata() {
  return (
    <div className="h-full p-6 w-full overflow-y-auto bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors duration-200 max-lg:[&::-webkit-scrollbar]:hidden max-lg:[scrollbar-width:none]">
      <div className="grid grid-cols-1 gap-4">
        <Link
          to="/listData/history"
          className="flex items-start bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 shadow-sm border border-blue-100 dark:border-blue-800 border-l-4 border-l-blue-500 dark:border-l-blue-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-green-400 dark:hover:border-green-600"
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