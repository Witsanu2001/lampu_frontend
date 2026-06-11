import { Route} from "react-router-dom";
import Address from "./Address";
import { ProtectedRoute } from "../../shared/middlewares/ProtectedRoute";

export const addressRoutes = () => (
  <>
    <Route 
      key="address"
      path="/address" 
      element={
        <ProtectedRoute>
          <Address />
        </ProtectedRoute>
      }
    />
  </>
);