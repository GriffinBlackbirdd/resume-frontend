"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const loadingMessages = [
  "🎨 Crafting your personalized resume...",
  "📝 Optimizing content for ATS systems...",
  "🎯 Tailoring skills to match job requirements...",
  "⚡ Enhancing your professional experience...",
  "🚀 Building your career narrative...",
  "📊 Analyzing industry keywords...",
  "💼 Structuring your achievements...",
  "🌟 Highlighting your unique value proposition...",
  "🔧 Fine-tuning resume formatting...",
  "📈 Maximizing your impact statements...",
  "🎪 Polishing your professional summary...",
  "💡 Optimizing for hiring managers...",
  "🏆 Showcasing your competitive advantages...",
  "📖 Refining your work experience...",
  "✨ Adding the finishing touches..."
];

const AnalysisLoadingScreen = ({ isVisible }: { isVisible: boolean }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    // Change message every 3 seconds
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 3000);

    // Update progress bar
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev; // Stop at 95% to avoid completing
        return prev + Math.random() * 2; // Random increment
      });
    }, 500);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 bg-vista-white/95 dark:bg-[#0D0D0D]/95 backdrop-blur-sm z-50 flex items-center justify-center"
      style={{
        backgroundImage: `
          linear-gradient(rgba(128, 128, 128, 0.25) 1px, transparent 1px),
          linear-gradient(90deg, rgba(128, 128, 128, 0.25) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px'
      }}
    >
      <div className="max-w-md w-full mx-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-vista-white dark:bg-[#1C1C1C] rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl"
        >
          {/* Animated Icon */}
          <div className="flex justify-center mb-6">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-16 h-16 bg-gradient-to-r from-[#FDBA2F] to-[#8C3BFF] rounded-full flex items-center justify-center shadow-lg"
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </motion.div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bebas tracking-tight text-mine-shaft dark:text-[#E0E0E0] mb-2">
              Crafting Your Resume
            </h2>
            <p className="text-mine-shaft/60 dark:text-[#E0E0E0]/60 text-sm font-editorial">
              Our AI is optimizing your resume for maximum impact
            </p>
          </div>

          {/* Animated Message */}
          <div className="h-12 flex items-center justify-center mb-6">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentMessageIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-[#FDBA2F] text-sm text-center font-sf font-medium"
              >
                {loadingMessages[currentMessageIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between text-xs text-mine-shaft/60 dark:text-[#E0E0E0]/60 font-sf">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-[#E0E0E0]/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#FDBA2F] to-[#8C3BFF] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
          </div>

          {/* Animated Dots */}
          <div className="flex justify-center space-x-2 mt-6">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-2 h-2 bg-[#FDBA2F] rounded-full"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.3
                }}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-xs text-mine-shaft/50 dark:text-[#E0E0E0]/50 font-sf">
              This usually takes 2-5 minutes. Please don't close this window.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalysisLoadingScreen;