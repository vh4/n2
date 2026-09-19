import { useState, useEffect, useCallback } from 'react';
import { getSession, loginUser, registerUser, logoutUser } from '../services/auth.service';

/**
 * Custom React hook for managing authentication state in N2 Japanese Mastery Studio.
 *
 * Exposes:
 *  - `session`: Current active user session { uid, displayName, loginAt } or null.
 *  - `handleLogin(username, password)`: Logs user in and updates state.
 *  - `handleRegister(username, password)`: Registers new account and auto logs in.
 *  - `handleLogout()`: Ends session and resets state.
 *
 * @returns {object} Authentication state and control functions.
 */
export function useAuth() {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session on client mount
  useEffect(() => {
    const current = getSession();
    setSession(current);
    setIsLoading(false);
  }, []);

  const handleLogin = useCallback(async (username, password) => {
    const result = await loginUser(username, password);
    if (result.ok && result.user) {
      setSession(result.user);
    }
    return result;
  }, []);

  const handleRegister = useCallback(async (username, password) => {
    const result = await registerUser(username, password);
    if (result.ok && result.user) {
      // Automatically log in after registration
      return handleLogin(username, password);
    }
    return result;
  }, [handleLogin]);

  const handleLogout = useCallback(() => {
    logoutUser();
    setSession(null);
  }, []);

  return {
    session,
    isLoading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout
  };
}
