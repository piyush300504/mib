"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface User {
    user_id: number;
    name: string;
    role: string;
    token: string;
}

interface AuthContextType {
    user: User | null;
    login: (data: { access_token: string; role: string; user_id: number; name: string }) => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: () => { },
    logout: () => { },
    loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (stored) {
            setUser(JSON.parse(stored));
        }
        setLoading(false);
    }, []);

    const login = (data: { access_token: string; role: string; user_id: number; name: string }) => {
        const u: User = {
            user_id: data.user_id,
            name: data.name,
            role: data.role,
            token: data.access_token,
        };
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user", JSON.stringify(u));
        setUser(u);

        // redirect based on role
        if (data.role === "admin") router.push("/admin/teachers");
        else if (data.role === "teacher") router.push("/teacher/courses");
        else router.push("/student/courses");
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
