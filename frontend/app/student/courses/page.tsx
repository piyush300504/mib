"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Course { id: number; title: string; description: string; is_approved: boolean; }
interface Enrollment { id: number; course_id: number; }
interface Quiz { id: number; title: string; course_id: number; }
interface Question { id: number; text: string; option_a: string; option_b: string; option_c: string; option_d: string; }
interface Attempt { id: number; quiz_id: number; score: number; total: number; percentage: number; passed: boolean; }
interface Certificate { id: number; course_id: number; }

type View = "courses" | "quiz" | "results" | "certificates";

export default function StudentCoursesPage() {
    const [view, setView] = useState<View>("courses");
    const [courses, setCourses] = useState<Course[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [results, setResults] = useState<Attempt[]>([]);
    const [certificates, setCertificates] = useState<Certificate[]>([]);

    // quiz state
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [submitResult, setSubmitResult] = useState<Attempt | null>(null);
    const [quizCourseId, setQuizCourseId] = useState<number | null>(null);

    const enrolledIds = new Set(enrollments.map(e => e.course_id));

    const load = async () => {
        const [cRes, eRes] = await Promise.all([fetchAPI("/student/courses"), fetchAPI("/student/enrollments")]);
        if (cRes.ok) setCourses(await cRes.json());
        if (eRes.ok) setEnrollments(await eRes.json());
    };

    useEffect(() => { load(); }, []);

    const enroll = async (courseId: number) => {
        const res = await fetchAPI(`/student/courses/${courseId}/enroll`, { method: "POST" });
        if (res.ok) load();
    };

    // quiz flow
    const openQuizzes = async (courseId: number) => {
        setQuizCourseId(courseId);
        setSelectedQuiz(null); setQuestions([]); setAnswers({}); setSubmitResult(null);
        // fetch quizzes via teacher endpoint is teacher-only, so we need to find quiz IDs
        // We'll use a workaround: try each quiz. Actually, let's add a simple approach.
        // For now we can get quizzes from the course results or directly.
        // Let's fetch questions for quiz discovery. We'll use the student quiz endpoint.
        // Actually the backend doesn't expose a student quiz list. Let me use a fetch approach.
        const res = await fetchAPI(`/student/courses`);
        // We need to know quiz IDs. Let me just try to fetch from results. 
        // Better: let's add quiz browsing. For now, we'll show an input.
        setView("quiz");
    };

    const loadQuizQuestions = async (quizId: number) => {
        const res = await fetchAPI(`/student/quizzes/${quizId}/questions`);
        if (res.ok) {
            const qs = await res.json();
            setQuestions(qs);
            setSelectedQuiz({ id: quizId, title: `Quiz #${quizId}`, course_id: quizCourseId || 0 });
            setAnswers({});
            setSubmitResult(null);
        } else {
            const d = await res.json();
            alert(d.detail || "Failed to load quiz");
        }
    };

    const submitQuiz = async () => {
        if (!selectedQuiz) return;
        const answerList = Object.entries(answers).map(([qId, opt]) => ({
            question_id: parseInt(qId), selected_option: opt,
        }));
        const res = await fetchAPI(`/student/quizzes/${selectedQuiz.id}/submit`, {
            method: "POST", body: JSON.stringify({ answers: answerList }),
        });
        if (res.ok) {
            setSubmitResult(await res.json());
        } else {
            const d = await res.json();
            alert(d.detail || "Submission failed");
        }
    };

    const loadResults = async () => {
        setView("results");
        const res = await fetchAPI("/student/results");
        if (res.ok) setResults(await res.json());
    };

    const loadCertificates = async () => {
        setView("certificates");
        const res = await fetchAPI("/student/certificates");
        if (res.ok) setCertificates(await res.json());
    };

    const generateCert = async (courseId: number) => {
        const res = await fetchAPI(`/student/courses/${courseId}/certificate`, { method: "POST" });
        if (res.ok) { loadCertificates(); }
        else { const d = await res.json(); alert(d.detail || "Failed"); }
    };

    const downloadCert = (certId: number) => {
        const token = localStorage.getItem("token");
        window.open(`http://localhost:8000/student/certificates/${certId}/download?token=${token}`, "_blank");
    };

    return (
        <ProtectedRoute allowedRoles={["student"]}>
            <div className="max-w-5xl mx-auto p-6">
                {/* Tab navigation */}
                <div className="flex gap-2 mb-6">
                    {(["courses", "quiz", "results", "certificates"] as View[]).map(v => (
                        <button key={v} onClick={() => { if (v === "courses") { setView("courses"); load(); } else if (v === "results") loadResults(); else if (v === "certificates") loadCertificates(); else setView(v); }}
                            className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors cursor-pointer ${view === v ? "bg-indigo-600 text-white" : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"}`}>
                            {v}
                        </button>
                    ))}
                </div>

                {/* COURSES VIEW */}
                {view === "courses" && (
                    <div className="grid gap-4">
                        {courses.map(c => (
                            <div key={c.id} className="bg-slate-800/60 backdrop-blur rounded-xl p-5 border border-slate-700/50 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">{c.title}</h3>
                                    <p className="text-sm text-slate-400 mt-1">{c.description || "No description"}</p>
                                </div>
                                <div className="flex gap-2">
                                    {enrolledIds.has(c.id) ? (
                                        <>
                                            <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-lg text-xs self-center">Enrolled</span>
                                            <button onClick={() => openQuizzes(c.id)}
                                                className="px-3 py-1 bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 rounded-lg text-sm transition-colors cursor-pointer">
                                                Take Quiz
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => enroll(c.id)}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm transition-colors cursor-pointer">
                                            Enroll
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {courses.length === 0 && <p className="text-center text-slate-500 py-8">No approved courses available</p>}
                    </div>
                )}

                {/* QUIZ VIEW */}
                {view === "quiz" && (
                    <div>
                        {!selectedQuiz && (
                            <div className="bg-slate-800/60 backdrop-blur rounded-xl p-6 border border-slate-700/50">
                                <h2 className="text-lg font-semibold text-white mb-4">Enter Quiz ID</h2>
                                <p className="text-sm text-slate-400 mb-4">Ask your teacher for the quiz ID number.</p>
                                <div className="flex gap-3">
                                    <input id="quizIdInput" type="number" placeholder="Quiz ID" min="1"
                                        className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                    <button onClick={() => {
                                        const inp = document.getElementById("quizIdInput") as HTMLInputElement;
                                        if (inp?.value) loadQuizQuestions(parseInt(inp.value));
                                    }} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer">
                                        Load Quiz
                                    </button>
                                </div>
                            </div>
                        )}

                        {selectedQuiz && !submitResult && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-white">{selectedQuiz.title}</h2>
                                {questions.map((q, i) => (
                                    <div key={q.id} className="bg-slate-800/60 backdrop-blur rounded-xl p-5 border border-slate-700/50">
                                        <p className="text-white font-medium mb-3">Q{i + 1}. {q.text}</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {(["a", "b", "c", "d"] as const).map(opt => (
                                                <label key={opt}
                                                    className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${answers[q.id] === opt ? "bg-indigo-600/30 border-indigo-500" : "bg-slate-700/30 hover:bg-slate-700/50"} border border-slate-600`}>
                                                    <input type="radio" name={`q${q.id}`} value={opt}
                                                        checked={answers[q.id] === opt}
                                                        onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                                                        className="accent-indigo-500" />
                                                    <span className="text-slate-300 text-sm uppercase font-medium w-5">{opt}.</span>
                                                    <span className="text-slate-200 text-sm">{q[`option_${opt}` as keyof Question]}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <button onClick={submitQuiz}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors cursor-pointer">
                                    Submit Exam
                                </button>
                            </div>
                        )}

                        {submitResult && (
                            <div className="bg-slate-800/60 backdrop-blur rounded-xl p-8 border border-slate-700/50 text-center">
                                <h2 className="text-2xl font-bold text-white mb-4">Exam Result</h2>
                                <div className="text-6xl mb-4">{submitResult.passed ? "🎉" : "😔"}</div>
                                <p className="text-3xl font-bold mb-2" style={{ color: submitResult.passed ? "#4ade80" : "#f87171" }}>
                                    {submitResult.percentage}%
                                </p>
                                <p className="text-slate-400 mb-2">Score: {submitResult.score} / {submitResult.total}</p>
                                <span className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold ${submitResult.passed ? "bg-green-600/20 text-green-400" : "bg-red-600/20 text-red-400"}`}>
                                    {submitResult.passed ? "PASSED ✅" : "FAILED ❌"}
                                </span>
                                <div className="mt-6">
                                    <button onClick={() => { setSelectedQuiz(null); setSubmitResult(null); setView("courses"); }}
                                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors cursor-pointer">
                                        Back to Courses
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* RESULTS VIEW */}
                {view === "results" && (
                    <div className="bg-slate-800/60 backdrop-blur rounded-xl border border-slate-700/50 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700">
                                    <th className="text-left p-4 text-sm text-slate-400 font-medium">Quiz ID</th>
                                    <th className="text-left p-4 text-sm text-slate-400 font-medium">Score</th>
                                    <th className="text-left p-4 text-sm text-slate-400 font-medium">Percentage</th>
                                    <th className="text-left p-4 text-sm text-slate-400 font-medium">Result</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map(r => (
                                    <tr key={r.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4 text-slate-300">{r.quiz_id}</td>
                                        <td className="p-4 text-slate-300">{r.score}/{r.total}</td>
                                        <td className="p-4 text-slate-300">{r.percentage}%</td>
                                        <td className="p-4">
                                            {r.passed ? <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs">Pass</span>
                                                : <span className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs">Fail</span>}
                                        </td>
                                    </tr>
                                ))}
                                {results.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">No attempts yet</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* CERTIFICATES VIEW */}
                {view === "certificates" && (
                    <div>
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-white mb-3">Generate Certificate</h2>
                            <p className="text-sm text-slate-400 mb-3">Available for courses where you passed at least one quiz.</p>
                            <div className="flex flex-wrap gap-2">
                                {courses.filter(c => enrolledIds.has(c.id)).map(c => (
                                    <button key={c.id} onClick={() => generateCert(c.id)}
                                        className="px-4 py-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 rounded-lg text-sm transition-colors cursor-pointer">
                                        🏆 {c.title}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {certificates.map(c => (
                                <div key={c.id} className="bg-slate-800/60 backdrop-blur rounded-xl p-4 border border-slate-700/50 flex items-center justify-between">
                                    <span className="text-white">Certificate #{c.id} — Course #{c.course_id}</span>
                                    <button onClick={() => downloadCert(c.id)}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm transition-colors cursor-pointer">
                                        📥 Download
                                    </button>
                                </div>
                            ))}
                            {certificates.length === 0 && <p className="text-center text-slate-500 py-8">No certificates yet</p>}
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
