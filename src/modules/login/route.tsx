/* eslint-disable @typescript-eslint/no-explicit-any */
// src/modules/login/route.tsx
import { Route, Navigate } from "react-router-dom";
import Login from "./Login";

export const loginRoutes = (user: any, setUser: any) => (
  <Route 
    key="login"
    path="/login" 
    element={
      !user ? (
        <Login setUser={setUser} />
      ) : user?.role === "admin" ? (
        // ✨ ถ้าเป็น admin ให้เด้งไปหน้า /orders ทันที
        <Navigate to="/orders" replace />
      ) : (
        // ✨ ถ้าเป็น role อื่น (เช่น user) ให้ไปหน้าหลักปกติ
        <Navigate to="/" replace />
      )
    }
  />
);