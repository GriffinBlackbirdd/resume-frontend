"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { NewResumeModal } from "@/components/NewResumeModal";
import { useAuth } from "@/contexts/AuthContext";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { ActionButton } from "@/components/ui/action-button";
import { CompareDemo } from "@/components/ui/compare-demo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";

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


const StatCard = ({ title, value, change, trend, description, isNegative = false, actionButton = null, isHighestAts = false }: any) => {
  return (
    <div className="bg-vista-white dark:bg-onyx-gray border-0 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 shadow-sm relative overflow-hidden">

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className={cn(
              "text-sm font-medium mb-2 font-sf uppercase tracking-wider",
              isHighestAts ? "text-brand-gradient" : "text-mine-shaft/70 dark:text-platinum-gray/70"
            )}>{title}</div>
            <div className={cn(
              "text-4xl font-bebas tracking-tight",
              isHighestAts ? "text-brand-gradient bg-[length:200%_200%] animate-gradient-flow" : "text-mine-shaft dark:text-platinum-gray"
            )}>{value}</div>
          </div>
          <div className={cn(
            "flex items-center space-x-2 text-sm font-sf font-semibold px-3 py-1 rounded-full",
            isNegative
              ? "text-db3b09 bg-red-50 dark:bg-red-900/20 dark:text-red-400"
              : "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400"
          )}>
            <span className="text-base">{isNegative ? "📉" : "📈"}</span>
            <span>{change}</span>
          </div>
        </div>
        <div className="text-mine-shaft/60 dark:text-platinum-gray/60 text-sm font-editorial">
          <div className="font-sf font-medium mb-2 text-mine-shaft/80 dark:text-platinum-gray/80">{trend}</div>
          <div className="flex items-center justify-between">
            <span>{description}</span>
            {actionButton}
          </div>
        </div>
      </div>
    </div>
  );
};

const ATSChart = ({ data }: { data: ATSByJobRole[] }) => {
  const router = useRouter();

  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-emerald-500";
    if (score >= 80) return "bg-sunglow";
    if (score >= 70) return "bg-orange-500";
    return "bg-red-500";
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 90) return "text-emerald-500";
    if (score >= 80) return "text-sunglow";
    if (score >= 70) return "text-orange-500";
    return "text-red-500";
  };

  if (data.length === 0) {
    return (
      <div className="bg-vista-white dark:bg-onyx-gray border-0 rounded-t-none rounded-b-2xl p-8 shadow-lg relative overflow-hidden">
        {/* Gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-brand-gradient rounded-none"></div>

        {/* Empty State */}
        <div className="text-center py-12">
          <h3 className="text-mine-shaft dark:text-platinum-gray text-2xl font-bebas tracking-tight mb-4">ATS Scores by Job Role</h3>
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5 text-sunglow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-mine-shaft/60 dark:text-platinum-gray/60 text-sm font-editorial">No ATS scores available yet. Click "New Resume" to get started!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-vista-white dark:bg-onyx-gray border-0 rounded-t-none rounded-b-2xl p-8 shadow-lg relative overflow-hidden">
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-brand-gradient rounded-none"></div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-mine-shaft dark:text-platinum-gray text-2xl font-bebas tracking-tight mb-2">ATS Scores by Role & Company</h3>
          <p className="text-mine-shaft/60 dark:text-platinum-gray/60 text-sm font-editorial">Performance comparison across different roles and companies</p>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-4">
            <div className="w-44 text-right">
              <span className="text-mine-shaft dark:text-platinum-gray text-sm font-sf font-medium truncate block" title={item.job_role + (item.target_company ? ' / ' + item.target_company : '')}>
                {item.job_role}{item.target_company ? ' / ' + item.target_company : ''}
              </span>
            </div>

            <div className="flex-1 relative">
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-7 relative overflow-hidden shadow-inner">
                <div
                  className={cn("h-full rounded-full transition-all duration-700 ease-out", getScoreColor(item.ats_score))}
                  style={{ width: Math.max(item.ats_score, 5) + '%' }}
                />
                <div className="absolute inset-0 flex items-center justify-between px-4">
                  <span className="text-mine-shaft dark:text-platinum-gray text-xs font-sf font-semibold">
                    {item.ats_score.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="w-20 flex justify-end">
              <ActionButton
                size="sm"
                variant="primary"
                onClick={() => router.push('/editor?project_id=' + item.project_id)}
                icon={
                  <svg
                    fill="none"
                    height="14"
                    viewBox="0 0 24 24"
                    width="14"
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
                }
              >
                Edit
              </ActionButton>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-center space-x-8 text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-sm"></div>
            <span className="text-mine-shaft/70 dark:text-platinum-gray/70 font-sf font-medium">90%+ Excellent</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-sunglow rounded-full shadow-sm"></div>
            <span className="text-mine-shaft/70 dark:text-platinum-gray/70 font-sf font-medium">80-89% Good</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-orange-500 rounded-full shadow-sm"></div>
            <span className="text-mine-shaft/70 dark:text-platinum-gray/70 font-sf font-medium">70-79% Fair</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-red-500 rounded-full shadow-sm"></div>
            <span className="text-mine-shaft/70 dark:text-platinum-gray/70 font-sf font-medium">&lt;70% Needs Work</span>
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
  console.log('GapAnalysisColumn ' + projectId + ':', {
    hasGapAnalysis,
    isAnalyzing,
    typeof_hasGapAnalysis: typeof hasGapAnalysis
  });
  if (isAnalyzing) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 border-2 border-sunglow border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sunglow text-sm">Analyzing...</span>
      </div>
    );
  }

  if (!hasGapAnalysis) {
    return (
      <ActionButton
        size="md"
        variant="primary"
        onClick={() => onRunGapAnalysis(projectId)}
      >
        Run Review
      </ActionButton>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <ActionButton
        size="sm"
        variant="outline"
        onClick={() => onShowContent('gap-analysis', projectId)}
      >
        Gap Analysis
      </ActionButton>
      <ActionButton
        size="sm"
        variant="outline"
        onClick={() => onShowContent('upskill', projectId)}
      >
        Upskill
      </ActionButton>
      <ActionButton
        size="sm"
        variant="outline"
        onClick={() => onShowContent('project-recommendations', projectId)}
      >
        Projects
      </ActionButton>
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
      <ActionButton
        size="sm"
        variant="outline"
      >
        Gap Analysis
      </ActionButton>

      {/* Animated Popup */}
      <div className={cn(
        "absolute top-full left-1/2 transform -translate-x-1/2 mt-2 transition-all duration-300 ease-out z-50",
        isHovered
          ? "opacity-100 visible translate-y-0"
          : "opacity-0 invisible translate-y-2"
      )}>
        <div className="bg-white dark:bg-onyx-gray border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl overflow-hidden min-w-48">
          <div className="py-1">
            {!hasGapAnalysis && (
              <button
                onClick={() => onRunGapAnalysis(projectId)}
                className="w-full text-left px-4 py-2 text-sm text-mine-shaft dark:text-platinum-gray hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center space-x-2"
              >
                <span className="text-yellow-500">🔄</span>
                <span>Run Gap Analysis</span>
              </button>
            )}
            {hasGapAnalysis && (
              <button
                onClick={() => onShowContent('gap-analysis', projectId)}
                className="w-full text-left px-4 py-2 text-sm text-mine-shaft dark:text-platinum-gray hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center space-x-2"
              >
                <span className="text-sunglow">📊</span>
                <span>Gap Analysis</span>
              </button>
            )}
            {hasGapAnalysis && (
              <>
                <button
                  onClick={() => onShowContent('upskill', projectId)}
                  className="w-full text-left px-4 py-2 text-sm text-mine-shaft dark:text-platinum-gray hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center space-x-2"
                >
                  <span className="text-sunglow">📚</span>
                  <span>Upskill Plan</span>
                </button>
                <button
                  onClick={() => onShowContent('project-recommendations', projectId)}
                  className="w-full text-left px-4 py-2 text-sm text-mine-shaft dark:text-platinum-gray hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center space-x-2"
                >
                  <span className="text-sunglow">🎯</span>
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
    <div className="flex items-center justify-between px-8 py-6 bg-gray-50/30 border-t border-gray-100">
      <div className="text-mine-shaft/60 text-sm font-sf">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 text-sm bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 text-mine-shaft rounded-lg transition-all duration-200 border border-gray-200 font-sf"
        >
          Previous
        </button>
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              "px-4 py-2 text-sm rounded-lg transition-all duration-200 font-sf font-medium",
              page === currentPage
                ? "bg-sunglow text-mine-shaft shadow-sm"
                : "bg-white hover:bg-gray-50 text-mine-shaft border border-gray-200"
            )}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 text-sm bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 text-mine-shaft rounded-lg transition-all duration-200 border border-gray-200 font-sf"
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
  onDownloadJobDescription,
  onDeleteResume,
  analyzingProjects,
  deletingProjects
}: {
  projects: ResumeProject[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onShowGapAnalysis: (fileType: string) => void;
  onRunGapAnalysis: (projectId: string) => void;
  onDownloadJobDescription: (projectId: string) => void;
  onDeleteResume: (projectId: string) => void;
  analyzingProjects: Set<string>;
  deletingProjects: Set<string>;
}) => {
  const router = useRouter();

  return (
    <div className="bg-vista-white dark:bg-onyx-gray border-0 rounded-t-none rounded-b-2xl overflow-hidden shadow-lg relative">
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-brand-gradient rounded-none"></div>

      {/* Header */}
      <div className="px-8 py-6 border-b-0">
        <h3 className="text-mine-shaft dark:text-platinum-gray text-2xl font-bebas tracking-tight mb-2">Your Resumes</h3>
        <p className="text-mine-shaft/60 dark:text-platinum-gray/60 text-sm font-editorial">Manage and track your resume portfolio</p>
      </div>

      {/* Table Header */}
      <div className="px-8 py-4 bg-gray-50/50 dark:bg-gray-800/50 border-b-0">
        <div className="grid grid-cols-5 gap-4 text-xs font-sf font-semibold text-mine-shaft/70 dark:text-platinum-gray/70 uppercase tracking-wider">
          <div>Job Role</div>
          <div>Target Company</div>
          <div>ATS Score</div>
          <div>Gap Analysis</div>
          <div>Actions</div>
        </div>
      </div>

      {/* Table Rows */}
      <div className="divide-y-0">
        {loading ? (
          <div className="px-8 py-12 text-center">
            <div className="w-8 h-8 border-2 border-sunglow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-mine-shaft/60 dark:text-platinum-gray/60 text-sm font-editorial">Loading your resumes...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="px-8 py-12 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-sunglow/20 to-sunglow/10 dark:from-sunglow/30 dark:to-sunglow/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-sunglow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-mine-shaft/60 dark:text-platinum-gray/60 text-sm font-editorial">No resumes created yet. Click "New Resume" to get started!</p>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="px-8 py-6 hover:bg-gray-50/30 dark:hover:bg-gray-800/30 transition-all duration-200 border-l-4 border-transparent hover:border-sunglow/30">
              <div className="grid grid-cols-5 gap-4 items-center">
                <div className="text-mine-shaft dark:text-platinum-gray text-sm font-sf font-medium">{project.job_role}</div>
                <div className="text-mine-shaft/60 dark:text-platinum-gray/60 text-sm font-editorial">{project.target_company || 'Not specified'}</div>
                <div className="flex items-center space-x-3">
                  {project.ats_score ? (
                    <>
                      <span className={cn(
                        "text-sm font-sf font-semibold",
                        project.ats_score >= 90 ? "text-emerald-500" : project.ats_score >= 80 ? "text-sunglow" : project.ats_score >= 70 ? "text-orange-500" : "text-red-500"
                      )}>
                        {project.ats_score}%
                      </span>
                      <div className={cn(
                        "w-3 h-3 rounded-full shadow-sm",
                        project.ats_score >= 90 ? "bg-emerald-500" : project.ats_score >= 80 ? "bg-sunglow" : project.ats_score >= 70 ? "bg-orange-500" : "bg-red-500"
                      )}></div>
                    </>
                  ) : (
                    <span className="text-mine-shaft/40 dark:text-platinum-gray/40 text-sm font-sf">Pending</span>
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
                  <ActionButton
                    size="sm"
                    variant="primary"
                    onClick={() => router.push('/editor?project_id=' + project.id)}
                    icon={
                      <svg
                        fill="none"
                        height="14"
                        viewBox="0 0 24 24"
                        width="14"
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
                    }
                  >
                    Open Resume
                  </ActionButton>

                  <ActionButton
                    size="sm"
                    variant="secondary"
                    onClick={() => onDownloadJobDescription(project.id)}
                    title="Download Job Description"
                    icon={
                      <svg
                        fill="none"
                        height="14"
                        viewBox="0 0 24 24"
                        width="14"
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
                    }
                  >
                    Download JD
                  </ActionButton>

                  <button
                    onClick={() => onDeleteResume(project.id)}
                    disabled={deletingProjects.has(project.id)}
                    title="Delete Resume"
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingProjects.has(project.id) ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg
                        fill="none"
                        height="16"
                        viewBox="0 0 24 24"
                        width="16"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3 6h18m-2 0v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                        />
                      </svg>
                    )}
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

  // Track projects being deleted
  const [deletingProjects, setDeletingProjects] = useState<Set<string>>(new Set());

  // Delete confirmation modal state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    projectId: string | null;
    projectName: string;
  }>({
    isOpen: false,
    projectId: null,
    projectName: '',
  });

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

  // Download job description for a project
  const downloadJobDescription = async (projectId: string) => {
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    try {
      const downloadUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/download-job-description/' + projectId;
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': 'Bearer ' + token,
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const url = projectId
        ? baseUrl + '/get-gap-analysis-content/' + fileType + '?project_id=' + projectId
        : baseUrl + '/get-gap-analysis-content/' + fileType;
      const response = await fetch(url, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token'),
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
          content: '**Error loading content:** ' + (errorData.detail || response.statusText),
        });
      }
    } catch (error) {
      console.error('Error fetching gap analysis content:', error);
      setMarkdownModal({
        isOpen: true,
        isLoading: false,
        title: "Error",
        content: '**Network Error:** ' + (error instanceof Error ? error.message : 'Unknown error occurred'),
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

  // Show delete confirmation modal
  const showDeleteConfirmation = (projectId: string) => {
    const project = dashboardData?.recent_projects.find(p => p.id === projectId);
    const projectName = project ? `${project.job_role}${project.target_company ? ` at ${project.target_company}` : ''}` : 'this resume';

    setDeleteConfirmation({
      isOpen: true,
      projectId,
      projectName,
    });
  };

  // Close delete confirmation modal
  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      projectId: null,
      projectName: '',
    });
  };

  // Delete resume function
  const deleteResume = async () => {
    const projectId = deleteConfirmation.projectId;

    if (!token || !projectId) {
      console.error('No authentication token or project ID found');
      return;
    }

    try {
      // Add project to deleting set
      setDeletingProjects(prev => new Set(prev).add(projectId));

      console.log('🔍 Dashboard: Starting deletion of project:', projectId);

      const deleteUrl = '/api/delete-resume';
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ project_id: projectId }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Dashboard: Resume deleted successfully:', data);

        // Refresh dashboard data to remove the deleted project
        await fetchDashboardData();

        // Show success message (optional)
        console.log('✅ Dashboard: Project deleted and dashboard refreshed');

        // Close the confirmation modal
        closeDeleteConfirmation();

      } else {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        console.error('❌ Dashboard: Failed to delete resume:', errorData.error);

        // Show error message to user (could be enhanced with a toast notification)
        alert('Failed to delete resume: ' + (errorData.error || 'Unknown error'));
      }

    } catch (error) {
      console.error('Error deleting resume:', error);
      alert('Error deleting resume: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      // Remove project from deleting set
      setDeletingProjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });
    }
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

      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/run-gap-analysis-cloud';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
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
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const url = baseUrl + '/dashboard?page=' + page + '&projects_per_page=' + projectsPerPage;
      const response = await fetch(url, {
        headers: {
          'Authorization': 'Bearer ' + token,
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
            console.log('Project ' + project.id + ':', {
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
      <div className="min-h-screen bg-vista-white texture-paper text-mine-shaft flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-sunglow/30 border-t-sunglow rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-mine-shaft/60 font-editorial text-lg">Loading dashboard...</p>
          <p className="text-mine-shaft/40 font-sf text-sm mt-2">Preparing your resume insights</p>
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
      <div className="min-h-screen bg-vista-white texture-paper text-mine-shaft">
        {/* Header */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center space-x-6">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-sunglow rounded-full flex items-center justify-center">
                <span className="text-mine-shaft font-bold text-sm brand-heading">A</span>
              </div>
              <span className="text-mine-shaft font-semibold brand-heading">Resume Builder</span>
            </div>

            {/* Welcome message */}
            <span className="text-mine-shaft text-lg brand-body">
              Welcome, {user?.full_name || user?.email?.split('@')[0]}
            </span>
          </div>

          <NewResumeModal />
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-db3b09/20 to-db3b09/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-db3b09 text-2xl">⚠️</span>
            </div>
            <div className="text-mine-shaft text-2xl font-bebas tracking-tight mb-3">Failed to load dashboard</div>
            <p className="text-mine-shaft/60 mb-6 font-editorial">{dashboardError}</p>
            <button
              onClick={() => fetchDashboardData()}
              className="px-6 py-3 bg-sunglow hover:bg-sunglow/90 text-mine-shaft rounded-xl transition-all duration-200 font-sf font-medium shadow-sm hover:shadow-md"
            >
              Try Again
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
    <div className="min-h-screen bg-vista-white dark:bg-charcoal-black dark:texture-grid-dark text-mine-shaft dark:text-platinum-gray">
      {/* Header */}
      <div className="h-20 bg-vista-white/95 dark:bg-charcoal-black/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-8 sticky top-0 z-40">
        <div className="flex items-center space-x-8">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm">
              <img
                src="/logo.jpeg"
                alt="Resume Builder Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-mine-shaft dark:text-platinum-gray font-bebas text-xl tracking-tight">Resume Builder</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <NewResumeModal />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-vista-white dark:bg-charcoal-black">

        {/* Content */}
        <div className="flex-1 p-8 space-y-8 bg-vista-white dark:bg-charcoal-black">
          {/* Welcome Message */}
          <div className="hidden md:block mb-4">
            <span className="text-mine-shaft/60 dark:text-platinum-gray/60 text-lg font-sf">Welcome back,</span>
            <span className="text-mine-shaft dark:text-platinum-gray text-2xl font-sf font-medium ml-2">
              {user?.full_name || user?.email?.split('@')[0]}
            </span>
          </div>

          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-mine-shaft dark:text-platinum-gray text-4xl font-bebas tracking-tight mb-2">Dashboard</h1>
            <p className="text-mine-shaft/60 dark:text-platinum-gray/60 text-lg font-editorial">Track your resume performance and progress</p>
          </div>

          {/* KPIs */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <StatCard
                title="Highest ATS Score Achieved"
                value={stats.highest_ats_score.toString()}
                change={stats.ats_change}
                trend="From latest resume"
                description="Track your best performance"
                isHighestAts={true}
                actionButton={stats.highest_project_id && (
                  <ActionButton
                    size="sm"
                    variant="primary"
                    onClick={() => router.push('/editor?project_id=' + stats.highest_project_id)}
                    icon={
                      <svg
                        fill="none"
                        height="14"
                        viewBox="0 0 24 24"
                        width="14"
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
                    }
                  >
                    Open Resume
                  </ActionButton>
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
            onDownloadJobDescription={downloadJobDescription}
            onDeleteResume={showDeleteConfirmation}
            analyzingProjects={analyzingProjects}
            deletingProjects={deletingProjects}
          />

          {/* ATS Optimization Comparison - Hidden for now */}
          {/*
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mt-16 p-8 bg-vista-white rounded-3xl border border-mine-shaft/10">
            Left side - Compare component
            <div className="flex justify-center">
              <CompareDemo userId={user?.id} />
            </div>

            Right side - Text content
            <div className="text-center lg:text-left space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-sunglow/20 rounded-full mb-6">
                <svg className="w-12 h-12 text-sunglow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-4xl md:text-5xl font-bebas tracking-tight text-mine-shaft">
                ATS Optimized
              </h2>
              <p className="text-lg text-mine-shaft/70 font-editorial leading-relaxed">
                Our advanced ATS optimization ensures your resume passes through automated screening systems with maximum score. Compare the difference between a standard resume and an ATS-optimized version.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-mine-shaft/80 font-sf">Keyword Optimization</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-mine-shaft/80 font-sf">Format Compliance</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-mine-shaft/80 font-sf">Section Prioritization</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-mine-shaft/80 font-sf">Industry Standards</span>
                </div>
              </div>
            </div>
          </div>
          */}
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={closeDeleteConfirmation}
        onConfirm={deleteResume}
        title="Delete Resume"
        message={`Are you sure you want to delete "${deleteConfirmation.projectName}"? This action cannot be undone and will remove all associated files including the resume, job description, and any gap analysis reports.`}
        confirmText="Delete Resume"
        cancelText="Cancel"
        isLoading={deleteConfirmation.projectId ? deletingProjects.has(deleteConfirmation.projectId) : false}
        variant="danger"
      />
    </div>
  );
}