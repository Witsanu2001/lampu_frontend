/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/routes.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../modules/home/Home";
import Login from "../modules/login/Login";
import Order from "../modules/order/Order";

interface AppRoutesProps {
  user: any;
  setUser: (user: any) => void;
}

export default function AppRoutes({ user, setUser }: AppRoutesProps) {
  return (
    <Routes>
      {/* 🌟 หน้าแรก (ต้องล็อกอินถึงเข้าได้) */}
      <Route 
        path="/" 
        element={user ? <Home /> : <Navigate to="/login" replace />} 
      />
      
      {/* 🌟 หน้าล็อกอิน (ถ้าล็อกอินแล้วให้เด้งไปหน้าแรก) */}
      <Route 
        path="/login" 
        element={!user ? <Login setUser={setUser} /> : <Navigate to="/" replace />} 
      />
      
      {/* 🌟 หน้าออเดอร์ (ต้องล็อกอินถึงเข้าได้) */}
      <Route 
        path="/orders" 
        element={user ? <Order /> : <Navigate to="/login" replace />} 
      />
    </Routes>
  );
}