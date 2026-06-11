import { Navigate, useLocation } from 'react-router-dom'
import { isAuthenticated } from '../infra/auth/token'
import { useState, useEffect } from 'react'

export const ProtectedRoute: React.FC<React.PropsWithChildren> = ({ children }) => {
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuth, setIsAuth] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      const auth = isAuthenticated()
      setIsAuth(auth)
      setIsLoading(false)
    }
    checkAuth()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  // ยังไม่ได้ login หรือ token หมดอายุ
  if (!isAuth) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  // login และ signin counter เรียบร้อย
  return <>{children}</>
}
