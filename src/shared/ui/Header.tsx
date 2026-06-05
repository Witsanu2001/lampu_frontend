/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../modules/const/firebase";
import liff from "@line/liff";

interface HeaderProps {
  user: any;
  setUser: (user: any) => void;
}

export default function Header({ user, setUser }: HeaderProps) {
  // 🌟 State สำหรับจัดการ Dark/Light Mode
  const [isDarkMode, setIsDarkMode] = useState(false);

  // ตรวจสอบ Theme เดิมจาก localStorage หรือระบบของเครื่องตอนโหลดครั้งแรก
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const isDark = savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    setIsDarkMode(isDark);
  }, []);

  // อัปเดต DOM class เมื่อ isDarkMode เปลี่ยน
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // ฟังก์ชันสลับ Theme
  const toggleTheme = () => {
    const newTheme = isDarkMode ? "light" : "dark";
    localStorage.setItem("theme", newTheme);
    setIsDarkMode(!isDarkMode);
  };

  const handleLogout = async () => {
    if (user?.provider === "line") {
      liff.logout();
    }
    await signOut(auth);
    setUser(null);
    localStorage.removeItem("userData");
  };

  return (
    <header className="w-full px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center transition-colors duration-200 z-20">
      
      {/* ฝั่งซ้าย: โลโก้ หรือ ชื่อระบบ */}
      <div className="flex items-center gap-2">
        <strong className="text-lg text-gray-800 dark:text-gray-100 tracking-wide">
          Lampu Moo Krata
        </strong>
      </div>

      {/* ฝั่งขวา: เครื่องมือต่างๆ และ ข้อมูลผู้ใช้งาน */}
      <div className="flex items-center gap-3 sm:gap-4">
        
        {/* 🛒 ปุ่มตะกร้ารถเข็น */}
        <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200 focus:outline-none">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {/* ตัวเลขแจ้งเตือนบนตะกร้า (สมมติว่ามี 3 ชิ้น) */}
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-orange-500 rounded-full border-2 border-white dark:border-gray-800">
            3
          </span>
        </button>

        {/* 🌓 ปุ่มสลับ Dark / Light Mode */}
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200 focus:outline-none"
          aria-label="Toggle Dark Mode"
        >
          {isDarkMode ? (
            // Icon พระอาทิตย์ (โหมดสว่าง)
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            // Icon พระจันทร์ (โหมดมืด)
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* เส้นคั่นกลาง */}
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 hidden sm:block"></div>

        {/* 👤 ข้อมูลผู้ใช้ */}
        <div className="flex items-center gap-2">
          {user?.photoURL && (
            <img
              src={user.photoURL}
              alt="Profile"
              className={`w-9 h-9 rounded-full object-cover border-2 transition-colors duration-200 ${
                user.provider === "line" ? "border-[#06C755]" : "border-blue-500"
              }`}
            />
          )}
          <span className="text-sm font-medium text-gray-800 dark:text-gray-100 hidden sm:block">
            {user?.displayName || "ผู้ใช้งาน"}
          </span>
        </div>

        {/* 🚪 ปุ่ม Logout */}
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 text-[13px] font-bold text-red-500 dark:text-red-400 bg-gray-50 hover:bg-red-50 dark:bg-gray-700 dark:hover:bg-red-900/30 border border-gray-200 dark:border-gray-600 hover:border-red-200 dark:hover:border-red-800 rounded-md transition-all duration-200 shadow-sm ml-2"
        >
          ออกจากระบบ
        </button>
        
      </div>
    </header>
  );
}