"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { NewResumeModal } from "@/components/NewResumeModal";
import { useAuth } from "@/contexts/AuthContext";
import { UserAccountAvatar } from "@/components/auth/UserAccountAvatar";
import MarkdownRenderer from "@/components/MarkdownRenderer";

// Types for dashboard data
interface DashboardStats {
  highest_ats_score: number;
  highest_project_id?: string;
  ats_change: string;
  resumes_created: number;
  resumes_change: string;
}

interface ResumeProject {
  id: string;
  user_id: string;
  job_role: string;
  target_company?: string;
  status: string;
  ats_score?: number;
  yaml_content?: string;
  created_at: string;
  updated_at: string;
  has_gap_analysis?: boolean;
  gap_analysis_files?: string[];
}

interface ATSByJobRole {
  job_role: string;
  target_company?: string;
  ats_score: number;
  project_id: string;
}

interface DashboardData {
  stats: DashboardStats;
  recent_projects: ResumeProject[];
  ats_by_job_role: ATSByJobRole[];
  total_projects: number;
  current_page: number;
  total_pages: number;
  projects_per_page: number;
}


const StatCard = ({ title, value, change, trend, description, isNegative = false, actionButton = null }) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:bg-zinc-800/50 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-zinc-400 text-sm font-medium mb-1">{title}</div>
          <div className="text-white text-2xl font-bold">{value}</div>
        </div>
        <div className={cn(
          "flex items-center space-x-1 text-sm font-medium",
          isNegative ? "text-red-400" : "text-green-400"
        )}>
          <span>{isNegative ? "📉" : "📈"}</span>
          <span>{change}</span>
        </div>
      </div>
      <div className="text-zinc-500 text-sm">
        <div className="font-medium mb-1">{trend}</div>
        <div className="flex items-center justify-between">
          <span>{description}</span>
          {actionButton}
        </div>
      </div>
    </div>
  );
};

const ATSChart = ({ data }: { data: ATSByJobRole[] }) => {
  const router = useRouter();

  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 80) return "bg-yellow-500";
    if (score >= 70) return "bg-orange-500";
    return "bg-red-500";
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 80) return "text-yellow-400";
    if (score >= 70) return "text-orange-400";
    return "text-red-400";
  };

  if (data.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-white text-lg font-semibold mb-4">ATS Scores by Job Role</h3>
        <p className="text-zinc-400 text-sm">No ATS scores available yet. Create and calculate scores for your resumes to see the chart.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white text-lg font-semibold">ATS Scores by Role & Company</h3>
          <p className="text-zinc-400 text-sm">Performance comparison across different roles and companies</p>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-4">
            <div className="w-40 text-right">
              <span className="text-white text-sm font-medium truncate block" title={`${item.job_role}${item.target_company ? ` / ${item.target_company}` : ''}`}>
                {item.job_role}{item.target_company ? ` / ${item.target_company}` : ''}
              </span>
            </div>

            <div className="flex-1 relative">
              <div className="w-full bg-zinc-800 rounded-full h-6 relative overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", getScoreColor(item.ats_score))}
                  style={{ width: `${Math.max(item.ats_score, 5)}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-between px-3">
                  <span className="text-white text-xs font-medium">
                    {item.ats_score.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="w-20 flex justify-end">
              <button
                onClick={() => router.push(`/editor?project_id=${item.project_id}`)}
                className="bg-slate-800 no-underline group cursor-pointer relative shadow-2xl shadow-zinc-900 rounded-full p-px text-xs font-semibold leading-6 text-white inline-block"
              >
                <span className="absolute inset-0 overflow-hidden rounded-full">
                  <span className="absolute inset-0 rounded-full bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(56,189,248,0.6)_0%,rgba(56,189,248,0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                </span>
                <div className="relative flex space-x-2 items-center z-10 rounded-full bg-zinc-950 py-0.5 px-4 ring-1 ring-white/10">
                  <span>Edit</span>
                  <svg
                    fill="none"
                    height="16"
                    viewBox="0 0 24 24"
                    width="16"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10.75 8.75L14.25 12L10.75 15.25"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
                <span className="absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-emerald-400/0 via-emerald-400/90 to-emerald-400/0 transition-opacity duration-500 group-hover:opacity-40" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-zinc-800">
        <div className="flex items-center justify-center space-x-6 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-zinc-400">90%+ Excellent</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-zinc-400">80-89% Good</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-zinc-400">70-79% Fair</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-zinc-400">&lt;70% Needs Work</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const GapAnalysisColumn = ({
  onShowContent,
  onRunGapAnalysis,
  projectId,
  hasGapAnalysis,
  isAnalyzing
}: {
  onShowContent: (fileType: string, projectId?: string) => void;
  onRunGapAnalysis: (projectId: string) => void;
  projectId: string;
  hasGapAnalysis?: boolean;
  isAnalyzing?: boolean;
}) => {
  // Debug what props this component receives
  console.log(`🔍 GapAnalysisColumn ${projectId}:`, {
    hasGapAnalysis,
    isAnalyzing,
    typeof_hasGapAnalysis: typeof hasGapAnalysis
  });
  if (isAnalyzing) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-blue-400 text-sm">Analyzing...</span>
      </div>
    );
  }

  if (!hasGapAnalysis) {
    return (
      <button
        onClick={() => onRunGapAnalysis(projectId)}
        className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
      >
        <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
        <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
          Run Review
        </span>
      </button>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onShowContent('gap-analysis', projectId)}
        className="relative inline-flex h-8 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
      >
        <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
        <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-2 py-1 text-xs font-medium text-white backdrop-blur-3xl">
          Gap Analysis
        </span>
      </button>
      <button
        onClick={() => onShowContent('upskill', projectId)}
        className="relative inline-flex h-8 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
      >
        <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
        <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-2 py-1 text-xs font-medium text-white backdrop-blur-3xl">
          Upskill
        </span>
      </button>
      <button
        onClick={() => onShowContent('project-recommendations', projectId)}
        className="relative inline-flex h-8 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
      >
        <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
        <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-2 py-1 text-xs font-medium text-white backdrop-blur-3xl">
          Projects
        </span>
      </button>
    </div>
  );
};

const GapAnalysisButton = ({
  onShowContent,
  onRunGapAnalysis,
  projectId,
  hasGapAnalysis
}: {
  onShowContent: (fileType: string, projectId?: string) => void;
  onRunGapAnalysis: (projectId: string) => void;
  projectId: string;
  hasGapAnalysis?: boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Button */}
      <button className="relative inline-flex h-8 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
        <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#A7F3D0_0%,#059669_50%,#A7F3D0_100%)]" />
        <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-xs font-medium text-white backdrop-blur-3xl">
          Gap Analysis
        </span>
      </button>

      {/* Animated Popup */}
      <div className={cn(
        "absolute top-full left-1/2 transform -translate-x-1/2 mt-2 transition-all duration-300 ease-out z-50",
        isHovered
          ? "opacity-100 visible translate-y-0"
          : "opacity-0 invisible translate-y-2"
      )}>
        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl overflow-hidden min-w-48">
          <div className="py-1">
            {!hasGapAnalysis && (
              <button
                onClick={() => onRunGapAnalysis(projectId)}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-800 transition-colors flex items-center space-x-2"
              >
                <span className="text-yellow-400">🔄</span>
                <span>Run Gap Analysis</span>
              </button>
            )}
            {hasGapAnalysis && (
              <button
                onClick={() => onShowContent('gap-analysis', projectId)}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-800 transition-colors flex items-center space-x-2"
              >
                <span className="text-blue-400">📊</span>
                <span>Gap Analysis</span>
              </button>
            )}
            {hasGapAnalysis && (
              <>
                <button
                  onClick={() => onShowContent('upskill', projectId)}
                  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-800 transition-colors flex items-center space-x-2"
                >
                  <span className="text-green-400">📚</span>
                  <span>Upskill Plan</span>
                </button>
                <button
                  onClick={() => onShowContent('project-recommendations', projectId)}
                  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-800 transition-colors flex items-center space-x-2"
                >
                  <span className="text-purple-400">🎯</span>
                  <span>Project Recommendations</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-zinc-800/30 border-t border-zinc-800">
      <div className="text-zinc-400 text-sm">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded transition-colors"
        >
          Previous
        </button>
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              "px-3 py-1.5 text-sm rounded transition-colors",
              page === currentPage
                ? "bg-blue-600 text-white"
                : "bg-zinc-700 hover:bg-zinc-600 text-white"
            )}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

const DataTable = ({
  projects,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onShowGapAnalysis,
  onRunGapAnalysis,
  analyzingProjects
}: {
  projects: ResumeProject[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onShowGapAnalysis: (fileType: string) => void;
  onRunGapAnalysis: (projectId: string) => void;
  analyzingProjects: Set<string>;
}) => {
  const router = useRouter();

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800">
        <h3 className="text-white text-lg font-semibold">Your Resumes</h3>
        <p className="text-zinc-400 text-sm">Manage and track your resume portfolio</p>
      </div>

      {/* Table Header */}
      <div className="px-6 py-3 bg-zinc-800/50 border-b border-zinc-800">
        <div className="grid grid-cols-5 gap-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">
          <div>Job Role</div>
          <div>Target Company</div>
          <div>ATS Score</div>
          <div>Gap Analysis</div>
          <div>Actions</div>
        </div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-zinc-800">
        {loading ? (
          <div className="px-6 py-8 text-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-zinc-400 text-sm">Loading your resumes...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-zinc-400 text-sm">No resumes created yet. Click "New Resume" to get started!</p>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="px-6 py-4 hover:bg-zinc-800/30 transition-colors">
              <div className="grid grid-cols-5 gap-4 items-center">
                <div className="text-white text-sm font-medium">{project.job_role}</div>
                <div className="text-zinc-400 text-sm">{project.target_company || 'Not specified'}</div>
                <div className="flex items-center space-x-2">
                  {project.ats_score ? (
                    <>
                      <span className={cn(
                        "text-sm font-medium",
                        project.ats_score >= 90 ? "text-green-400" : project.ats_score >= 80 ? "text-yellow-400" : "text-red-400"
                      )}>
                        {project.ats_score}%
                      </span>
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        project.ats_score >= 90 ? "bg-green-400" : project.ats_score >= 80 ? "bg-yellow-400" : "bg-red-400"
                      )}></div>
                    </>
                  ) : (
                    <span className="text-zinc-500 text-sm">Pending</span>
                  )}
                </div>
                <div>
                  <GapAnalysisColumn
                    onShowContent={onShowGapAnalysis}
                    onRunGapAnalysis={onRunGapAnalysis}
                    projectId={project.id}
                    hasGapAnalysis={project.has_gap_analysis}
                    isAnalyzing={analyzingProjects.has(project.id)}
                  />
                </div>
                <div className="flex space-x-2 items-center">
                  <button
                    onClick={() => router.push(`/editor?project_id=${project.id}`)}
                    className="bg-slate-800 no-underline group cursor-pointer relative shadow-2xl shadow-zinc-900 rounded-full p-px text-xs font-semibold leading-6 text-white inline-block"
                  >
                    <span className="absolute inset-0 overflow-hidden rounded-full">
                      <span className="absolute inset-0 rounded-full bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(56,189,248,0.6)_0%,rgba(56,189,248,0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    </span>
                    <div className="relative flex space-x-2 items-center z-10 rounded-full bg-zinc-950 py-0.5 px-4 ring-1 ring-white/10">
                      <span>Go to Resume</span>
                      <svg
                        fill="none"
                        height="16"
                        viewBox="0 0 24 24"
                        width="16"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10.75 8.75L14.25 12L10.75 15.25"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>
                    <span className="absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-emerald-400/0 via-emerald-400/90 to-emerald-400/0 transition-opacity duration-500 group-hover:opacity-40" />
                  </button>

                  <button
                    onClick={() => downloadJobDescription(project.id)}
                    className="bg-green-800 hover:bg-green-700 group cursor-pointer relative shadow-2xl shadow-zinc-900 rounded-full p-px text-xs font-semibold leading-6 text-white inline-block transition-colors"
                    title="Download Job Description"
                  >
                    <span className="absolute inset-0 overflow-hidden rounded-full">
                      <span className="absolute inset-0 rounded-full bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(34,197,94,0.6)_0%,rgba(34,197,94,0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    </span>
                    <div className="relative flex space-x-2 items-center z-10 rounded-full bg-zinc-950 py-0.5 px-4 ring-1 ring-white/10">
                      <span>Download JD</span>
                      <svg
                        fill="none"
                        height="16"
                        viewBox="0 0 24 24"
                        width="16"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 3V16M12 16L16 12M12 16L8 12M21 21H3"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>
                    <span className="absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-green-400/0 via-green-400/90 to-green-400/0 transition-opacity duration-500 group-hover:opacity-40" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated, token } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 5;

  // Track projects being analyzed
  const [analyzingProjects, setAnalyzingProjects] = useState<Set<string>>(new Set());

  // Gap Analysis modal state
  const [markdownModal, setMarkdownModal] = useState<{
    isOpen: boolean;
    title: string;
    content: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    title: "",
    content: "",
    isLoading: false,
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Download job description for a project
  const downloadJobDescription = async (projectId: string) => {
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/download-job-description/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'job_description.txt';

        if (contentDisposition) {
          const matches = contentDisposition.match(/filename="([^"]*)"/) || contentDisposition.match(/filename=([^;]*)/);
          if (matches) {
            filename = matches[1];
          }
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Download failed:', response.status);
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  // Gap Analysis functions
  const showGapAnalysisContent = async (fileType: string, projectId?: string) => {
    try {
      // Set loading state
      setMarkdownModal(prev => ({
        ...prev,
        isOpen: true,
        isLoading: true,
        title: "Loading...",
        content: "",
      }));

      console.log('🔍 Dashboard: Fetching gap analysis content:', fileType, 'for project:', projectId);
      const url = projectId
        ? `http://localhost:8000/get-gap-analysis-content/${fileType}?project_id=${projectId}`
        : `http://localhost:8000/get-gap-analysis-content/${fileType}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Dashboard: Gap analysis content received:', data.title);

        setMarkdownModal({
          isOpen: true,
          isLoading: false,
          title: data.title,
          content: data.content,
        });
      } else {
        console.error('❌ Dashboard: Failed to fetch gap analysis content:', response.statusText);
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));

        setMarkdownModal({
          isOpen: true,
          isLoading: false,
          title: "Error",
          content: `**Error loading content:** ${errorData.detail || response.statusText}`,
        });
      }
    } catch (error) {
      console.error('Error fetching gap analysis content:', error);
      setMarkdownModal({
        isOpen: true,
        isLoading: false,
        title: "Error",
        content: `**Network Error:** ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
      });
    }
  };

  const closeMarkdownModal = () => {
    setMarkdownModal({
      isOpen: false,
      title: "",
      content: "",
      isLoading: false,
    });
  };

  // Run gap analysis for cloud projects
  const runGapAnalysis = async (projectId: string) => {
    if (!token) {
      console.log('No token available for gap analysis');
      return;
    }

    try {
      console.log('🔍 Dashboard: Starting gap analysis for project:', projectId);

      // Add project to analyzing set
      setAnalyzingProjects(prev => new Set(prev).add(projectId));

      const formData = new FormData();
      formData.append('project_id', projectId);

      const response = await fetch('http://localhost:8000/run-gap-analysis-cloud', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Dashboard: Gap analysis completed successfully');

        // Refresh dashboard data to show updated project status
        console.log('🔍 Dashboard: Refreshing dashboard data after gap analysis...');
        await fetchDashboardData();
        console.log('✅ Dashboard: Dashboard data refreshed');

        // Remove project from analyzing set
        setAnalyzingProjects(prev => {
          const newSet = new Set(prev);
          newSet.delete(projectId);
          return newSet;
        });
      } else {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        console.error('❌ Dashboard: Failed to run gap analysis:', errorData.detail);

        // Remove project from analyzing set
        setAnalyzingProjects(prev => {
          const newSet = new Set(prev);
          newSet.delete(projectId);
          return newSet;
        });

        // Show error in console, optionally you could show a toast notification
        console.error('Gap analysis failed:', errorData.detail);
      }
    } catch (error) {
      console.error('Error running gap analysis:', error);

      // Remove project from analyzing set
      setAnalyzingProjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });
    }
  };

  // Fetch dashboard data from API
  const fetchDashboardData = async (page: number = currentPage) => {
    if (!token) {
      console.log('No token available, skipping dashboard data fetch');
      return;
    }

    setDashboardLoading(true);
    setDashboardError(null);

    try {
      console.log('🔍 Dashboard: Fetching dashboard data...');
      const url = `http://localhost:8000/dashboard?page=${page}&projects_per_page=${projectsPerPage}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Dashboard: Data fetched successfully:', data);
        console.log('✅ Dashboard: Raw recent_projects:', data.recent_projects);

        // DEEP DEBUG: Check the exact structure of the first project
        if (data.recent_projects && data.recent_projects.length > 0) {
          const firstProject = data.recent_projects[0];
          console.log('🔍 DEEP DEBUG: First project raw JSON:', JSON.stringify(firstProject, null, 2));
          console.log('🔍 DEEP DEBUG: Object.keys(firstProject):', Object.keys(firstProject));
          console.log('🔍 DEEP DEBUG: firstProject.has_gap_analysis:', firstProject.has_gap_analysis);
          console.log('🔍 DEEP DEBUG: typeof firstProject.has_gap_analysis:', typeof firstProject.has_gap_analysis);
          console.log('🔍 DEEP DEBUG: firstProject["has_gap_analysis"]:', firstProject["has_gap_analysis"]);
        }

        // Debug gap analysis status for projects
        if (data.recent_projects) {
          data.recent_projects.forEach((project: any) => {
            console.log(`📋 Project ${project.id}:`, {
              id: project.id,
              job_role: project.job_role,
              has_gap_analysis: project.has_gap_analysis,
              gap_analysis_files: project.gap_analysis_files,
              type_has_gap_analysis: typeof project.has_gap_analysis
            });
          });
        }

        setDashboardData(data);
      } else {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        setDashboardError(errorData.detail || 'Failed to fetch dashboard data');
        console.error('❌ Dashboard: Failed to fetch data:', errorData);
      }
    } catch (error) {
      console.error('❌ Dashboard: Network error:', error);
      setDashboardError('Network error while fetching dashboard data');
    } finally {
      setDashboardLoading(false);
    }
  };

  // Fetch dashboard data when component mounts and user is authenticated
  useEffect(() => {
    if (!loading && isAuthenticated && token) {
      fetchDashboardData();
    }
  }, [loading, isAuthenticated, token, currentPage]);

  // Redirect to landing page if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/');
    }
  }, [loading, isAuthenticated, router]);

  if (loading || dashboardLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Show error state if dashboard data failed to load
  if (dashboardError) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <div className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6">
          <div className="flex items-center space-x-6">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-sm">A</span>
              </div>
              <span className="text-white font-semibold">Resume Builder</span>
            </div>
            
            {/* Welcome message */}
            <span className="text-white text-lg">
              Welcome, {user?.full_name || user?.email?.split('@')[0]}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <NewResumeModal />
            <UserAccountAvatar />
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-400 text-lg mb-2">Failed to load dashboard</div>
            <p className="text-zinc-400 mb-4">{dashboardError}</p>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats;
  const projects = dashboardData?.recent_projects || [];
  const atsByJobRole = dashboardData?.ats_by_job_role || [];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6">
        <div className="flex items-center space-x-6">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-sm">A</span>
            </div>
            <span className="text-white font-semibold">Resume Builder</span>
          </div>
          
          {/* Welcome message */}
          <span className="text-white text-lg">
            Welcome, {user?.full_name || user?.email?.split('@')[0]}
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <NewResumeModal />
          <UserAccountAvatar />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">

        {/* Content */}
        <div className="flex-1 p-6 space-y-6">
          {/* KPIs */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatCard
                title="Highest ATS Score Achieved"
                value={stats.highest_ats_score.toString()}
                change={stats.ats_change}
                trend="From latest resume"
                description="Track your best performance"
                actionButton={stats.highest_project_id && (
                  <button
                    onClick={() => router.push(`/editor?project_id=${stats.highest_project_id}`)}
                    className="bg-slate-800 no-underline group cursor-pointer relative shadow-2xl shadow-zinc-900 rounded-full p-px text-xs font-semibold leading-6 text-white inline-block"
                  >
                    <span className="absolute inset-0 overflow-hidden rounded-full">
                      <span className="absolute inset-0 rounded-full bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(56,189,248,0.6)_0%,rgba(56,189,248,0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    </span>
                    <div className="relative flex space-x-2 items-center z-10 rounded-full bg-zinc-950 py-0.5 px-4 ring-1 ring-white/10">
                      <span>Open Resume</span>
                      <svg
                        fill="none"
                        height="16"
                        viewBox="0 0 24 24"
                        width="16"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10.75 8.75L14.25 12L10.75 15.25"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>
                    <span className="absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-emerald-400/0 via-emerald-400/90 to-emerald-400/0 transition-opacity duration-500 group-hover:opacity-40" />
                  </button>
                )}
              />
              <StatCard
                title="Resumes Created"
                value={stats.resumes_created.toString()}
                change={stats.resumes_change}
                trend="Total resumes built"
                description="Keep building your portfolio"
              />
            </div>
          )}

          {/* ATS Scores Chart */}
          <ATSChart data={atsByJobRole} />

          {/* Resumes Table */}
          <DataTable
            projects={projects}
            loading={false}
            currentPage={dashboardData?.current_page || 1}
            totalPages={dashboardData?.total_pages || 1}
            onPageChange={handlePageChange}
            onShowGapAnalysis={showGapAnalysisContent}
            onRunGapAnalysis={runGapAnalysis}
            analyzingProjects={analyzingProjects}
          />
        </div>
      </div>

      {/* Markdown Renderer Modal */}
      <MarkdownRenderer
        isOpen={markdownModal.isOpen}
        onClose={closeMarkdownModal}
        title={markdownModal.title}
        content={markdownModal.content}
        isLoading={markdownModal.isLoading}
      />
    </div>
  );
}