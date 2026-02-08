import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { API_BASE } from "../config";

const AuthContext = createContext(null);

// const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const AuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user is logged in on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/auth/me`, {
                credentials: "include" // Send cookies
            });

            if (response.ok) {
                const data = await response.json();
                setAdmin(data.admin);
            } else {
                setAdmin(null);
            }
        } catch (err) {
            console.error("Auth check failed:", err);
            setAdmin(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Login failed");
                return { success: false, error: data.error };
            }

            setAdmin(data.admin);
            return { success: true };
        } catch (err) {
            const errorMsg = "Network error. Please check if server is running.";
            setError(errorMsg);
            return { success: false, error: errorMsg };
        }
    };

    const register = async (email, password, setupKey = null) => {
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, password, setupKey })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Registration failed");
                return { success: false, error: data.error };
            }

            return { success: true, message: data.message };
        } catch (err) {
            const errorMsg = "Network error. Please try again.";
            setError(errorMsg);
            return { success: false, error: errorMsg };
        }
    };

    const logout = async () => {
        try {
            await fetch(`${API_BASE}/api/auth/logout`, {
                method: "POST",
                credentials: "include"
            });
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            setAdmin(null);
        }
    };

    const refreshToken = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/api/auth/refresh`, {
                method: "POST",
                credentials: "include"
            });

            if (response.ok) {
                const data = await response.json();
                setAdmin(data.admin);
                return true;
            }
            return false;
        } catch (err) {
            console.error("Token refresh failed:", err);
            return false;
        }
    }, []);

    // Auto-refresh token before expiry (every 14 minutes)
    useEffect(() => {
        if (!admin) return;

        const interval = setInterval(() => {
            refreshToken();
        }, 14 * 60 * 1000);

        return () => clearInterval(interval);
    }, [admin, refreshToken]);

    const value = {
        admin,
        loading,
        error,
        isAuthenticated: !!admin,
        login,
        register,
        logout,
        checkAuth,
        clearError: () => setError(null)
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export default AuthContext;
