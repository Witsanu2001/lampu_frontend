/* eslint-disable @typescript-eslint/no-explicit-any */
const apiUrl = import.meta.env.VITE_API_URL;

export interface Order {
  id: string;
  mainItems: Item[];
  addOnItems: Item[];
  equipment: Equipment;
  shipping: Shipping;
  payment: Payment;
  totals: Totals;
  slip_url: string;
  home_image_url: string;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Equipment {
  stoveCount: number;
  panCount: number;
  charcoalCount: number;
  extraStoves: number;
  extraPans: number;
  stoveFee: number;
  panFee: number;
  charcoalFee: number;
}

export interface Location {
  lat: number;
  lng: number;
}

export interface Shipping {
  address: string;
  location: Location;
  feePerSet: number;
  totalFee: number;
}

export interface Payment {
  method: string;
  hasSlip: boolean;
}

export interface Totals {
  cartTotal: number;
  addOnTotal: number;
  shippingFee: number;
  grandTotal: number;
}

export async function getAllOrders(): Promise<Order[]> {
  const response = await fetch(`${apiUrl}/api/orders/orders_get`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch orders");
  }

  const data = await response.json();
  return data;
}

export async function getOrderById(orderId: string): Promise<Order> {
  const response = await fetch(`${apiUrl}/api/orders/orders_get`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch order");
  }

  const data: Order[] = await response.json();
  const order = data.find((o) => o.id === orderId);
  
  if (!order) {
    throw new Error("Order not found");
  }

  return order;
}
