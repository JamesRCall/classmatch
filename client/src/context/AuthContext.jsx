import React, { createContext, useContext, useState, useEffect } from "react";
import usersService from "../services/usersService";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user session from localStorage on mount
  useEffect(() => {
    const loadSession = async () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        } catch (error) {
          console.error("Error loading session:", error);
          localStorage.removeItem("user");
        }
      }
      setLoading(false);
    };

    loadSession();
  }, []);

  // Login user with backend API
  const login = async (email, password) => {
    try {
      const response = await usersService.login(email, password);

      if (response.ok && response.user) {
        setUser(response.user);
        return response.user;
      } else {
        throw new Error(response.error || "Invalid email or password");
      }
    } catch (error) {
      throw new Error(error.error || "Login failed. Please try again.");
    }
  };

  // Register new user with backend API
  const signup = async (userData) => {
    try {
      const response = await usersService.register({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        major: userData.major,
        year: userData.year,
      });

      if (response.ok && response.user_id) {
        //Auto-login after successful registration
        const loginResponse = await usersService.login(
          userData.email,
          userData.password
        );

        if (loginResponse.ok && loginResponse.user) {
          setUser(loginResponse.user);
          return loginResponse.user;
        }
      }

      throw new Error(response.error || "Registration failed");
    } catch (error) {
      throw new Error(error.error || "Signup failed. Please try again.");
    }
  };

  const logout = () => {
    usersService.logout();
    setUser(null);
  };

  // Update user profile with backend API
  const updateProfile = async (updates) => {
    if (!user) return;

    try {
      await usersService.updateUser(user.id, updates);
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  const value = {
    user,
    login,
    signup,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
