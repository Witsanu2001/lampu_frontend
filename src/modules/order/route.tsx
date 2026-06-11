import { Route} from "react-router-dom";
import OrderList from "./OrderList";
import Payment from "./Payment";

export const orderRoutes = () => (
  <>
    <Route 
      key="order"
      path="/orders" 
      element={<OrderList />}
    />

    <Route 
      key="payment"
      path="/orders/payment" 
      element={<Payment />}
    />
  </>
);