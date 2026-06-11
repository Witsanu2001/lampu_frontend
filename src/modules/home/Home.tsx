/* eslint-disable react-hooks/purity */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useCart } from "../../shared/context/CartContext";

// 🌟 อัปเดต Type ให้ตรงกับข้อมูลที่ใช้และรองรับเป้าหมายปลายทาง (targetX, targetY)
interface FlyingItem {
  id: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  image: string;
  active: boolean;
}

export default function Home() {
  const { addToCart } = useCart();
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [mooKrataMenus, setMooKrataMenus] = useState<any[]>([]); // 🌟 State สำหรับเก็บข้อมูลเมนูจาก API
  const [isLoading, setIsLoading] = useState(true); // เพิ่ม State ตรวจสอบการโหลดข้อมูล

  // 🌟 1. ดึงข้อมูลเมนูประเภท main จาก API
  useEffect(() => {
    const fetchMainMenus = async () => {
      try {
        const token = localStorage.getItem("auth_token") || localStorage.getItem("firebase_token") || "";
        const response = await fetch(
          "https://api-gateway-879165280409.asia-southeast1.run.app/api/orders/menus_type/main",
          {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          }
        );
        
        if (response.ok) {
          const json = await response.json();
          // แปลงข้อมูลให้อยู่ในโครงสร้างเดียวกับที่ UI เดิมคาดหวัง
          const formatted = (json.data || []).map((item: any) => ({
            id: item.id,
            name: item.name_menu,
            price: item.price_menu,
            description: item.description_menu,
            image: item.image_url_menu,
            available: item.available
          }));
          
          // เลือกแสดงผลเฉพาะเมนูที่พร้อมขาย (available === true)
          setMooKrataMenus(formatted.filter((item: any) => item.available));
        }
      } catch (error) {
        console.error("Error fetching main menus:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMainMenus();
  }, []);

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>, menu: any) => {
    addToCart(menu);

    const buttonRect = e.currentTarget.getBoundingClientRect();
    const cartIcon = document.getElementById("cart-icon");
    
    let targetX = window.innerWidth - 60;
    let targetY = 20;

    if (cartIcon) {
      const cartRect = cartIcon.getBoundingClientRect();
      targetX = cartRect.left + cartRect.width / 2 - 32;
      targetY = cartRect.top + cartRect.height / 2 - 32;
    }

    const id = Date.now();
    
    setFlyingItems((prev) => [
      ...prev,
      { 
        id, 
        startX: buttonRect.left, 
        startY: buttonRect.top, 
        targetX, 
        targetY, 
        image: menu.image, 
        active: false 
      },
    ]);

    setTimeout(() => {
      setFlyingItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, active: true } : item))
      );
    }, 50);

    setTimeout(() => {
      setFlyingItems((prev) => prev.filter((item) => item.id !== id));
    }, 700);
  };

  return (
    <div className="h-full overflow-y-auto py-10 px-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-5xl mx-auto space-y-10">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center md:text-left border-l-4 border-emerald-500 pl-3">
            เมนูหมูกระทะยอดฮิต 🥢
          </h2>

          {isLoading ? (
            // แสดง Loader ระหว่างรอข้อมูล
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              กำลังโหลดเมนูความอร่อย...
            </div>
          ) : mooKrataMenus.length === 0 ? (
            // แสดงข้อความเมื่อไม่มีข้อมูลเมนูหลักเปิดขายอยู่
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              ขออภัย ขณะนี้ยังไม่มีเมนูหลักเปิดให้บริการ
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {mooKrataMenus.map((menu) => (
                <div
                  key={menu.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col"
                >
                  <div className="h-48 overflow-hidden relative">
                    <img
                      src={menu.image}
                      alt={menu.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 bg-emerald-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-md">
                      ฿{menu.price}
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                      {menu.name}
                    </h3>
                    <div className="h-16 mb-4 overflow-hidden">
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                        {menu.description || "ไม่มีรายละเอียดเมนู"}
                      </p>
                    </div>

                    <button 
                      onClick={(e) => handleAddToCart(e, menu)}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-semibold rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center gap-2 mt-auto"
                    >
                      <span>สั่งชุดนี้</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🌟 แสดงรูปภาพที่กำลังลอยเข้าตะกร้า */}
      {flyingItems.map((item) => (
        <img
          key={item.id}
          src={item.image}
          alt="flying-item"
          className="fixed z-[9999] w-16 h-16 rounded-full object-cover shadow-xl pointer-events-none transition-all duration-700 ease-in-out"
          style={{
            top: item.active ? `${item.targetY}px` : `${item.startY}px`,
            left: item.active ? `${item.targetX}px` : `${item.startX}px`,
            transform: item.active ? "scale(0.1) rotate(360deg)" : "scale(1) rotate(0deg)",
            opacity: item.active ? 0 : 1,
          }}
        />
      ))}
    </div>
  );
}