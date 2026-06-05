import { Route} from "react-router-dom";
import Order from "./Order";
import Payment from "./Payment";

export const orderRoutes = () => (
  // เพิ่ม Fragment (<> ... </>) ครอบ Route ทั้งสองตัว
  <>
    <Route 
      key="order"
      path="/orders" 
      element={<Order />}
    />

    <Route 
      key="payment"
      path="/orders/payment" 
      element={<Payment />}
    />
  </>
);