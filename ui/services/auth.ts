import { API_CONFIG, fetchApi } from '../config/api';

interface AuthState {
  token: string | null;
  walletAddress: string | null;
  username: string | null;
  expiresAt: string | null;
  walletType: string | null;
}

/**
 * 获取认证状态
 */
export function getAuthState(): AuthState {
  if (typeof window === 'undefined') {
    return {
      token: null,
      walletAddress: null,
      username: null,
      expiresAt: null,
      walletType: null
    };
  }

  return {
    token: localStorage.getItem('token'),
    walletAddress: localStorage.getItem('wallet_address'),
    username: localStorage.getItem('username'),
    expiresAt: localStorage.getItem('token_expires_at'),
    walletType: localStorage.getItem('wallet_type')
  };
}

/**
 * 设置认证状态
 */
export function setAuthState(state: Partial<AuthState>): void {
  if (typeof window === 'undefined') return;

  if (state.token !== undefined) {
    if (state.token === null) {
      localStorage.removeItem('token');
    } else {
      localStorage.setItem('token', state.token);
    }
  }

  if (state.walletAddress !== undefined) {
    if (state.walletAddress === null) {
      localStorage.removeItem('wallet_address');
    } else {
      localStorage.setItem('wallet_address', state.walletAddress);
    }
  }

  if (state.username !== undefined) {
    if (state.username === null) {
      localStorage.removeItem('username');
    } else {
      localStorage.setItem('username', state.username);
    }
  }

  if (state.expiresAt !== undefined) {
    if (state.expiresAt === null) {
      localStorage.removeItem('token_expires_at');
    } else {
      localStorage.setItem('token_expires_at', state.expiresAt);
    }
  }

  if (state.walletType !== undefined) {
    if (state.walletType === null) {
      localStorage.removeItem('wallet_type');
    } else {
      localStorage.setItem('wallet_type', state.walletType);
    }
  }
}

/**
 * 清除认证状态
 */
export function clearAuthState(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('token');
  localStorage.removeItem('wallet_address');
  localStorage.removeItem('username');
  localStorage.removeItem('token_expires_at');
  localStorage.removeItem('wallet_type');
}

/**
 * 退出登录
 * @throws Error 当请求失败时抛出错误
 */
export async function logout(): Promise<void> {
  try {
    const { token } = getAuthState();
    if (!token) {
      throw new Error('未登录状态');
    }

    await fetchApi(API_CONFIG.PATHS.AUTH.LOGOUT, {
      method: 'POST',
    });
  } catch (error) {
    console.error('Logout failed:', error);
  } finally {
    // 无论如何都清除认证状态
    clearAuthState();
    
    // 重定向到登录页
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
}

/**
 * 检查是否已登录
 * @returns boolean
 */
export function isAuthenticated(): boolean {
  const { token, expiresAt } = getAuthState();
  
  if (!token || !expiresAt) {
    return false;
  }

  try {
    // 检查token是否过期
    const expirationTime = new Date(expiresAt).getTime();
    const currentTime = new Date().getTime();
    
    return currentTime < expirationTime;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
} 