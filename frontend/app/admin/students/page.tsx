"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

export default function StudentsPage() {
    const [students, setStudents] = useState<User[]>([]);

    const load = async () => {
        const res = await fetchAPI("/admin/students");
        if (res.ok) setStudents(await res.json());
    };

    useEffect(() => { load(); }, []);

    const remove = async (id: number) => {
        await fetchAPI(`/admin/students/${id}`, { method: "DELETE" });
        load();
    };

    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <div className="max-w-4xl mx-auto p-6">
                <h1 className="text-2xl font-bold text-white mb-6">Manage Students</h1>

                <div className="bg-slate-800/60 backdrop-blur rounded-xl border border-slate-700/50 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700">
                                <th className="text-left p-4 text-sm text-slate-400 font-medium">ID</th>
                                <th className="text-left p-4 text-sm text-slate-400 font-medium">Name</th>
                                <th className="text-left p-4 text-sm text-slate-400 font-medium">Email</th>
                                <th className="text-right p-4 text-sm text-slate-400 font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(s => (
                                <tr key={s.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                                    <td className="p-4 text-slate-300">{s.id}</td>
                                    <td className="p-4 text-white">{s.name}</td>
                                    <td className="p-4 text-slate-400">{s.email}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => remove(s.id)}
                                            className="px-3 py-1 bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded-lg text-sm transition-colors cursor-pointer">
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {students.length === 0 && (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-500">No students yet</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </ProtectedRoute>
    );
}
