"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { BrandButton } from './ui/brand-button';
import { CinematicButton } from './ui/cinematic-button';
import { TextButton } from './ui/text-button';

interface GapAnalysisResultsProps {
  analysis: string;
  userData: {
    email: string;
    phone: string;
    linkedin: string;
    github: string;
    jobRole: string;
  };
  onClose: () => void;
  onBackToDashboard: () => void;
}

const GapAnalysisResults: React.FC<GapAnalysisResultsProps> = ({
  analysis,
  userData,
  onClose,
  onBackToDashboard
}) => {
  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-4 z-10 bg-zinc-900/90 backdrop-blur-sm rounded-xl p-4 border border-zinc-800 mb-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  Gap Analysis Results
                </h1>
                <p className="text-zinc-400 text-sm">
                  Personalized career roadmap for {userData.jobRole}
                </p>
              </div>
              <div className="flex space-x-3">
                <BrandButton
                  onClick={onClose}
                  variant="secondary"
                  className="px-4 py-2 text-sm"
                >
                  ✕ Close
                </BrandButton>
                <BrandButton
                  onClick={onBackToDashboard}
                  variant="primary"
                  className="px-4 py-2 text-sm"
                >
                  📊 Back to Dashboard
                </BrandButton>
              </div>
            </div>
          </motion.div>

          {/* User Info Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 mb-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-zinc-400">Target Role:</span>
                <span className="text-white font-medium">{userData.jobRole}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-zinc-400">Email:</span>
                <span className="text-white">{userData.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-zinc-400">LinkedIn:</span>
                <a 
                  href={userData.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  View Profile
                </a>
              </div>
              {userData.github && (
                <div className="flex items-center space-x-2">
                  <span className="text-zinc-400">GitHub:</span>
                  <a 
                    href={userData.github} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    View Profile
                  </a>
                </div>
              )}
            </div>
          </motion.div>

          {/* Analysis Results */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden"
          >
            <div className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Detailed Analysis & Recommendations
              </h2>
              
              {/* Markdown Content */}
              <div className="prose prose-invert prose-zinc max-w-none">
                <div className="text-white space-y-4 [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:text-white [&>h1]:mb-4 [&>h1]:mt-8 [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:text-blue-300 [&>h2]:mb-3 [&>h2]:mt-6 [&>h3]:text-lg [&>h3]:font-medium [&>h3]:text-purple-300 [&>h3]:mb-2 [&>h3]:mt-4 [&>p]:text-zinc-200 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:text-zinc-200 [&>li]:mb-1 [&>strong]:text-white [&>strong]:font-semibold [&>table]:border-collapse [&>table]:border [&>table]:border-zinc-700 [&>table]:rounded-lg [&>table]:overflow-hidden [&>thead]:bg-zinc-800 [&>th]:border [&>th]:border-zinc-700 [&>th]:p-3 [&>th]:text-left [&>th]:font-semibold [&>th]:text-white [&>td]:border [&>td]:border-zinc-700 [&>td]:p-3 [&>td]:text-zinc-200 [&>a]:text-blue-400 [&>a]:hover:text-blue-300 [&>a]:underline [&>code]:bg-zinc-800 [&>code]:px-2 [&>code]:py-1 [&>code]:rounded [&>code]:text-green-400 [&>blockquote]:border-l-4 [&>blockquote]:border-blue-500 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-zinc-300">
                  <ReactMarkdown>{analysis}</ReactMarkdown>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 pb-8"
          >
            <CinematicButton
              variant="sunglow"
              onClick={onBackToDashboard}
              className="px-6 py-3 flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              <span>Go to Dashboard</span>
            </CinematicButton>

            <BrandButton
              onClick={() => window.print()}
              variant="secondary"
              className="px-6 py-3 flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print Report</span>
            </BrandButton>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GapAnalysisResults;