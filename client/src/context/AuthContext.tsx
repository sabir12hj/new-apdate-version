import { createContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  googleLogin: (googleId: string, email: string, username: string) => Promise<boolean>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: true,
  login: async () => false,
  register: async () => false,
  googleLogin: async () => false,
  logout: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check if user is logged in on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication state...');
        const token = localStorage.getItem("token");
        if (!token) {
          console.log('No auth token found');
          setIsLoading(false);
          return;
        }

        console.log('Token found, verifying with server...');
        const response = await fetch("/api/auth/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          console.log('User authenticated successfully:', data.user);
          console.log('User admin status:', data.user.isAdmin);
          setUser(data.user);
        } else {
          console.log('Invalid token or authentication failed');
          // Clear token if invalid
          localStorage.removeItem("token");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login for email:', email);
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      const data = await response.json();
      
      console.log('Login successful, user data:', data.user);
      console.log('Admin status:', data.user.isAdmin);
      
      setUser(data.user);
      localStorage.setItem("token", data.token);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.username}!${data.user.isAdmin ? ' (Admin)' : ''}`,
      });
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials",
        variant: "destructive",
      });
      return false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiRequest("POST", "/api/auth/register", {
        username,
        email,
        password,
      });
      
      const data = await response.json();
      
      setUser(data.user);
      localStorage.setItem("token", data.token);
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${data.user.username}!`,
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      return false;
    }
  };

  const googleLogin = async (googleId: string, email: string, username: string): Promise<boolean> => {
    try {
      const response = await apiRequest("POST", "/api/auth/google", {
        googleId,
        email,
        username,
      });
      
      const data = await response.json();
      
      setUser(data.user);
      localStorage.setItem("token", data.token);
      
      toast({
        title: "Google login successful",
        description: `Welcome, ${data.user.username}!`,
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Google login failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    toast({
      title: "Logged out successfully",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.isAdmin || false,
        isLoading,
        login,
        register,
        googleLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
