"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const loadingMessages = [
  "🔍 Analyzing your resume in detail...",
  "📊 Comparing your skills with job requirements...",
  "🎯 Identifying skill gaps and opportunities...",
  "📚 Researching the latest industry trends...",
  "💡 Generating personalized upskilling recommendations...",
  "🚀 Creating trending project suggestions...",
  "📈 Building your career advancement roadmap...",
  "🎪 Studying your background and experience...",
  "🔬 Deep-diving into job market insights...",
  "⚡ Crafting your personalized action plan...",
  "📖 Reviewing industry best practices...",
  "🎨 Designing your skill development journey...",
  "🏆 Preparing success strategies for you...",
  "💼 Analyzing market positioning opportunities...",
  "🌟 Creating your competitive advantage plan..."
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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
          {/* Animated Icon */}
          <div className="flex justify-center mb-6">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </motion.div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              Analyzing Your Profile
            </h2>
            <p className="text-zinc-400 text-sm">
              Our AI agents are working hard to create your personalized career roadmap
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
                className="text-blue-400 text-sm text-center font-medium"
              >
                {loadingMessages[currentMessageIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
          </div>

          {/* Animated Dots */}
          <div className="flex justify-center space-x-1 mt-6">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-2 h-2 bg-blue-500 rounded-full"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.2
                }}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-xs text-zinc-500">
              This usually takes 2-5 minutes. Please don't close this window.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisLoadingScreen;