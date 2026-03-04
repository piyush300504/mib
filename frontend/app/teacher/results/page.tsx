"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Course { id: number; title: string; }
interface Result {
    student_name: string;
    student_email: string;
    quiz_title: string;
    score: number;
    total: number;
    percentage: number;
    passed: boolean;
    attempted_at: string;
}

export default function TeacherResultsPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [selected, setSelected] = useState<number | null>(null);
    const [results, setResults] = useState<Result[]>([]);

    useEffect(() => {
        fetchAPI("/teacher/courses").then(r => r.ok ? r.json() : []).then(setCourses);
    }, []);

    const loadResults = async (courseId: number) => {
        setSelected(courseId);
        const res = await fetchAPI(`/teacher/courses/${courseId}/results`);
        if (res.ok) setResults(await res.json());
    };

    return (
        <ProtectedRoute allowedRoles={["teacher"]}>
            <div className="max-w-5xl mx-auto p-6">
                <h1 className="text-2xl font-bold text-white mb-6">Student Performance</h1>

                <div className="flex flex-wrap gap-2 mb-6">
                    {courses.map(c => (
                        <button key={c.id} onClick={() => loadResults(c.id)}
                            className={`px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer ${selected === c.id ? "bg-indigo-600 text-white" : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"}`}>
                            {c.title}
                        </button>
                    ))}
                </div>

                {selected && (
                    <div className="bg-slate-800/60 backdrop-blur rounded-xl border border-slate-700/50 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700">
                                    <th className="text-left p-4 text-sm text-slate-400 font-medium">Student</th>
                                    <th className="text-left p-4 text-sm text-slate-400 font-medium">Quiz</th>
                                    <th className="text-left p-4 text-sm text-slate-400 font-medium">Score</th>
                                    <th className="text-left p-4 text-sm text-slate-400 font-medium">%</th>
                                    <th className="text-left p-4 text-sm text-slate-400 font-medium">Result</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((r, i) => (
                                    <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4">
                                            <div className="text-white">{r.student_name}</div>
                                            <div className="text-xs text-slate-500">{r.student_email}</div>
                                        </td>
                                        <td className="p-4 text-slate-300">{r.quiz_title}</td>
                                        <td className="p-4 text-slate-300">{r.score}/{r.total}</td>
                                        <td className="p-4 text-slate-300">{r.percentage}%</td>
                                        <td className="p-4">
                                            {r.passed ? (
                                                <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs">Pass</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs">Fail</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {results.length === 0 && (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">No attempts yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
