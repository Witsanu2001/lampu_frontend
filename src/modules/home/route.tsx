import { Route } from "react-router-dom";
import Home from "./Home";

export const homeRoutes = () => (
  <Route 
    key="home"
    path="/" 
    element={<Home /> } 
  />
);