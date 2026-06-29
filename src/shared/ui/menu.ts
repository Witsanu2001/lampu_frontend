// src/shared/ui/menu.ts

import Home from "../../assets/home.png";
import Order from "../../assets/orderCheck.png";
import Task from "../../assets/task.png";
import UserSetting from "../../assets/user-setting.png";
import Checklist from "../../assets/checklist.png";

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
    iconUrl: Checklist,
  },
  {
    label: "ออเดอร์",
    to: "/orders_user",
    roles: ["user"],
    iconUrl: Order,
  },
  {
    label: "ตั้งค่า",
    to: "/listData",
    roles: ["user"],
    iconUrl: Task,
  },
  {
    label: "จัดการระบบ",
    to: "/settingsData",
    iconUrl: UserSetting,
    roles: ["admin"]
  },
];