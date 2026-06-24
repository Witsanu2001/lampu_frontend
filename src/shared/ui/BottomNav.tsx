/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link, useLocation } from "react-router-dom";
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
  const location = useLocation();

  if (!user || isPaymentPage) return null;

  return (
    <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-50 bg-emerald-50 dark:bg-emerald-900/20 border-t border-emerald-100 dark:border-emerald-800 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] flex justify-around items-center p-2">
      {menuConfig.filter(hasPermission).map((item, index) => {
        const isActive = location.pathname === item.to;
        return (
          <Link
            key={index}
            to={item.to}
            className={`flex flex-col items-center p-4 rounded-lg transition-all duration-200 
              active:opacity-80
              ${
                isActive
                  ? "bg-emerald-200 dark:bg-emerald-700/50 text-emerald-800 dark:text-emerald-300"
                  : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-800/30"
              }`}
          >
            <div className="w-6 h-6 mb-1 relative flex justify-center items-center">
              {item.iconUrl ? (
                <img
                  src={item.iconUrl}
                  alt={item.label}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="w-full h-full bg-gray-300 rounded-sm"></div>
              )}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
