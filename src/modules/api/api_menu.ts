import { auth } from "../const/firebase";

const apiUrl = import.meta.env.VITE_API_URL;

async function getFreshToken(): Promise<string> {
  // ถ้า Firebase โหลดเสร็จและมี user ล็อกอินอยู่
  if (auth.currentUser) {
    // คำสั่งนี้จะเช็คอายุ Token ให้ ถ้าหมดอายุ มันจะดึงตัวใหม่ให้ทันทีก่อน return
    return await auth.currentUser.getIdToken();
  }

  // จังหวะหน้าเว็บเพิ่งรีเฟรช auth.currentUser อาจจะยังโหลดไม่เสร็จ ให้ fallback ไปใช้ localStorage ขัดตาทัพ
  return (
    localStorage.getItem("auth_token") ||
    localStorage.getItem("firebase_token") ||
    ""
  );
}

// 🌟 1. สร้าง Interface เพื่อบอกโครงสร้างข้อมูลที่ได้จาก Backend
export interface Menu {
  id: string;
  name_menu: string;
  description_menu: string;
  price_menu: number;
  type_menu: string;
  available: boolean;
  image_url_menu: string;
  created_at: string;
}

export async function getAllMenu(): Promise<Menu[]> { // 🌟 2. ใส่ Menu[] เข้าไปใน Promise
  const token = await getFreshToken(); // ใช้ฟังก์ชัน getFreshToken ที่ทำไว้ก่อนหน้า

  const response = await fetch(`${apiUrl}/api/orders/menus_get`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    // แก้ข้อความ error จาก orders เป็น menus ให้ตรงกับบริบท
    throw new Error(json.message || "Failed to fetch menus"); 
  }

  return json.data;
}

export async function deleteMenu(id: string): Promise<string> {
  const token = await getFreshToken(); // 🌟 ดึง Token ที่สดใหม่เสมอ

  const response = await fetch(`${apiUrl}/api/orders/menus_delete/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.message || "Failed to delete menu");
  }

  return json.message;
}