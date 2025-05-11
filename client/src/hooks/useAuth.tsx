import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useLocation } from "wouter";

export const useAuth = () => {
  const auth = useContext(AuthContext);
  const [location, setLocation] = useLocation();

  // Enhanced functions that handle redirects
  const loginWithRedirect = async (email: string, password: string, redirectTo: string = "/") => {
    const success = await auth.login(email, password);
    if (success) {
      setLocation(redirectTo);
    }
    return success;
  };

  const registerWithRedirect = async (username: string, email: string, password: string, redirectTo: string = "/") => {
    const success = await auth.register(username, email, password);
    if (success) {
      setLocation(redirectTo);
    }
    return success;
  };

  const googleLoginWithRedirect = async (googleId: string, email: string, username: string, redirectTo: string = "/") => {
    const success = await auth.googleLogin(googleId, email, username);
    if (success) {
      setLocation(redirectTo);
    }
    return success;
  };

  const logoutWithRedirect = (redirectTo: string = "/") => {
    auth.logout();
    setLocation(redirectTo);
  };

  // Redirects to login if not authenticated
  const requireAuth = (redirectTo: string = "/login") => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      setLocation(redirectTo);
      return false;
    }
    return true;
  };

  // Redirects to home if not admin
  const requireAdmin = (redirectTo: string = "/") => {
    if (!auth.isLoading && (!auth.isAuthenticated || !auth.isAdmin)) {
      setLocation(redirectTo);
      return false;
    }
    return true;
  };

  return {
    ...auth,
    loginWithRedirect,
    registerWithRedirect,
    googleLoginWithRedirect,
    logoutWithRedirect,
    requireAuth,
    requireAdmin,
  };
};
