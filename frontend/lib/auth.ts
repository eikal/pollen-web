/**
 * Authentication utilities for client-side auth state.
 */

interface DecodedToken {
  id: string;
  email: string;
  exp: number;
  iat: number;
}

interface User {
  id: string;
  email: string;
  displayName?: string;
}

/**
 * Decode JWT token (simple base64 decode - NOT cryptographic verification)
 * Server should always verify tokens, this is just for reading claims client-side.
 */
function decodeJWT(token: string): DecodedToken | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (err) {
    console.error('Failed to decode JWT:', err);
    return null;
  }
}

/**
 * Get current user from localStorage.
 */
export function getUser(): User | null {
  if (typeof window === 'undefined') return null;

  const userStr = localStorage.getItem('pollen_user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch (err) {
    return null;
  }
}

/**
 * Get auth token from localStorage.
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pollen_token');
}

/**
 * Get user's organization ID.
 * Makes a call to /auth/me to get full user details including org_id.
 */
export async function getUserOrgId(): Promise<string | null> {
  const token = getToken();
  if (!token) return null;

  try {
    const response = await fetch('http://localhost:4000/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    // The /auth/me endpoint now returns { user: { id, email, displayName, orgId } }
    return data.user?.orgId || null;
  } catch (err) {
    console.error('Failed to get user org ID:', err);
    return null;
  }
}

/**
 * Check if user is authenticated.
 */
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;

  const decoded = decodeJWT(token);
  if (!decoded) return false;

  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp > now;
}

/**
 * Log out user.
 */
export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('pollen_token');
  localStorage.removeItem('pollen_user');
  window.location.href = '/auth/login';
}

export default {
  getUser,
  getToken,
  getUserOrgId,
  isAuthenticated,
  logout,
};
