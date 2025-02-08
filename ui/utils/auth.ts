/**
 * 检查用户是否已登录
 */
export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false

  const token = localStorage.getItem('access_token')
  const expiresAt = localStorage.getItem('token_expires_at')

  if (!token || !expiresAt) return false

  // 检查令牌是否过期
  const expiryDate = new Date(expiresAt)
  if (expiryDate < new Date()) {
    // 清除过期的令牌
    clearAuthData()
    return false
  }

  return true
}

/**
 * 获取访问令牌
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

/**
 * 获取钱包地址
 */
export function getWalletAddress(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('wallet_address')
}

/**
 * 清除认证数据
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('access_token')
  localStorage.removeItem('wallet_address')
  localStorage.removeItem('token_expires_at')
}

/**
 * 退出登录
 */
export async function logout(): Promise<void> {
  try {
    const token = getAccessToken()
    if (!token) return

    // 调用退出接口
    await fetch('/api/v1/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  } finally {
    // 无论接口调用是否成功，都清除本地认证数据
    clearAuthData()
  }
} 