import { Route} from "react-router-dom";
import { ProtectedRoute } from "../../shared/middlewares/ProtectedRoute";
import Payment from "./Payment";

export const paymentRoutes = () => (
  <>
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
