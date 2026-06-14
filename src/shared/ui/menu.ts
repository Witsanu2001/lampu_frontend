// src/shared/ui/menu.ts

import Home from "../../assets/home.png";
import Order from "../../assets/orderCheck.png";
import Setting from "../../assets/settings.png";
import UserSetting from "../../assets/user-setting.png";
import ShoppingList from "../../assets/shopping_list.png";

export interface MenuItem {
  label: string;
  to: string;
  iconUrl?: string;
  roles?: string[];
  submenu?: MenuItem[];
}

export const menuConfig: MenuItem[] = [
  {
    label: "เมนูหมูกระทะ",
    to: "/home",
    roles: ["admin","user"],
    iconUrl: Home,
  },
  {
    label: "ออเดอร์",
    to: "/orders",
    roles: ["admin"],
    iconUrl: ShoppingList,
  },
  {
    label: "ออเดอร์",
    to: "/orders_user",
    roles: ["user"],
    iconUrl: Order,
  },
  {
    label: "ตั้งค่า",
    to: "/settings",
    roles: ["user"],
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
        to: "/settingsData/dashboards",
        roles: ["admin"],
      },
      {
        label: "จัดการผู้ใช้งาน",
        to: "/settingsData/users",
        roles: ["admin"],
      },
      {
        label: "จัดการเมนู",
        to: "/settingsData/menu",
        roles: ["admin"],
      },
      {
        label: "จัดการออเดอร์",
        to: "/settingsData/orders",
        roles: ["admin"],
      },
    ],
  },
];