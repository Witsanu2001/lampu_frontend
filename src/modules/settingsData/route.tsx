/* eslint-disable @typescript-eslint/no-explicit-any */
import { Route } from "react-router-dom";
import Dashboard from "./dashboards/Dashboard";
import UserSetting from "./users/UserSetting";
import MenuSetting from "./menu/MenuSetting";
import OrderSetting from "./orders/OrderSetting";
import { ProtectedRoute } from "../../shared/middlewares/ProtectedRoute";
import Settingsdata from ".";
import SystemPage from "./systems/SystemPage";

export const settingsDataRoutes = (user: any) => (
  <>
    <Route
      key="settingsData"
      path="/settingsData"
      element={
        // ส่ง allowedRoles และ userRole เข้าไปเช็ค
        <ProtectedRoute allowedRoles={["admin"]} userRole={user?.role}>
          <Settingsdata />
        </ProtectedRoute>
      }
    />
    <Route
      key="dashboard"
      path="/settingsData/dashboards"
      element={
        <ProtectedRoute allowedRoles={["admin"]} userRole={user?.role}>
          <Dashboard />
        </ProtectedRoute>
      }
    />
    <Route
      key="users"
      path="/settingsData/users"
      element={
        <ProtectedRoute allowedRoles={["admin"]} userRole={user?.role}>
          <UserSetting />
        </ProtectedRoute>
      }
    />
    <Route
      key="menu"
      path="/settingsData/menu"
      element={
        <ProtectedRoute allowedRoles={["admin"]} userRole={user?.role}>
          <MenuSetting />
        </ProtectedRoute>
      }
    />
    <Route
      key="orders"
      path="/settingsData/orders"
      element={
        <ProtectedRoute allowedRoles={["admin"]} userRole={user?.role}>
          <OrderSetting />
        </ProtectedRoute>
      }
    />
    <Route
      key="systems"
      path="/settingsData/systems"
      element={
        <ProtectedRoute allowedRoles={["admin"]} userRole={user?.role}>
          <SystemPage />
        </ProtectedRoute>
      }
    />
  </>
);
