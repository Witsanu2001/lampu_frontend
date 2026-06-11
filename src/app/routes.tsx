/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routes } from "react-router-dom";
import { settingsDataRoutes } from "../modules/settingsData/route";
import { loginRoutes } from "../modules/login/route";
import { orderRoutes } from "../modules/order/route";
import { homeRoutes } from "../modules/home/route";
import { addressRoutes } from "../modules/address/route";

export const AppRoutes = ({ user, setUser }: { user: any, setUser: any }) => {
  return (
    <Routes>
      {loginRoutes(user, setUser)}
      {homeRoutes()}
      {orderRoutes()}
      {addressRoutes()}
      {settingsDataRoutes()}
    </Routes>
  );
}
