/* eslint-disable @typescript-eslint/no-explicit-any */
// src/modules/login/route.tsx
import { Route, Navigate } from "react-router-dom";
import Login from "./Login";

export const loginRoutes = (user: any, setUser: any) => (
  <Route 
    key="login"
    path="/login" 
    element={!user ? <Login setUser={setUser} /> : <Navigate to="/" replace />}
  />
);