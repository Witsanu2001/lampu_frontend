/* eslint-disable @typescript-eslint/no-explicit-any */

import { getFreshToken } from "../../shared/infra/auth/token";

const apiUrl = import.meta.env.VITE_API_URL;

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface LocationPayload {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  details: string;
  note: string;
  location: GeoLocation | null;
  deliveryFee: number;
  distance: number;
  isMeetup: boolean;
  isDefault: boolean;
}

// 🌟 แก้ลำดับ Parameter เป็น (userId, addressData) ให้ตรงกับที่ Address.tsx เรียกใช้
export async function saveLocationToDB(userId: string, addressData: any): Promise<any> {
  const token = await getFreshToken();

  // ยิงไปที่ Route /api/users/location_add ตามที่ตั้งไว้ใน main.go ของ User Service
  const response = await fetch(`${apiUrl}/api/users/location_add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id: addressData.id,
      user_id: userId,          // แนบ user_id ลงไปด้วยตามโครงสร้างตาราง locations
      name: addressData.name,
      phone: addressData.phone,
      details: addressData.details,
      note: addressData.note,
      location: addressData.location, // { lat: number, lng: number }
      deliveryFee: addressData.deliveryFee,
      distance: addressData.distance,
      isMeetup: addressData.isMeetup,
      isDefault: addressData.isDefault,
    }),
  });

  const json = await response.json();

  // ตรวจสอบสถานะการตอบกลับตามโครงสร้าง APIResponse มาตรฐาน
  if (!response.ok || !json.success) {
    throw new Error(json.message || "Failed to save location");
  }

  return json.data;
}

// 🌟 แก้ลำดับ Parameter เป็น (userId, addressData)
export async function updateLocationInDB(userId: string, addressData: any): Promise<any> {
  const token = await getFreshToken();

  // จัดรูป Payload ให้มี user_id ด้วย
  const payload: LocationPayload = {
    id: addressData.id,
    user_id: userId, // 👈 ต้องแนบไปด้วยครับ
    name: addressData.name,
    phone: addressData.phone,
    details: addressData.details,
    note: addressData.note,
    location: addressData.location,
    deliveryFee: addressData.deliveryFee,
    distance: addressData.distance,
    isMeetup: addressData.isMeetup,
    isDefault: addressData.isDefault,
  };

  const response = await fetch(`${apiUrl}/api/users/location_update`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.message || "Failed to update location");
  }
  return json.data;
}

// 🌟 เพิ่ม userId เข้ามาใน Parameter ให้ตรงกับที่ Address.tsx ส่งมา (ถึงแม้ฝั่ง Go อาจจะไม่ได้ใช้ แต่เพื่อไม่ให้เกิด Error)
export async function deleteLocationFromDB(id: string): Promise<any> {
  const token = await getFreshToken();

  // ส่ง id ไปทาง Query Parameter (?id=xxx) ให้ตรงกับหลังบ้าน Go
  const response = await fetch(`${apiUrl}/api/users/location_delete?id=${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.message || "Failed to delete location");
  }
  return json.data;
}

// ฟังก์ชันสำหรับดึงรายการที่อยู่ทั้งหมดของ User
export async function getLocationsFromDB(userId: string): Promise<any> {
  const token = await getFreshToken();

  const response = await fetch(`${apiUrl}/api/users/location_get?user_id=${userId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.message || "Failed to fetch locations");
  }
  return json.data;
}

export async function getLocationsDefault(userId: string): Promise<any> {
  const token = await getFreshToken();

  // แก้ไขรูปแบบ URL ให้ตรงกับ Route ของ Backend
  const response = await fetch(`${apiUrl}/api/users/location_get/default?user_id=${userId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.message || "Failed to fetch locations");
  }
  return json.data;
}