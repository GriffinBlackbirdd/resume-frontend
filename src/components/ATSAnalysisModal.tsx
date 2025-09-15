"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import ElectricBorder from "./ElectricBorder";
import { BrandButton } from "./ui/brand-button";
import { CinematicButton } from "./ui/cinematic-button";
import { TextButton } from "./ui/text-button";

interface ATSAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeFile: File | null;
  jobDescriptionFile: File | null;
}

const ATSAnalysisModal: React.FC<ATSAnalysisModalProps> = ({
  isOpen,
  onClose,
  resumeFile,
  jobDescriptionFile,
}) => {
  const [analysisStage, setAnalysisStage] = useState<'analyzing' | 'complete'>('analyzing');
  const [progress, setProgress] = useState(0);
  const [atsScore, setAtsScore] = useState(0);
  
  // Mock analysis results
  const mockResults = {
    score: 87,
    keywordMatch: "Excellent",
    formatScore: "ATS-Friendly", 
    skillsAlignment: "Good",
    recommendations: [
      "Add more industry-specific keywords",
      "Strengthen technical skills section",
      "Include quantifiable achievements"
    ]
  };

  useEffect(() => {
    if (isOpen) {
      setAnalysisStage('analyzing');
      setProgress(0);
      setAtsScore(0);
      
      // Simulate analysis progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setAnalysisStage('complete');
            // Animate score counting up
            const scoreInterval = setInterval(() => {
              setAtsScore(current => {
                if (current >= mockResults.score) {
                  clearInterval(scoreInterval);
                  return mockResults.score;
                }
                return current + 1;
              });
            }, 30);
            return 100;
          }
          return prev + 2;
        });
      }, 60);

      return () => {
        clearInterval(interval);
      };
    }
  }, [isOpen]);

  const CircularProgress = ({ progress, score }: { progress: number; score: number }) => {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
      <div className="relative">
        <svg width="200" height="200" className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="url(#gradient)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500 ease-out"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#06d6a0" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-white">{score}%</div>
            <div className="text-sm text-zinc-400">ATS Score</div>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl mx-4">
        <ElectricBorder
          color="#3b82f6"
          speed={2}
          chaos={1.5}
          thickness={3}
          className="rounded-2xl"
          style={{}}
        >
          <div className="bg-zinc-900 rounded-2xl p-8 relative">
            {/* Close button */}
            <TextButton
              onClick={onClose}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </TextButton>

            {/* Content */}
            <div className="space-y-8">
              {/* Header */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {analysisStage === 'analyzing' ? 'Analyzing Your Resume' : 'Analysis Complete'}
                </h2>
                <p className="text-zinc-400">
                  {analysisStage === 'analyzing' 
                    ? 'AI is processing your resume against the job requirements...' 
                    : 'Here\'s how your resume performs against ATS systems'
                  }
                </p>
              </div>

              {/* Progress/Results Section */}
              <div className="flex justify-center">
                {analysisStage === 'analyzing' ? (
                  <CircularProgress progress={progress} score={0} />
                ) : (
                  <CircularProgress progress={100} score={atsScore} />
                )}
              </div>

              {/* Analysis Details */}
              {analysisStage === 'complete' && (
                <div className="space-y-6">
                  {/* Score Breakdown */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm text-zinc-400">Keywords</span>
                      </div>
                      <div className="text-emerald-400 font-medium">{mockResults.keywordMatch}</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                        <span className="text-sm text-zinc-400">Format</span>
                      </div>
                      <div className="text-blue-400 font-medium">{mockResults.formatScore}</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-yellow-400" />
                        <span className="text-sm text-zinc-400">Skills</span>
                      </div>
                      <div className="text-yellow-400 font-medium">{mockResults.skillsAlignment}</div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-zinc-800 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Recommendations</h3>
                    <ul className="space-y-2">
                      {mockResults.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start space-x-2 text-sm text-zinc-400">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-center space-x-4">
                    <BrandButton
                      onClick={onClose}
                      variant="secondary"
                      className="px-6 py-2"
                    >
                      Close
                    </BrandButton>
                    <CinematicButton variant="sunglow" className="px-6 py-2">
                      Download Report
                    </CinematicButton>
                  </div>
                </div>
              )}

              {/* File Info */}
              <div className="text-center text-xs text-zinc-500">
                Analyzing: {resumeFile?.name} • {jobDescriptionFile?.name}
              </div>
            </div>
          </div>
        </ElectricBorder>
      </div>
    </div>
  );
};

export default ATSAnalysisModal;