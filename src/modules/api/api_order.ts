import type { Order } from "../const/order";

const apiUrl = import.meta.env.VITE_API_URL;

export async function getAllOrders(): Promise<Order[]> {
  // ✨ ย้ายการดึง Token เข้ามาไว้ในฟังก์ชัน เพื่อให้ได้ค่าใหม่ล่าสุดเสมอ
  const token = localStorage.getItem("auth_token") || localStorage.getItem("firebase_token") || "";

  const response = await fetch(`${apiUrl}/api/orders/orders_get`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });

  const json = await response.json();

  // ✨ เช็ค success จาก APIResponse
  if (!response.ok || !json.success) {
    throw new Error(json.message || "Failed to fetch orders");
  }

  // ✨ คืนค่าจากกล่อง data
  return json.data;
}

export async function getOrderById(orderId: string): Promise<Order> {
  const token = localStorage.getItem("auth_token") || localStorage.getItem("firebase_token") || "";

  // ✨ เปลี่ยนไปใช้ Endpoint รายออเดอร์โดยตรง
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

  // ✨ ไม่ต้อง find(...) แล้ว เพราะ Backend ส่งมาแค่ออเดอร์เดียว
  return json.data;
}

export async function updateStatus(orderId: string, newStatus: string): Promise<string> {
  const token = localStorage.getItem("auth_token") || localStorage.getItem("firebase_token") || "";

  // ดึงข้อมูล userId อย่างปลอดภัย (ป้องกันกรณี userData ไม่มีใน localStorage)
  const userDataString = localStorage.getItem("userData");
  let userId = "";
  if (userDataString) {
    const userData = JSON.parse(userDataString);
    userId = userData.id || userData.uid || ""; // รองรับทั้ง .id และ .uid
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

  // ✨ ถ้าอัปเดตไม่สำเร็จ ให้โยน Error ออกไปให้ UI จัดการ
  if (!response.ok || !json.success) {
    throw new Error(json.message || "Failed to update order status");
  }

  // ✨ คืนค่าข้อความสำเร็จกลับไป (เอาไว้ให้ฝั่ง Component เรียกใช้เพื่อ alert)
  return json.message;
}

