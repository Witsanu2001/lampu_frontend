import { Route} from "react-router-dom";
import Order from "./Order";

export const orderRoutes = () => (
  <Route 
    key="order"
    path="/orders" 
    element={<Order />}
  />
);