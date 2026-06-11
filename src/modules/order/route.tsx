import { Route} from "react-router-dom";
import OrderList from "./OrderList";
import OrderDetail from "./OrderDetail";
import Payment from "./Payment";
import { ProtectedRoute } from "../../shared/middlewares/ProtectedRoute";

export const orderRoutes = () => (
  <>
    <Route 
      key="order"
      path="/orders" 
      element={
        <ProtectedRoute>
          <OrderList />
        </ProtectedRoute>
      }
    />

    <Route 
      key="order-detail"
      path="/orders/:orderId" 
      element={
        <ProtectedRoute>
          <OrderDetail />
        </ProtectedRoute>
      }
    />

    <Route 
      key="payment"
      path="/orders/payment" 
      element={
        <ProtectedRoute>
          <Payment />
        </ProtectedRoute>
      }
    />
  </>
);
