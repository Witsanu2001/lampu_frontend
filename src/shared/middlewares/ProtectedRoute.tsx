// src/shared/middlewares/ProtectedRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "../infra/auth/token"; // สมมติว่ามีฟังก์ชัน getRole() หรือ get user จาก context
import { useState, useEffect } from "react";

// สมมติว่าคุณรับ user role ผ่าน Props, Context หรือดึงจาก Token (ปรับตามการใช้งานจริงของคุณได้เลย)
interface ProtectedRouteProps extends React.PropsWithChildren {
  allowedRoles?: string[];
  userRole?: string; // หรือรับจาก Context / LocalStorage
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  userRole,
}) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const auth = isAuthenticated();
      setIsAuth(auth);
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // 1. ยังไม่ได้ login หรือ token หมดอายุ
  if (!isAuth) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // 2. เช็ค Role ว่ามีสิทธิ์เข้าหน้านี้ไหม (ถ้าหน้านี้มีการบังคับ allowedRoles)
  if (allowedRoles && allowedRoles.length > 0) {
    // ถ้าไม่มี role หรือ role ไม่ตรงกับที่อนุญาต ให้เตะกลับไปหน้า Home
    if (!userRole || !allowedRoles.includes(userRole)) {
      return <Navigate to="/home" replace />; // หรือสร้างหน้า /unauthorized
    }
  }

  // ผ่านทั้งหมด ให้เข้าใช้งานได้
  return <>{children}</>;
};
