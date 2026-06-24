export interface Order {
  id: string;
  user_id: string; // ✨ เพิ่ม user_id
  rider_id: string;
  status: string;  // ✨ เพิ่ม status
  mainItems: Item[];
  addOnItems: Item[];
  equipment: Equipment;
  shipping: Shipping;
  payment: Payment;
  totals: Totals;
  slip_url: string;
  old_slip_url: string;
  home_image_url: string;
  created_at: string;
  updated_at: string;
  cancel_reason: string;
}

export interface Item {
  id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Equipment {
  needEquipment: boolean;
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
  phone: string;
  recipient: string
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