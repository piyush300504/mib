"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Course { id: number; title: string; }
interface Quiz { id: number; title: string; course_id: number; }
interface Question { id: number; text: string; option_a: string; option_b: string; option_c: string; option_d: string; correct_option: string; }

export default function TeacherQuizzesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [selectedQuiz, setSelectedQuiz] = useState<number | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);

    // quiz form
    const [quizTitle, setQuizTitle] = useState("");
    // question form
    const [qText, setQText] = useState("");
    const [optA, setOptA] = useState("");
    const [optB, setOptB] = useState("");
    const [optC, setOptC] = useState("");
    const [optD, setOptD] = useState("");
    const [correct, setCorrect] = useState("a");

    useEffect(() => {
        fetchAPI("/teacher/courses").then(r => r.ok ? r.json() : []).then(setCourses);
    }, []);

    const loadQuizzes = async (courseId: number) => {
        setSelectedCourse(courseId);
        setSelectedQuiz(null);
        setQuestions([]);
        const res = await fetchAPI(`/teacher/courses/${courseId}/quizzes`);
        if (res.ok) setQuizzes(await res.json());
    };

    const createQuiz = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCourse) return;
        const res = await fetchAPI(`/teacher/courses/${selectedCourse}/quizzes`, {
            method: "POST", body: JSON.stringify({ title: quizTitle }),
        });
        if (res.ok) { setQuizTitle(""); loadQuizzes(selectedCourse); }
    };

    const loadQuestions = async (quizId: number) => {
        setSelectedQuiz(quizId);
        const res = await fetchAPI(`/teacher/quizzes/${quizId}/questions`);
        if (res.ok) setQuestions(await res.json());
    };

    const addQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedQuiz) return;
        const res = await fetchAPI(`/teacher/quizzes/${selectedQuiz}/questions`, {
            method: "POST",
            body: JSON.stringify({ text: qText, option_a: optA, option_b: optB, option_c: optC, option_d: optD, correct_option: correct }),
        });
        if (res.ok) {
            setQText(""); setOptA(""); setOptB(""); setOptC(""); setOptD(""); setCorrect("a");
            loadQuestions(selectedQuiz);
        }
    };

    return (
        <ProtectedRoute allowedRoles={["teacher"]}>
            <div className="max-w-5xl mx-auto p-6">
                <h1 className="text-2xl font-bold text-white mb-6">Quizzes & Questions</h1>

                {/* Course selector */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {courses.map(c => (
                        <button key={c.id} onClick={() => loadQuizzes(c.id)}
                            className={`px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer ${selectedCourse === c.id ? "bg-indigo-600 text-white" : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"}`}>
                            {c.title}
                        </button>
                    ))}
                    {courses.length === 0 && <p className="text-slate-500">Create a course first.</p>}
                </div>

                {selectedCourse && (
                    <>
                        {/* Create quiz */}
                        <form onSubmit={createQuiz} className="bg-slate-800/60 backdrop-blur rounded-xl p-5 mb-6 border border-slate-700/50 flex gap-3">
                            <input value={quizTitle} onChange={e => setQuizTitle(e.target.value)} placeholder="Quiz title" required
                                className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer">Create Quiz</button>
                        </form>

                        {/* Quiz list */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            {quizzes.map(q => (
                                <button key={q.id} onClick={() => loadQuestions(q.id)}
                                    className={`px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer ${selectedQuiz === q.id ? "bg-emerald-600 text-white" : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"}`}>
                                    {q.title}
                                </button>
                            ))}
                            {quizzes.length === 0 && <p className="text-slate-500 text-sm">No quizzes yet.</p>}
                        </div>
                    </>
                )}

                {selectedQuiz && (
                    <>
                        {/* Add question */}
                        <form onSubmit={addQuestion} className="bg-slate-800/60 backdrop-blur rounded-xl p-5 mb-6 border border-slate-700/50 space-y-3">
                            <h3 className="text-md font-semibold text-slate-200">Add MCQ Question</h3>
                            <textarea value={qText} onChange={e => setQText(e.target.value)} placeholder="Question text" required rows={2}
                                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                            <div className="grid grid-cols-2 gap-3">
                                <input value={optA} onChange={e => setOptA(e.target.value)} placeholder="Option A" required
                                    className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                <input value={optB} onChange={e => setOptB(e.target.value)} placeholder="Option B" required
                                    className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                <input value={optC} onChange={e => setOptC(e.target.value)} placeholder="Option C" required
                                    className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                <input value={optD} onChange={e => setOptD(e.target.value)} placeholder="Option D" required
                                    className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="text-sm text-slate-400">Correct:</label>
                                <select value={correct} onChange={e => setCorrect(e.target.value)}
                                    className="px-3 py-1.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="a">A</option><option value="b">B</option><option value="c">C</option><option value="d">D</option>
                                </select>
                                <button type="submit" className="ml-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer">Add Question</button>
                            </div>
                        </form>

                        {/* Question list */}
                        <div className="space-y-3">
                            {questions.map((q, i) => (
                                <div key={q.id} className="bg-slate-800/60 backdrop-blur rounded-xl p-4 border border-slate-700/50">
                                    <p className="text-white font-medium mb-2">Q{i + 1}. {q.text}</p>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <span className={`px-3 py-1 rounded ${q.correct_option === "a" ? "bg-green-600/20 text-green-400" : "text-slate-400"}`}>A: {q.option_a}</span>
                                        <span className={`px-3 py-1 rounded ${q.correct_option === "b" ? "bg-green-600/20 text-green-400" : "text-slate-400"}`}>B: {q.option_b}</span>
                                        <span className={`px-3 py-1 rounded ${q.correct_option === "c" ? "bg-green-600/20 text-green-400" : "text-slate-400"}`}>C: {q.option_c}</span>
                                        <span className={`px-3 py-1 rounded ${q.correct_option === "d" ? "bg-green-600/20 text-green-400" : "text-slate-400"}`}>D: {q.option_d}</span>
                                    </div>
                                </div>
                            ))}
                            {questions.length === 0 && <p className="text-center text-slate-500 py-4">No questions yet.</p>}
                        </div>
                    </>
                )}
            </div>
        </ProtectedRoute>
    );
}
