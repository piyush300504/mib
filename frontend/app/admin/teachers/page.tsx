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

export default function TeachersPage() {
    const [teachers, setTeachers] = useState<User[]>([]);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const loadTeachers = async () => {
        const res = await fetchAPI("/admin/teachers");
        if (res.ok) setTeachers(await res.json());
    };

    useEffect(() => { loadTeachers(); }, []);

    const addTeacher = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        const res = await fetchAPI("/admin/teachers", {
            method: "POST",
            body: JSON.stringify({ name, email, password, role: "teacher" }),
        });
        if (!res.ok) {
            const d = await res.json();
            setError(d.detail || "Failed");
        } else {
            setName(""); setEmail(""); setPassword("");
            loadTeachers();
        }
        setLoading(false);
    };

    const removeTeacher = async (id: number) => {
        await fetchAPI(`/admin/teachers/${id}`, { method: "DELETE" });
        loadTeachers();
    };

    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <div className="max-w-4xl mx-auto p-6">
                <h1 className="text-2xl font-bold text-white mb-6">Manage Teachers</h1>

                <form onSubmit={addTeacher} className="bg-slate-800/60 backdrop-blur rounded-xl p-6 mb-8 border border-slate-700/50 space-y-4">
                    <h2 className="text-lg font-semibold text-slate-200">Add New Teacher</h2>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" required
                            className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" required
                            className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" required
                            className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <button type="submit" disabled={loading}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer">
                        {loading ? "Adding..." : "Add Teacher"}
                    </button>
                </form>

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
                            {teachers.map(t => (
                                <tr key={t.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                                    <td className="p-4 text-slate-300">{t.id}</td>
                                    <td className="p-4 text-white">{t.name}</td>
                                    <td className="p-4 text-slate-400">{t.email}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => removeTeacher(t.id)}
                                            className="px-3 py-1 bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded-lg text-sm transition-colors cursor-pointer">
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {teachers.length === 0 && (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-500">No teachers yet</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </ProtectedRoute>
    );
}
