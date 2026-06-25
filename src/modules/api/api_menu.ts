/* eslint-disable @typescript-eslint/no-explicit-any */
import { getFreshToken } from "../../shared/infra/auth/token";

const apiUrl = import.meta.env.VITE_API_URL;

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

export async function getListMenu(): Promise<Menu[]> {
  const token = await getFreshToken();

  const response = await fetch(`${apiUrl}/api/orders/menus_type/main`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`, // ต้องมี Authorization
    },
  });

  const json = await response.json();

  // 🌟 เช็ค success เป็นพิมพ์เล็ก ตามที่ Go Backend ส่งมา (ถ้าแก้ utils.go แล้ว)
  if (!response.ok || !json.success) {
    throw new Error(json.message || "Failed to fetch menus");
  }

  // 🌟 Map ข้อมูลให้ตรงกับ UI Model (ในกรณีที่ชื่อ Field ใน DB กับใน UI ไม่เหมือนกัน)
  return (json.data || []).map((item: any) => ({
    id: item.id,
    name: item.name_menu,      // ตรงกับที่ Backend ส่งมา
    price: item.price_menu,
    description: item.description_menu,
    image: item.image_url_menu,
    available: item.available,
  }));
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