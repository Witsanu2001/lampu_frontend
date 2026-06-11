const TOKEN_KEY = 'auth_token'
const TOKEN_EXPIRY_KEY = 'auth_token_expiry'

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export const setToken = (token: string, expiresInHours: number = 24): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
  const expiryTime = Date.now() + expiresInHours * 60 * 60 * 1000
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString())
}

export const isTokenExpired = (): boolean => {
  if (typeof window === 'undefined') return true
  const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY)
  if (!expiryTime) return true
  return Date.now() > parseInt(expiryTime)
}

export const removeToken = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRY_KEY)
}

export const isAuthenticated = (): boolean => {
  const token = getToken()
  if (!token) {
    // Check if userData exists (for LINE/Firebase auth)
    const userData = localStorage.getItem('userData')
    if (userData) {
      try {
        const parsed = JSON.parse(userData)
        return !!parsed.uid
      } catch (e) {
        return false
      }
    }
    return false
  }
  if (isTokenExpired()) {
    removeToken()
    return false
  }
  return true
}

