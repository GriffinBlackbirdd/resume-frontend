"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import FileUpload from "@/components/ui/file-upload";

const Sidebar = () => {
  const router = useRouter();
  
  const menuItems = [
    { icon: "📊", label: "Dashboard", active: false, href: "/dashboard" },
    { icon: "🎯", label: "ATS Score", active: false, href: "/ats-score" },
    { icon: "📋", label: "Gap Analysis", active: true, href: "/gap-analysis" }
  ];

  return (
    <div className="w-64 h-screen bg-zinc-900 border-r border-zinc-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-black font-bold text-sm">A</span>
          </div>
          <span className="text-white font-semibold">Resume Builder</span>
        </div>
      </div>

      {/* Main Menu */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {menuItems.map((item, index) => (
            <div
              key={index}
              onClick={() => router.push(item.href)}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                item.active ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors">
          <span className="text-lg">⚙️</span>
          <span className="text-sm font-medium">Settings</span>
        </div>
      </div>
    </div>
  );
};

export default function GapAnalysisPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <span className="text-lg">📋</span>
            <span className="text-white font-semibold">Gap Analysis</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6">
          {/* Page Header */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Resume Gap Analysis</h1>
            <p className="text-zinc-400">Identify missing skills and experience gaps in your resume compared to job requirements</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Resume Upload */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-white mb-2">Upload Your Resume</h2>
                <p className="text-sm text-zinc-400 mb-4">Upload your current resume for gap analysis</p>
              </div>
              <FileUpload
                title="Upload Resume"
                description="Drag & drop your resume or click to browse"
                maxFiles={1}
                maxSize={10 * 1024 * 1024} // 10MB
                accept={[".pdf", ".doc", ".docx", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]}
              />
            </div>

            {/* Job Description Upload */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-white mb-2">Target Job Description</h2>
                <p className="text-sm text-zinc-400 mb-4">Upload the job description to analyze against</p>
              </div>
              <FileUpload
                title="Upload Job Description"
                description="Drag & drop job description or click to browse"
                maxFiles={1}
                maxSize={5 * 1024 * 1024} // 5MB
                accept={[".pdf", ".doc", ".docx", ".txt", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"]}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4 pt-6">
            <button className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors">
              Start Gap Analysis
            </button>
            <button 
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white font-medium rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>

          {/* Info Section */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mt-8">
            <h3 className="text-lg font-semibold text-white mb-3">What We Analyze</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-zinc-400">
              <div className="space-y-3">
                <p>• <strong className="text-white">Missing Skills:</strong> Identify technical and soft skills you need to develop</p>
                <p>• <strong className="text-white">Experience Gaps:</strong> Years of experience and specific role requirements</p>
                <p>• <strong className="text-white">Industry Knowledge:</strong> Domain-specific expertise and certifications</p>
              </div>
              <div className="space-y-3">
                <p>• <strong className="text-white">Education Requirements:</strong> Degree and qualification gaps</p>
                <p>• <strong className="text-white">Tool Proficiency:</strong> Software and technology stack differences</p>
                <p>• <strong className="text-white">Improvement Suggestions:</strong> Actionable recommendations to bridge gaps</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}