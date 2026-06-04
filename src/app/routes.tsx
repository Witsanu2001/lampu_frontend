/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/routes.tsx
import { Routes } from "react-router-dom";
import { homeRoutes } from "../modules/home/route";
import { loginRoutes } from "../modules/login/route";

interface AppRoutesProps {
  user: any;
  setUser: (user: any) => void;
}

export default function AppRoutes({ user, setUser }: AppRoutesProps) {
  return (
    <Routes>
      {homeRoutes(user, setUser)}
      {loginRoutes(user, setUser)} {/* 🌟 เพิ่มการส่ง setUser เข้าไปที่นี่ */}
    </Routes>
  );
}