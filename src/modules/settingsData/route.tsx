import { Route} from "react-router-dom";
import Dashboard from "./dashboards/Dashboard";
import UserSetting from "./users/ีUserSetting";
import MenuSetting from "./menu/MenuSetting";
import OrderSetting from "./orders/OrderSetting";

export const settingsDataRoutes = () => (
  <>
    <Route 
      key="dashboard"
      path="/settingsData/dashboards" 
      element={<Dashboard />}
    />  
    <Route 
      key="users"
      path="/settingsData/users" 
      element={<UserSetting />}
    />
    <Route 
      key="menu"
      path="/settingsData/menu" 
      element={<MenuSetting />}
    />
    <Route 
      key="orders"
      path="/settingsData/orders" 
      element={<OrderSetting />}
    />
  </>
);