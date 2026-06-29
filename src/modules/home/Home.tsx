/* eslint-disable react-hooks/purity */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useCart } from "../../shared/context/CartContext";
import { getListMenu } from "../api/api_menu";

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
  const [mooKrataMenus, setMooKrataMenus] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    let isMounted = true;

    const fetchMainMenus = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) throw new Error("No token found");
        const data = await getListMenu();

        if (isMounted) {
          setMooKrataMenus(data.filter((item: any) => item.available));
        }
      } catch (error) {
        console.error("Error fetching menus:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchMainMenus();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddToCart = (
    e: React.MouseEvent<HTMLButtonElement>,
    menu: any,
  ) => {
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
        active: false,
      },
    ]);

    setTimeout(() => {
      setFlyingItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, active: true } : item)),
      );
    }, 50);

    setTimeout(() => {
      setFlyingItems((prev) => prev.filter((item) => item.id !== id));
    }, 700);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-14 h-14 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg animate-pulse">
          กำลังเตรียมเมนูความอร่อย...
        </p>
      </div>
    );
  }

  if (mooKrataMenus.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500 dark:text-gray-400 text-lg">
        ขออภัย ขณะนี้ยังไม่มีเมนูหลักเปิดให้บริการ
      </div>
    );
  }

  return (
    <div className="h-full p-6 w-full overflow-y-auto bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors duration-200 max-lg:[&::-webkit-scrollbar]:hidden max-lg:[scrollbar-width:none]">
      <div className="space-y-8 z-10">
        <div>
          <div className="border-gray-200 dark:border-gray-700 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white border-l-4 border-emerald-500 pl-4 md:text-left">
              เมนูหมูกระทะยอดฮิต 🥢
            </h2>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-14 h-14 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-gray-500 dark:text-gray-400 font-medium text-lg animate-pulse">
                กำลังเตรียมเมนูความอร่อย...
              </p>
            </div>
          ) : mooKrataMenus.length === 0 ? (
            <div className="text-center py-20 text-gray-500 dark:text-gray-400 text-lg">
              ขออภัย ขณะนี้ยังไม่มีเมนูหลักเปิดให้บริการ
            </div>
          ) : (
            // 🌟 ปรับ Grid ให้คอลัมน์น้อยลง = การ์ดใหญ่ขึ้น (max 3-4 คอลัมน์จอใหญ่) พร้อมเพิ่ม Gap เป็น gap-8
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {mooKrataMenus.map((menu) => (
                <div
                  key={menu.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col group"
                >
                  {/* 🌟 2. ปรับสัดส่วนรูปเป็น aspect-[4/3] จะทำให้ดูเป็นผืนผ้าสวยกว่าจัตุรัสเดิม */}
                  <div className="aspect-[4/3] w-full overflow-hidden relative bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                    <img
                      src={menu.image}
                      alt={menu.name}
                      // 💡 ทริค: ถ้าอยากให้ "รูปแสดงเต็มใบ 100% ไม่โดนตัดขอบ" ให้เปลี่ยน object-cover เป็น object-contain ครับ
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-emerald-500 text-white text-sm sm:text-base font-bold px-3 py-1 sm:px-4 sm:py-1.5 rounded-full shadow-lg">
                      ฿{menu.price}
                    </div>
                  </div>

                  {/* 🌟 3. ปรับ Padding และ Font ให้ยืดหยุ่นตามหน้าจอ */}
                  <div className="p-4 sm:p-6 flex flex-col flex-grow">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-2 sm:mb-3 line-clamp-2">
                      {menu.name}
                    </h3>

                    <div className="mb-4 sm:mb-6 flex-grow">
                      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 line-clamp-3">
                        {menu.description || "ไม่มีรายละเอียดเมนู"}
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleAddToCart(e, menu)}
                      className="w-full py-2.5 sm:py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-sm sm:text-base font-semibold rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 mt-auto"
                    >
                      <span>สั่งชุดนี้</span>
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6"
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
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {flyingItems.map((item) => (
        <img
          key={item.id}
          src={item.image}
          alt="flying-item"
          className="fixed z-[9999] w-20 h-20 rounded-full object-cover shadow-2xl pointer-events-none transition-all duration-700 ease-in-out"
          style={{
            top: item.active ? `${item.targetY}px` : `${item.startY}px`,
            left: item.active ? `${item.targetX}px` : `${item.startX}px`,
            transform: item.active
              ? "scale(0.1) rotate(360deg)"
              : "scale(1) rotate(0deg)",
            opacity: item.active ? 0 : 1,
          }}
        />
      ))}
    </div>
  );
}
