import { useState, useEffect, useCallback } from 'react';
import { getSession, loginUser, registerUser, logoutUser, setSessionCookie } from '../services/auth.service';

/**
 * Custom React hook for managing authentication state in N2 Japanese Mastery Studio.
 *
 * Exposes:
 *  - `session`: Current active user session { uid, displayName, loginAt } or null.
 *  - `isLoading`: Boolean flag indicating if session restoration is in progress.
 *  - `login(usernameOrUser, password)`: Logs user in, syncs cookie/sessionStorage, and updates state.
 *  - `register(username, password)`: Registers new account and auto logs in.
 *  - `logout()`: Ends session, clears cookie/sessionStorage, and resets state.
 *
 * @returns {object} Authentication state and control functions.
 */
export function useAuth() {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session on client mount
  useEffect(() => {
    const current = getSession();
    if (current && current.uid) {
      setSession(current);
      setSessionCookie(current.uid);
    }
    setIsLoading(false);
  }, []);

  /**
   * Authenticates user using credentials or adopts an existing session object.
   *
   * @param {string|object} usernameOrUser - Username string or session object.
   * @param {string} [password] - Password string if username is provided.
   * @returns {Promise<{ ok: boolean, user?: object, error?: string }>}
   */
  const handleLogin = useCallback(async (usernameOrUser, password) => {
    const result = await loginUser(usernameOrUser, password);
    if (result.ok && result.user) {
      setSession(result.user);
      setSessionCookie(result.user.uid);
    }
    return result;
  }, []);

  /**
   * Registers a new account and automatically logs in upon success.
   *
   * @param {string} username - Desired username.
   * @param {string} password - Desired password.
   * @returns {Promise<{ ok: boolean, user?: object, error?: string }>}
   */
  const handleRegister = useCallback(async (username, password) => {
    const result = await registerUser(username, password);
    if (result.ok && result.user) {
      return handleLogin(username, password);
    }
    return result;
  }, [handleLogin]);

  /**
   * Clears the active session and authentication cookies.
   */
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
