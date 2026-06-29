/* eslint-disable @typescript-eslint/no-explicit-any */
import { Navigate, Route, Routes } from "react-router-dom";
import { settingsDataRoutes } from "../modules/settingsData/route";
import { loginRoutes } from "../modules/login/route";
import { orderRoutes } from "../modules/order/route";
import { homeRoutes } from "../modules/home/route";
import { addressRoutes } from "../modules/address/route";
import { paymentRoutes } from "../modules/payment/route";
import { orderUserRoutes } from "../modules/order_user/route";
import { listsDataRoutes } from "../modules/listData/route";

export const AppRoutes = ({ user, setUser }: { user: any, setUser: any }) => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            user.role === "admin" ? <Navigate to="/orders" replace /> : <Navigate to="/home" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      {loginRoutes(user, setUser)}
      {homeRoutes()}
      {orderRoutes(user)}
      {orderUserRoutes()}
      {paymentRoutes()}
      {addressRoutes()}
      {settingsDataRoutes(user)}
      {listsDataRoutes()}
    </Routes>
  );
}
