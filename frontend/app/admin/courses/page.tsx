"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Course {
    id: number;
    title: string;
    description: string;
    teacher_id: number;
    is_approved: boolean;
}

export default function AdminCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [criteria, setCriteria] = useState<Record<number, string>>({});

    const load = async () => {
        const res = await fetchAPI("/admin/courses");
        if (res.ok) setCourses(await res.json());
    };

    useEffect(() => { load(); }, []);

    const approve = async (id: number) => {
        await fetchAPI(`/admin/courses/${id}/approve`, { method: "PATCH" });
        load();
    };

    const setPassPct = async (id: number) => {
        const pct = parseFloat(criteria[id] || "60");
        await fetchAPI(`/admin/courses/${id}/passing-criteria`, {
            method: "PUT",
            body: JSON.stringify({ percentage: pct }),
        });
        alert(`Passing criteria set to ${pct}%`);
    };

    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <div className="max-w-5xl mx-auto p-6">
                <h1 className="text-2xl font-bold text-white mb-6">Manage Courses</h1>

                <div className="bg-slate-800/60 backdrop-blur rounded-xl border border-slate-700/50 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700">
                                <th className="text-left p-4 text-sm text-slate-400 font-medium">ID</th>
                                <th className="text-left p-4 text-sm text-slate-400 font-medium">Title</th>
                                <th className="text-left p-4 text-sm text-slate-400 font-medium">Status</th>
                                <th className="text-left p-4 text-sm text-slate-400 font-medium">Pass %</th>
                                <th className="text-right p-4 text-sm text-slate-400 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.map(c => (
                                <tr key={c.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                                    <td className="p-4 text-slate-300">{c.id}</td>
                                    <td className="p-4 text-white">{c.title}</td>
                                    <td className="p-4">
                                        {c.is_approved ? (
                                            <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs">Approved</span>
                                        ) : (
                                            <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded text-xs">Pending</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number" min="0" max="100" placeholder="60"
                                                value={criteria[c.id] || ""}
                                                onChange={e => setCriteria({ ...criteria, [c.id]: e.target.value })}
                                                className="w-20 px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <button onClick={() => setPassPct(c.id)}
                                                className="px-2 py-1 bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 rounded text-xs transition-colors cursor-pointer">
                                                Set
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        {!c.is_approved && (
                                            <button onClick={() => approve(c.id)}
                                                className="px-3 py-1 bg-green-600/20 text-green-400 hover:bg-green-600/40 rounded-lg text-sm transition-colors cursor-pointer">
                                                Approve
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {courses.length === 0 && (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-500">No courses yet</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </ProtectedRoute>
    );
}
