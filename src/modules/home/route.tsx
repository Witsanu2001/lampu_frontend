/* eslint-disable @typescript-eslint/no-explicit-any */
import { Route, Navigate } from "react-router-dom";
import Home from "./Home";

export const homeRoutes = (user: any, setUser: any) => (
  <Route 
    key="home"
    path="/" 
    element={user ? <Home user={user} setUser={setUser} /> : <Navigate to="/login" replace />} 
  />
);