// src/shared/ui/menu.ts

export interface MenuItem {
  label: string;
  to: string;
  roles?: string[]; // สิทธิ์ที่เข้าได้ (ถ้าไม่มี/ไม่ใส่ แปลว่าเข้าได้ทุกคน)
  submenu?: MenuItem[]; // เมนูย่อยยัดลงอาเรย์นี้
}

export const menuConfig: MenuItem[] = [
  {
    label: "📄 ออเดอร์",
    to: "/orders",
  },
  {
    label: "🏠 หน้าแรก",
    to: "/",
  },
  {
    label: "📍 ที่อยู่จัดส่ง",
    to: "/address",
  },
  {
    label: "⚙️ จัดการระบบ (Admin)",
    to: "/admin-dashboard",
    roles: ["admin"],
    submenu: [
      {
        label: "📊 แดชบอร์ดข้อมูล",
        to: "/admin-dashboard/overview",
        roles: ["admin"],
      },
      {
        label: "👥 จัดการผู้ใช้งาน",
        to: "/admin-dashboard/users",
        roles: ["admin"],
      },
    ],
  },
];
