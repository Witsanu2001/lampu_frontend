/* eslint-disable @typescript-eslint/no-explicit-any */
import { getFreshToken } from "../../shared/infra/auth/token";
import type { Order } from "../const/order";
const apiUrl = import.meta.env.VITE_API_URL;

export async function addOrders(formData: FormData, token: string) {
  const response = await fetch(`${apiUrl}/api/orders/orders_add`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
    },
    body: formData,
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.message || "Failed to add order");
  }

  return json; // คืนค่าผลลัพธ์จากเซิร์ฟเวอร์
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

export async function getAddOnMenus(token: string) {
  const response = await fetch(`${apiUrl}/api/orders/menus_type/additional`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch");
  const json = await response.json();
  return (json.data || []).map((item: any) => ({
    id: item.id,
    name: item.name_menu,
    price: item.price_menu,
    image: item.image_url_menu,
    available: item.available,
  }));
}


// ฟังก์ชันส่งออเดอร์แบบก้อนเดียว พร้อมลำดับคิว
export async function assignBulkOrders(payload: any[]): Promise<string> {
  const token = await getFreshToken(); // ดึง Token ตามวิธีของคุณ
  
  const response = await fetch(`${apiUrl}/api/orders/bulk_assign`, {
    method: "POST", // ส่งก้อนใหญ่ใช้ POST เหมาะสมกว่า
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    // ห่อ Payload เป็น Object ที่มีคีย์ jobs เพื่อให้ Go อ่านง่าย
    body: JSON.stringify({ jobs: payload }) 
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.message || "Failed to assign bulk orders");
  }

  return json.message;
}


export async function getNewOrders(page: number = 1, limit: number = 10): Promise<Order[]> {
  const token = await getFreshToken();

  // 🌟 ดักไว้ถ้าหา token ไม่เจอจริงๆ จะได้ไม่ยิง API ไปให้ติด 401
  if (!token) throw new Error("ไม่พบ Token ยืนยันตัวตน");

  const response = await fetch(`${apiUrl}/api/orders/orders_new?page=${page}&limit=${limit}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });

  const json = await response.json();
  if (!response.ok || !json.success) throw new Error(json.message);
  return json.data;
}

export async function getDeliveryOrders(page: number = 1, limit: number = 10): Promise<Order[]> {
  const token = await getFreshToken();
  
  if (!token) throw new Error("ไม่พบ Token ยืนยันตัวตน");

  const response = await fetch(`${apiUrl}/api/orders/orders_delivery?page=${page}&limit=${limit}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });

  const json = await response.json();
  if (!response.ok || !json.success) throw new Error(json.message);
  return json.data;
}
 
export interface OrderSummary {
  order_id: string;
  status: string;
  recipient: string;
  address: string;
  grand_total: number;
  created_at: string;
}


export async function getSuccessOrders(selectedDate: string): Promise<OrderSummary[]> {
  const token = await getFreshToken();
  
  if (!token) throw new Error("ไม่พบ Token ยืนยันตัวตน");

  const response = await fetch(`${apiUrl}/api/orders/orders_get/success?date=${selectedDate}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });

  const json = await response.json();
  if (!response.ok || !json.success) throw new Error(json.message);
  return json.data;
}

export interface StoveJob {
  order_id: string;
  status: string;
  equipment: {
    needEquipment: boolean;
    stoveCount: number;
    panCount: number;
  };
  order_details: {
    shipping: {
      recipient: string;
      address: string;
      phone: string;
    };
  };
}

export async function getStoveOrders(): Promise<StoveJob[]> {
  const token = await getFreshToken();
  
  if (!token) throw new Error("ไม่พบ Token ยืนยันตัวตน");

  const response = await fetch(`${apiUrl}/api/jobs/stove`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });

  const json = await response.json();
  if (!response.ok || !json.success) throw new Error(json.message);
  return json.data;
}