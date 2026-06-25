/* eslint-disable @typescript-eslint/no-explicit-any */
import { NavLink} from "react-router-dom";
import { menuConfig, type MenuItem } from "./menu";

interface BottomNavProps {
  user: any;
  isPaymentPage: boolean;
  hasPermission: (item: MenuItem) => boolean;
}

export default function BottomNav({
  user,
  isPaymentPage,
  hasPermission,
}: BottomNavProps) {
  if (!user || isPaymentPage) return null;

  return (
    <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-800 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] flex justify-around items-center p-2">
      {menuConfig.filter(hasPermission).map((item, index) => {
        return (
          <NavLink
            key={index}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center p-4 rounded-lg transition-all duration-200 ${
                isActive
                  ? "text-blue-600 dark:text-blue-400 scale-110"
                  : "text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400"
              }`
            }
          >
            <div className="w-6 h-6 mb-1 relative flex justify-center items-center">
              {item.iconUrl ? (
                <img
                  src={item.iconUrl}
                  alt={item.label}
                  className="max-w-full max-h-full object-contain transition-all"
                />
              ) : (
                <div className="w-full h-full bg-gray-300 dark:bg-gray-700 rounded-sm transition-colors"></div>
              )}
            </div>
          </NavLink>
        );
      })}
    </nav>
  );
}
