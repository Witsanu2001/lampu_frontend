// src/shared/ui/menu.ts

import Home from "../../assets/home.png";
import Order from "../../assets/orderCheck.png";
import Setting from "../../assets/settings.png";
import UserSetting from "../../assets/user-setting.png";

export interface MenuItem {
  label: string;
  to: string;
  iconUrl?: string; // 🎯 แก้จุดนี้: เติม ? ไว้หลังชื่อ เพื่อบอกว่าเมนูย่อยไม่จำเป็นต้องใส่รูปไอคอนก็ได้
  roles?: string[];
  submenu?: MenuItem[];
}

export const menuConfig: MenuItem[] = [
  {
    label: "หน้าแรก",
    to: "/",
    iconUrl: Home,
  },
  {
    label: "ออเดอร์",
    to: "/orders",
    iconUrl: Order,
  },
  {
    label: "ตั้งค่า",
    to: "/settings",
    iconUrl: Setting,
  },
  {
    label: "จัดการระบบ",
    to: "/settingsData",
    iconUrl: UserSetting,
    roles: ["admin"],
    submenu: [
      {
        label: "แดชบอร์ดข้อมูล",
        to: "/admin-dashboard/overview",
        roles: ["admin"],
      },
      {
        label: "จัดการผู้ใช้งาน",
        to: "/admin-dashboard/users",
        roles: ["admin"],
      },
    ],
  },
];