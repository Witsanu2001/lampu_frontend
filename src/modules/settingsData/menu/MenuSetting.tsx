/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import MenuForm from "./MenuForm";
import { deleteMenu, getAllMenu } from "../../api/api_menu";

export default function MenuSetting() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);

  // 1. ฟังก์ชันดึงข้อมูลจาก Backend
  const fetchMenus = async () => {
    try {
      const menus = await getAllMenu();
      const formatted = menus.map((item) => ({
        id: item.id,
        name_menu: item.name_menu,
        price_menu: item.price_menu,
        type_menu: item.type_menu || "main",
        image_menu: item.image_url_menu,
        available: item.available,
        description_menu: item.description_menu,
      }));
      setMenuItems(formatted);
    } catch (error) {
      console.error("Error fetching menus:", error);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const filteredItems = menuItems.filter((item) =>
    item.name_menu?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const mainMenuItems = filteredItems.filter((item) =>
    ["main"].includes(item.type_menu),
  );
  const additionalMenuItems = filteredItems.filter(
    (item) => item.type_menu === "additional",
  );

  const handleSave = () => {
    fetchMenus();
    setIsAddModalOpen(false);
    setEditItem(null);
  };

  const handleEdit = (item: any) => {
    setEditItem(item);
    setIsAddModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("คุณต้องการลบเมนูนี้ใช่ไหม?")) {
      try {
        // 🌟 1. เรียกใช้ API ลบเมนู (ระบบ Token จัดการให้เองข้างใน)
        await deleteMenu(id);

        // 🌟 2. ถ้ายิง API ลบสำเร็จ ให้ลบออกจากหน้าจอทันที
        setMenuItems((prev: any[]) => prev.filter((item) => item.id !== id));

        alert("ลบเมนูสำเร็จแล้ว"); // (ใส่หรือไม่ใส่ก็ได้)
      } catch (error) {
        console.error("Delete error:", error);
        alert("เกิดข้อผิดพลาด ไม่สามารถลบข้อมูลได้");
      }
    }
  };
  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditItem(null);
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          จัดการเมนู
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          เพิ่ม แก้ไข และจัดการรายการเมนูอาหาร
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="ค้นหาเมนู..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
          />
          <svg
            className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <button
          onClick={() => {
            setEditItem(null);
            setIsAddModalOpen(true);
          }}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          เพิ่มเมนู
        </button>
      </div>

      {mainMenuItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-3xl">🍖</span>
            เมนูหลัก
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mainMenuItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative">
                  <img
                    src={item.image_menu}
                    alt={item.name_menu}
                    className="w-full h-48 object-cover"
                  />
                  <span
                    className={`absolute top-3 right-3 px-3 py-1 text-xs font-semibold rounded-full ${item.available ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
                  >
                    {item.available ? "ว่าง" : "หมด"}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white mb-1">
                        {item.name_menu}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {item.description_menu}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-emerald-500">
                      ฿{item.price_menu}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-medium rounded-lg"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 px-3 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {additionalMenuItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-3xl">🥗</span>
            เมนูเพิ่มเติม
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalMenuItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative">
                  <img
                    src={item.image_menu}
                    alt={item.name_menu}
                    className="w-full h-48 object-cover"
                  />
                  <span
                    className={`absolute top-3 right-3 px-3 py-1 text-xs font-semibold rounded-full ${item.available ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
                  >
                    {item.available ? "ว่าง" : "หมด"}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white mb-1">
                        {item.name_menu}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {item.description_menu}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-emerald-500">
                      ฿{item.price_menu}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-medium rounded-lg"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 px-3 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">ไม่พบเมนู</p>
        </div>
      )}

      {/* หน้าต่าง Add Modal */}
      <MenuForm
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        editItem={editItem}
      />
    </div>
  );
}
