/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { auth } from "../../modules/const/firebase";
import liff from "@line/liff";
import { useCart } from "../context/CartContext";
import CartModal from "../components/CartModal";
import defaultAvatar from "../../assets/profile.png";

interface HeaderProps {
  user: any;
  setUser: (user: any) => void;
}

// 🌟 สร้างตัวแปรเช็คว่ารันบน localhost (ทดสอบ) หรือไม่
const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

export default function Header({ user, setUser }: HeaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { cartCount } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);

  const LOGO_URL =
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRSFvdyWq2xH0rP3uHBFHY6WP5tKMUx74VJ8g&s";

  useEffect(() => {
    if (cartCount > 0) {
      setIsBouncing(true);
      const timer = setTimeout(() => setIsBouncing(false), 300);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const isDark =
      savedTheme === "dark" ||
      (!savedTheme &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDarkMode(isDark);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    const newTheme = isDarkMode ? "light" : "dark";
    localStorage.setItem("theme", newTheme);
    setIsDarkMode(!isDarkMode);
  };

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    try {
      await auth.signOut();

      try {
        if (typeof liff !== "undefined" && liff.id && liff.isLoggedIn()) {
          liff.logout();
        }
      } catch (err) {
        console.warn("LIFF logout skipped or failed:", err);
      }

      localStorage.clear();

      // ปักธงว่าเป็นการบังคับออกจากระบบ
      localStorage.setItem("forceLogout", "true");

      setUser(null);
      setShowLogoutModal(false);
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <>
      <header className="flex w-full px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 justify-between items-center transition-colors duration-200 z-20">
        <div className="flex items-center gap-2">
          <img
            src={LOGO_URL}
            alt="Logo"
            className="w-8 h-8 rounded-full object-cover"
          />
          <strong className="hidden md:block text-lg text-gray-800 dark:text-gray-100 tracking-wide">
            Lampu Moo Krata
          </strong>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            id="cart-icon"
            onClick={() => setIsCartOpen(true)}
            className={`relative p-2 rounded-full focus:outline-none transition-all duration-300 ${
              isBouncing
                ? "scale-125 bg-orange-100 dark:bg-orange-900/40 text-orange-600"
                : "scale-100 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-orange-500 rounded-full border-2 border-white dark:border-gray-800">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200 focus:outline-none"
          >
            {isDarkMode ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 hidden sm:block"></div>

          <div className="flex items-center gap-2">
            {/* 🌟 2. เอาเงื่อนไขที่ครอบอยู่ออก ให้ render <img> เสมอ */}
            <img
              src={user?.photoURL || defaultAvatar}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border"
              onError={(e: any) => {
                e.target.onerror = null; // ป้องกันการพยายามโหลดซ้ำไม่สิ้นสุด
                e.target.src = defaultAvatar; // 🌟 3. ถ้า URL ของรูปเสีย (โหลดไม่ขึ้น) ให้เปลี่ยนเป็นรูปที่ import มา
              }}
            />

            <span className="text-sm font-medium text-gray-800 dark:text-gray-100 hidden sm:block">
              {user?.displayName || "ผู้ใช้งาน"}
            </span>
          </div>

          {/* 🌟 ซ่อนปุ่มออกจากระบบถ้าเป็น Production (แสดงเฉพาะ Localhost) */}
          {isLocalhost && (
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center justify-center p-2 md:px-3 md:py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 border border-gray-200 dark:border-gray-600 rounded-md transition-all"
            >
              <span className="hidden md:block text-[13px] font-bold">
                ออกจากระบบ
              </span>
              <svg
                className="w-6 h-6 md:hidden"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          )}

          {/* 🌟 ซ่อน Modal ออกจากระบบใน Production เช่นเดียวกัน */}
          {showLogoutModal && isLocalhost && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center border border-gray-100 dark:border-gray-700 transform transition-all animate-in zoom-in-95 duration-150">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  ออกจากระบบ?
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
                  คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?
                  ข้อมูลและแคชทั้งหมดในแอปพลิเคชันนี้จะถูกล้างออกทันที
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-all active:scale-95 text-sm"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all active:scale-95 shadow-md shadow-red-500/20 text-sm"
                  >
                    ออกจากระบบ
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
