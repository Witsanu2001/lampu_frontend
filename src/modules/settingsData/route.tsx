import { Route} from "react-router-dom";
import Dashboard from "./dashboards/Dashboard";
import UserSetting from "./users/ีUserSetting";
import MenuSetting from "./menu/MenuSetting";
import OrderSetting from "./orders/OrderSetting";
import { ProtectedRoute } from "../../shared/middlewares/ProtectedRoute";

export const settingsDataRoutes = () => (
  <>
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