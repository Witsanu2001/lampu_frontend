import { Route } from "react-router-dom";
import { ProtectedRoute } from "../../shared/middlewares/ProtectedRoute";
import Listdata from ".";
import HistoryData from "./History";
import HistoryOrderDetail from "./HistoryOrderDetail";

export const listsDataRoutes = () => (
  <>
    <Route
      key="listData"
      path="/listData"
      element={
        <ProtectedRoute>
          <Listdata />
        </ProtectedRoute>
      }
    />
    <Route
      key="history"
      path="/listData/history"
      element={
        <ProtectedRoute>
          <HistoryData />
        </ProtectedRoute>
      }
    />
    <Route
      key="history_detail"
      path="/listData/history/detail/:orderId"
      element={
        <ProtectedRoute>
          <HistoryOrderDetail />
        </ProtectedRoute>
      }
    />
  </>
);
