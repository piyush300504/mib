"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Course {
    id: number;
    title: string;
    description: string;
    is_approved: boolean;
}

export default function TeacherCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [loading, setLoading] = useState(false);

    const load = async () => {
        const res = await fetchAPI("/teacher/courses");
        if (res.ok) setCourses(await res.json());
    };

    useEffect(() => { load(); }, []);

    const create = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = await fetchAPI("/teacher/courses", {
            method: "POST",
            body: JSON.stringify({ title, description: desc }),
        });
        if (res.ok) { setTitle(""); setDesc(""); load(); }
        setLoading(false);
    };

    return (
        <ProtectedRoute allowedRoles={["teacher"]}>
            <div className="max-w-4xl mx-auto p-6">
                <h1 className="text-2xl font-bold text-white mb-6">My Courses</h1>

                <form onSubmit={create} className="bg-slate-800/60 backdrop-blur rounded-xl p-6 mb-8 border border-slate-700/50 space-y-4">
                    <h2 className="text-lg font-semibold text-slate-200">Create New Course</h2>
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Course Title" required
                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (optional)" rows={3}
                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                    <button type="submit" disabled={loading}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer">
                        {loading ? "Creating..." : "Create Course"}
                    </button>
                </form>

                <div className="grid gap-4">
                    {courses.map(c => (
                        <div key={c.id} className="bg-slate-800/60 backdrop-blur rounded-xl p-5 border border-slate-700/50 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-white">{c.title}</h3>
                                <p className="text-sm text-slate-400 mt-1">{c.description || "No description"}</p>
                            </div>
                            <div>
                                {c.is_approved ? (
                                    <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-lg text-xs">Approved</span>
                                ) : (
                                    <span className="px-3 py-1 bg-yellow-600/20 text-yellow-400 rounded-lg text-xs">Pending Approval</span>
                                )}
                            </div>
                        </div>
                    ))}
                    {courses.length === 0 && <p className="text-center text-slate-500 py-8">No courses yet. Create one above!</p>}
                </div>
            </div>
        </ProtectedRoute>
    );
}
