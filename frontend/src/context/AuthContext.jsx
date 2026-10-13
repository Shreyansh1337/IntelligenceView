import { createContext, useCallback, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(localStorage.getItem("access_token"))
  );

  function login(token) {
    localStorage.setItem("access_token", token);
    setIsAuthenticated(true);
  }

  const logout = useCallback(() => {
  localStorage.removeItem("access_token");
  setIsAuthenticated(false);
    }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

