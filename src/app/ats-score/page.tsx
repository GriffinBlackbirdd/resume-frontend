"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import FileUpload from "@/components/ui/file-upload";
import ATSAnalysisModal from "@/components/ATSAnalysisModal";
import { Target, TrendingUp, FileText, Briefcase, Clock, Award } from "lucide-react";
import { BrandButton } from "@/components/ui/brand-button";
import { CinematicButton } from "@/components/ui/cinematic-button";
import { TextButton } from "@/components/ui/text-button";

const Sidebar = () => {
  const router = useRouter();
  
  const menuItems = [
    { icon: "📊", label: "Dashboard", active: false, href: "/dashboard" },
    { icon: "🎯", label: "ATS Score", active: true, href: "/ats-score" },
    { icon: "📋", label: "Gap Analysis", active: false, href: "/gap-analysis" }
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
            <BrandButton
              key={index}
              onClick={() => router.push(item.href)}
              variant={item.active ? "primary" : "ghost"}
              className={cn(
                "flex items-center justify-start space-x-3 px-3 py-2",
                item.active
                  ? "bg-sunglow text-mine-shaft"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </BrandButton>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="p-4 border-t border-zinc-800">
        <BrandButton
          variant="ghost"
          className="flex items-center justify-start space-x-3 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50"
        >
          <span className="text-lg">⚙️</span>
          <span className="text-sm font-medium">Settings</span>
        </BrandButton>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, title, value, color = "blue" }: { icon: any, title: string, value: string | number, color?: string }) => {
  const colorMap: Record<string, string> = {
    blue: "text-blue-400",
    emerald: "text-emerald-400",
    purple: "text-purple-400"
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:bg-zinc-800/50 transition-colors">
      <div className="flex items-center justify-center space-x-2 mb-2">
        <Icon className={cn("w-5 h-5", colorMap[color])} />
        <span className="text-sm text-zinc-400">{title}</span>
      </div>
      <div className="text-2xl font-bold text-white text-center">{value}</div>
    </div>
  );
};


export default function ATSScorePage() {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescriptionFile, setJobDescriptionFile] = useState<File | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleAnalyze = () => {
    if (resumeFile && jobDescriptionFile) {
      setShowModal(true);
    } else {
      // Show error or prompt user to upload both files
      alert('Please upload both your resume and job description files first.');
    }
  };

  const handleResumeUpload = (files: any[]) => {
    if (files.length > 0 && files[0].file instanceof File) {
      setResumeFile(files[0].file);
    }
  };

  const handleJobDescriptionUpload = (files: any[]) => {
    if (files.length > 0 && files[0].file instanceof File) {
      setJobDescriptionFile(files[0].file);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <span className="text-lg">🎯</span>
            <span className="text-white font-semibold">ATS Score</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6">
          {/* Page Header */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">ATS Score Analysis</h1>
            <p className="text-zinc-400">Upload your resume and job description to analyze ATS compatibility</p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              icon={Clock}
              title="Analysis Time"
              value="~30s"
              color="blue"
            />
            <StatCard
              icon={TrendingUp}
              title="Accuracy Rate"
              value="94%"
              color="emerald"
            />
          </div>

          {/* Upload Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resume Upload */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Your Resume</h2>
                  <p className="text-sm text-zinc-400">Upload for instant analysis</p>
                </div>
              </div>
              <FileUpload
                title="Drop your resume here"
                description="PDF, DOC, DOCX • Max 10MB"
                maxFiles={1}
                maxSize={10 * 1024 * 1024}
                accept={[".pdf", ".doc", ".docx"]}
                onFilesChange={handleResumeUpload}
              />
            </div>

            {/* Job Description Upload */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Briefcase className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Job Description</h2>
                  <p className="text-sm text-zinc-400">Target position details</p>
                </div>
              </div>
              <FileUpload
                title="Upload job posting"
                description="PDF, DOC, DOCX, TXT • Max 5MB"
                maxFiles={1}
                maxSize={5 * 1024 * 1024}
                accept={[".pdf", ".doc", ".docx", ".txt"]}
                onFilesChange={handleJobDescriptionUpload}
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <CinematicButton
              onClick={handleAnalyze}
              variant="sunglow"
              disabled={!resumeFile || !jobDescriptionFile}
              className={cn(
                "px-8 py-3 font-medium flex items-center space-x-3",
                !resumeFile || !jobDescriptionFile ? "opacity-50 cursor-not-allowed" : ""
              )}
            >
              <Target className="w-5 h-5" />
              <span>
                {resumeFile && jobDescriptionFile
                  ? "Analyze My Resume"
                  : "Upload both files to analyze"
                }
              </span>
            </CinematicButton>
          </div>


        </div>
      </div>

      {/* Analysis Modal */}
      <ATSAnalysisModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        resumeFile={resumeFile}
        jobDescriptionFile={jobDescriptionFile}
      />
    </div>
  );
}