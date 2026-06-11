/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";

interface MenuItem {
  id?: number | string;
  name_menu: string;
  price_menu: number;
  type_menu: string;
  image_menu: string | any; // รองรับทั้ง URL string (รูปเดิม) และ File object (รูปใหม่)
  available: boolean;
  description_menu?: string;
}

interface MenuFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: MenuItem) => void;
  editItem?: MenuItem | null;
}

const typeMenu = ["main", "additional"];

export default function MenuForm({
  isOpen,
  onClose,
  onSave,
  editItem,
}: MenuFormProps) {
  const [formData, setFormData] = useState<MenuItem>({
    name_menu: "",
    price_menu: 0,
    type_menu: "main",
    image_menu: "",
    available: true,
    description_menu: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof MenuItem, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editItem) {
      // 🌟 ถ้ากดแก้ไข ให้เอาข้อมูลเดิมมาใส่ฟอร์ม
      setFormData(editItem);
    } else {
      // ถ้ากดเพิ่มใหม่ ให้เคลียร์ฟอร์ม
      setFormData({
        name_menu: "",
        price_menu: 0,
        type_menu: "main",
        image_menu: "",
        available: true,
        description_menu: "",
      });
    }
    setErrors({});
  }, [editItem, isOpen]);

  const validateForm = () => {
    const newErrors: Partial<Record<keyof MenuItem, string>> = {};

    if (!formData.name_menu.trim()) {
      newErrors.name_menu = "กรุณากรอกชื่อเมนู";
    }
    if (formData.price_menu <= 0) {
      newErrors.price_menu = "กรุณากรอกราคาที่ถูกต้อง";
    }
    if (!formData.type_menu) {
      newErrors.type_menu = "กรุณาเลือกหมวดหมู่";
    }
    if (
      !formData.image_menu ||
      (typeof formData.image_menu === "string" && !formData.image_menu.trim())
    ) {
      newErrors.image_menu = "กรุณาเลือกรูปภาพ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);

      try {
        const submitData = new FormData();
        submitData.append("name_menu", formData.name_menu);
        submitData.append("price_menu", formData.price_menu.toString());
        submitData.append("description_menu", formData.description_menu || "");
        submitData.append("type_menu", formData.type_menu);
        submitData.append("available", formData.available.toString());

        // 🌟 เช็คว่าถ้ารูปภาพเป็น File Object (มีการอัปโหลดใหม่) ถึงจะแนบไปกับ FormData
        // ถ้าเป็นแค่ String URL เดิม จะไม่แนบไป หลังบ้านก็จะไม่เขียนทับ
        if (typeof formData.image_menu === "object" && formData.image_menu !== null) {
          submitData.append("image", formData.image_menu); // ฝั่ง Go รอรับเป็นชื่อ "image"
        }

        const token = localStorage.getItem("auth_token") || localStorage.getItem("firebase_token") || ""; 
        
        // 🌟 กำหนด URL และ Method แยกตามกรณี (เพิ่มใหม่ หรือ แก้ไข)
        const url = editItem 
          ? `https://api-gateway-879165280409.asia-southeast1.run.app/api/orders/menus_edit/${editItem.id}` 
          : "https://api-gateway-879165280409.asia-southeast1.run.app/api/orders/menus_add"; // เปลี่ยน URL ให้ตรงกับที่คุณตั้งใน Gateway
        
        const method = editItem ? "PUT" : "POST";

        const response = await fetch(url, {
          method: method,
          headers: {
            "Authorization": `Bearer ${token}` 
          },
          body: submitData,
        });

        if (!response.ok) {
          throw new Error(`บันทึกข้อมูลไม่สำเร็จ (Status: ${response.status})`);
        }

        const responseData = await response.json();
        
        // ถ้าระบบส่ง URL รูปใหม่กลับมาให้ใช้รูปใหม่ ถ้าไม่มีให้ใช้รูปเดิม
        const finalData = {
          ...formData,
          image_menu: responseData.data?.image_url || (typeof formData.image_menu === "string" ? formData.image_menu : "")
        };

        onSave(finalData);
        onClose();
        
      } catch (error) {
        console.error("Upload error:", error);
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ หรือการบันทึกข้อมูล");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "price_menu"
            ? Number(value) || 0
            : value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">
            {editItem ? "แก้ไขเมนู" : "เพิ่มเมนูใหม่"}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ชื่อเมนู <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name_menu"
              value={formData.name_menu}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.name_menu ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-600 focus:ring-emerald-500"
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent outline-none transition-all`}
              placeholder="เช่น ชุดหมูกระทะ"
            />
            {errors.name_menu && <p className="mt-1 text-sm text-red-500">{errors.name_menu}</p>}
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ราคา (บาท) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">฿</span>
              <input
                type="number"
                name="price_menu"
                value={formData.price_menu || ""}
                onChange={handleChange}
                min="0"
                step="1"
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                  errors.price_menu ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-600 focus:ring-emerald-500"
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent outline-none transition-all`}
                placeholder="0"
              />
            </div>
            {errors.price_menu && <p className="mt-1 text-sm text-red-500">{errors.price_menu}</p>}
          </div>

          {/* type_menu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              หมวดหมู่ <span className="text-red-500">*</span>
            </label>
            <select
              name="type_menu"
              value={formData.type_menu}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.type_menu ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-600 focus:ring-emerald-500"
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent outline-none transition-all`}
            >
              {typeMenu.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.type_menu && <p className="mt-1 text-sm text-red-500">{errors.type_menu}</p>}
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              อัปโหลดรูปภาพ <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              name="image_menu"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleChange({
                    target: { name: "image_menu", value: file },
                  } as any);
                }
              }}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.image_menu ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-600 focus:ring-emerald-500"
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-gray-600 dark:file:text-gray-200 focus:ring-2 focus:border-transparent outline-none transition-all`}
            />
            {errors.image_menu && <p className="mt-1 text-sm text-red-500">{errors.image_menu}</p>}

            {/* ส่วนแสดงผลรูปภาพตัวอย่าง */}
            {formData.image_menu && (
              <div className="mt-3">
                <img
                  src={
                    typeof formData.image_menu === "object"
                      ? URL.createObjectURL(formData.image_menu)
                      : formData.image_menu
                  }
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          {/* description_menu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              รายละเอียด
            </label>
            <textarea
              name="description_menu"
              value={formData.description_menu || ""}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none"
              placeholder="รายละเอียดเมนู..."
            />
          </div>

          {/* Available */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="available"
              id="available"
              checked={formData.available}
              onChange={handleChange}
              className="w-5 h-5 text-emerald-500 border-gray-300 dark:border-gray-600 rounded focus:ring-emerald-500"
            />
            <label htmlFor="available" className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              วางขาย
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "กำลังบันทึก..." : editItem ? "บันทึกการแก้ไข" : "เพิ่มเมนู"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}