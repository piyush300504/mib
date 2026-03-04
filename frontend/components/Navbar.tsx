"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function Navbar() {
    const { user, logout } = useAuth();

    if (!user) return null;

    const links: Record<string, { label: string; href: string }[]> = {
        admin: [
            { label: "Teachers", href: "/admin/teachers" },
            { label: "Students", href: "/admin/students" },
            { label: "Courses", href: "/admin/courses" },
        ],
        teacher: [
            { label: "Courses", href: "/teacher/courses" },
            { label: "Quizzes", href: "/teacher/quizzes" },
            { label: "Results", href: "/teacher/results" },
        ],
        student: [
            { label: "Courses", href: "/student/courses" },
        ],
    };

    const roleLinks = links[user.role] || [];

    return (
        <nav className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-6">
                <span className="text-lg font-bold tracking-tight text-indigo-400">LMS</span>
                {roleLinks.map((l) => (
                    <Link
                        key={l.href}
                        href={l.href}
                        className="text-sm text-slate-300 hover:text-white transition-colors"
                    >
                        {l.label}
                    </Link>
                ))}
            </div>
            <div className="flex items-center gap-4">
                <span className="text-xs px-2 py-1 rounded bg-indigo-600/30 text-indigo-300 uppercase tracking-wider">
                    {user.role}
                </span>
                <span className="text-sm text-slate-400">{user.name}</span>
                <button
                    onClick={logout}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                >
                    Logout
                </button>
            </div>
        </nav>
    );
}
