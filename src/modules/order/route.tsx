/* eslint-disable @typescript-eslint/no-explicit-any */
import { Route} from "react-router-dom";
import OrderList from "./OrderList";
import OrderDetail from "./OrderDetail";
import { ProtectedRoute } from "../../shared/middlewares/ProtectedRoute";

export const orderRoutes = (user: any) => (
  <>
    <Route 
      key="order"
      path="/orders" 
      element={
        <ProtectedRoute allowedRoles={['admin']} userRole={user?.role}>
          <OrderList />
        </ProtectedRoute>
      }
    />

    <Route 
      key="order-detail"
      path="/orders/:orderId" 
      element={
        <ProtectedRoute allowedRoles={['admin']} userRole={user?.role}>
          <OrderDetail />
        </ProtectedRoute>
      }
    />
  </>
);