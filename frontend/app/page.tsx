"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { FaBookOpen, FaGraduationCap, FaUsers } from "react-icons/fa";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      if (user.role === "admin") {
        router.push("/admin/teachers");
      } else if (user.role === "teacher") {
        router.push("/teacher/courses");
      } else {
        router.push("/student/courses");
      }
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <FaGraduationCap className="h-8 w-8 text-indigo-600" />
          <span className="text-2xl font-bold text-gray-900">E-Academy</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2">
            Log in
          </Link>
          <Link href="/register" className="bg-indigo-600 text-white hover:bg-indigo-700 font-medium px-4 py-2 rounded-lg transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
            Elevate Your Learning with <span className="text-indigo-600">E-Academy</span>
          </h1>
          <p className="text-lg text-gray-600">
            Join thousands of students and teachers on our modern learning management platform. Interactive quizzes, easy-to-manage courses, and instant certifications upon completion.
          </p>
          <div className="flex gap-4">
            <Link href="/register" className="bg-indigo-600 text-white font-medium px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl">
              Start Learning Now
            </Link>
          </div>
        </div>
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
            alt="Students collaborating"
            className="rounded-2xl shadow-2xl object-cover h-[400px] w-full"
          />
        </div>
      </main>

      {/* Features Overview */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Platform Highlights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <span className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-xl mb-6">
                <FaBookOpen className="h-6 w-6 text-indigo-600" />
              </span>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Rich Course Materials</h3>
              <p className="text-gray-600">Access video lectures, interactive resources, and comprehensive study materials from expert instructors.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <span className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-xl mb-6">
                <FaUsers className="h-6 w-6 text-indigo-600" />
              </span>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Community Learning</h3>
              <p className="text-gray-600">Engage with fellow students, collaborate on assignments, and get direct feedback from your teachers.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <img
                src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070&auto=format&fit=crop"
                alt="Workspace"
                className="w-full h-32 object-cover rounded-xl mb-4"
              />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Auto-Graded Quizzes</h3>
              <p className="text-gray-600">Take exams and get your results instantly to track your performance and earn certificates dynamically.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
