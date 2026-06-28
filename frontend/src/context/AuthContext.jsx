import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

// ── JWT helpers ───────────────────────────────────────────────────────────────
function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  return Date.now() / 1000 > decoded.exp;
}

// ── Module-level token store ──────────────────────────────────────────────────
// api.js reads from this instead of localStorage so there's no timing race.
let _activeToken = localStorage.getItem('cw_token') || null;

/** Called by api.js to get the current token synchronously */
export function getActiveToken() {
  return _activeToken;
}

// ── AuthProvider ──────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const storedToken = localStorage.getItem('cw_token');
  const validStored = storedToken && !isTokenExpired(storedToken) ? storedToken : null;

  const [token, setToken] = useState(validStored);
  const [user, setUser]   = useState(validStored ? decodeToken(validStored) : null);

  // Auto-expire: schedule token wipe when JWT reaches its exp time
  useEffect(() => {
    if (!token) return;
    const decoded = decodeToken(token);
    if (!decoded?.exp) return;
    const msLeft = decoded.exp * 1000 - Date.now();
    if (msLeft <= 0) { _logout(); return; }
    const timer = setTimeout(() => _logout(), msLeft);
    return () => clearTimeout(timer);
  }, [token]);

  // Internal wipe helper (used by auto-expiry)
  function _logout() {
    _activeToken = null;
    localStorage.removeItem('cw_token');
    setToken(null);
    setUser(null);
  }

  /**
   * Call after a successful /login or /register response.
   * We write to both the module-level variable AND localStorage SYNCHRONOUSLY
   * before the React state update, so api.js can read the token immediately
   * when Dashboard mounts and fires its first useEffect.
   */
  const login = useCallback((newToken, userData) => {
    // ✅ Synchronous writes happen BEFORE any React re-render
    _activeToken = newToken;
    localStorage.setItem('cw_token', newToken);

    // Trigger re-render
    setToken(newToken);
    setUser(userData || decodeToken(newToken));
  }, []);

  const logout = useCallback(() => {
    _activeToken = null;
    localStorage.removeItem('cw_token');
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = Boolean(token && user && !isTokenExpired(token));

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
