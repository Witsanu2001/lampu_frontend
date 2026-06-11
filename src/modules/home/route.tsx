import { Route } from "react-router-dom";
import Home from "./Home";
import { ProtectedRoute } from "../../shared/middlewares/ProtectedRoute";

export const homeRoutes = () => (
  <Route 
    key="home"
    path="/" 
      element={
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    } 
  />
);