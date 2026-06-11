import { Route} from "react-router-dom";
import Address from "./Address";

export const addressRoutes = () => (
  <>
    <Route 
      key="address"
      path="/address" 
      element={<Address />}
    />
  </>
);