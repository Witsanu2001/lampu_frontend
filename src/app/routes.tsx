/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/routes.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../modules/home/Home";
import Login from "../modules/login/Login";
import OrderList from "../modules/order/OrderList";
import Payment from "../modules/order/Payment";
import Address from "../modules/address/Address";

interface AppRoutesProps {
  user: any;
  setUser: (user: any) => void;
}

export default function AppRoutes({ user, setUser }: AppRoutesProps) {
  return (
    <Routes>

      <Route
        path="/"
        element={user ? <Home /> : <Login setUser={setUser} />}
      />

      <Route
        path="/login"
        element={!user ? <Login setUser={setUser} /> : <Navigate to="/" replace />}
      />

      <Route
        path="/orders"
        element={user ? <OrderList /> : <Login setUser={setUser} />}
      />

      <Route
        path="/payment"
        element={user ? <Payment /> : <Login setUser={setUser} />}
      />

      <Route
        path="/address"
        element={user ? <Address /> : <Login setUser={setUser} />}
      />
    </Routes>
  );
}
