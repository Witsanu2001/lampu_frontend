import type { Order } from "../const/order";
// ✨ 1. Import auth ของ Firebase เข้ามา
import { auth } from "../const/firebase"; 

const apiUrl = import.meta.env.VITE_API_URL;

// ✨ 2. สร้างฟังก์ชันตัวช่วยดึง Token ให้ฉลาดขึ้น
async function getFreshToken(): Promise<string> {
  // ถ้า Firebase โหลดเสร็จและมี user ล็อกอินอยู่
  if (auth.currentUser) {
    // คำสั่งนี้จะเช็คอายุ Token ให้ ถ้าหมดอายุ มันจะดึงตัวใหม่ให้ทันทีก่อน return
    return await auth.currentUser.getIdToken(); 
  }
  
  // จังหวะหน้าเว็บเพิ่งรีเฟรช auth.currentUser อาจจะยังโหลดไม่เสร็จ ให้ fallback ไปใช้ localStorage ขัดตาทัพ
  return localStorage.getItem("auth_token") || localStorage.getItem("firebase_token") || "";
}

export async function getAllOrders(): Promise<Order[]> {
  // ✨ 3. เรียกใช้ฟังก์ชันดึง Token ตัวใหม่
  const token = await getFreshToken();

  const response = await fetch(`${apiUrl}/api/orders/orders_get`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.message || "Failed to fetch orders");
  }

  return json.data;
}

export async function getOrderById(orderId: string): Promise<Order> {
  const token = await getFreshToken(); // ✨ ใช้แบบนี้ทุกฟังก์ชัน

  const response = await fetch(`${apiUrl}/api/orders/orders_get/${orderId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.message || "Failed to fetch order");
  }

  return json.data;
}

export async function updateStatus(orderId: string, newStatus: string, riderId?: string): Promise<string> {
  const token = await getFreshToken(); // ✨ เปลี่ยนตรงนี้

  let userId = "";
  if (riderId) {
    userId = riderId;
  } else {
    const userDataString = localStorage.getItem("userData");
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      userId = userData.id || userData.uid || ""; 
    }
  }

  const response = await fetch(`${apiUrl}/api/orders/orders_put/${orderId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      user_id: userId,
      status: newStatus
    })
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.message || "Failed to update order status");
  }

  return json.message;
}

export async function getOrderUserById(): Promise<Order> {
  const token = await getFreshToken(); // ✨ เปลี่ยนตรงนี้

  let userId = ""
  const userDataString = localStorage.getItem("userData");
  if (userDataString) {
    const userData = JSON.parse(userDataString);
    userId = userData.id || userData.uid || ""; 
  }

  const response = await fetch(`${apiUrl}/api/orders/orders_get/${userId}/orderByUser`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.message || "Failed to fetch order");
  }

  return json.data;
}