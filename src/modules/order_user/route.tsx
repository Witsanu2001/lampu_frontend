import { Route} from "react-router-dom";
import { ProtectedRoute } from "../../shared/middlewares/ProtectedRoute";
import OrderUserList from "./OrderUserList";
import OrderUserDetail from "./OrderUserDetail";

export const orderUserRoutes = () => (
  <>
    <Route 
      key="order"
      path="/orders_user" 
      element={
        <ProtectedRoute>
          <OrderUserList />
        </ProtectedRoute>
      }
    />

    <Route 
      key="order-detail"
      path="/orders_user/:orderId" 
      element={
        <ProtectedRoute>
          <OrderUserDetail />
        </ProtectedRoute>
      }
    />
  </>
);
