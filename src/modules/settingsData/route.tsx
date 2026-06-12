import { Route } from "react-router-dom";
import Dashboard from "./dashboards/Dashboard";
import UserSetting from "./users/ีUserSetting";
import MenuSetting from "./menu/MenuSetting";
import OrderSetting from "./orders/OrderSetting";
import { ProtectedRoute } from "../../shared/middlewares/ProtectedRoute";
import Settingsdata from ".";

export const settingsDataRoutes = () => (
  <>
    <Route
      key="settingsData"
      path="/settingsData"
      element={
        <ProtectedRoute>
          <Settingsdata />
        </ProtectedRoute>
      }
    />
    <Route
      key="dashboard"
      path="/settingsData/dashboards"
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }
    />
    <Route
      key="users"
      path="/settingsData/users"
      element={
        <ProtectedRoute>
          <UserSetting />
        </ProtectedRoute>
      }
    />
    <Route
      key="menu"
      path="/settingsData/menu"
      element={
        <ProtectedRoute>
          <MenuSetting />
        </ProtectedRoute>
      }
    />
    <Route
      key="orders"
      path="/settingsData/orders"
      element={
        <ProtectedRoute>
          <OrderSetting />
        </ProtectedRoute>
      }
    />
  </>
);
