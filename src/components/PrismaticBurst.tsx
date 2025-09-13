"use client";

import React from 'react';

const PrismaticBurst = ({ className = '' }) => {
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 animate-pulse"></div>
      
      {/* Prismatic burst effects */}
      <div className="absolute inset-0">
        {/* Central burst */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-30">
          <div className="absolute inset-0 bg-gradient-conic from-pink-500 via-purple-500 via-blue-500 via-cyan-500 via-green-500 via-yellow-500 via-red-500 to-pink-500 rounded-full animate-spin-slow blur-sm"></div>
        </div>
        
        {/* Secondary bursts */}
        <div className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full opacity-20">
          <div className="absolute inset-0 bg-gradient-conic from-blue-400 via-purple-400 via-pink-400 to-blue-400 rounded-full animate-spin-reverse blur-md"></div>
        </div>
        
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-25">
          <div className="absolute inset-0 bg-gradient-conic from-green-400 via-cyan-400 via-blue-400 to-green-400 rounded-full animate-spin-slow blur-lg"></div>
        </div>
        
        {/* Smaller accent bursts */}
        <div className="absolute top-3/4 left-1/6 w-32 h-32 rounded-full opacity-15">
          <div className="absolute inset-0 bg-gradient-conic from-yellow-400 via-orange-400 via-red-400 to-yellow-400 rounded-full animate-spin blur-sm"></div>
        </div>
        
        <div className="absolute top-1/6 right-1/3 w-40 h-40 rounded-full opacity-20">
          <div className="absolute inset-0 bg-gradient-conic from-indigo-400 via-purple-400 via-pink-400 to-indigo-400 rounded-full animate-spin-reverse blur-md"></div>
        </div>
      </div>
      
      {/* Overlay for depth */}
      <div className="absolute inset-0 bg-black/40"></div>
      
      {/* Animated particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-60 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>
      
      {/* CSS Custom Animations */}
      <style jsx>{`
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes spin-reverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.8;
          }
        }
        
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        
        .animate-spin-reverse {
          animation: spin-reverse 15s linear infinite;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default PrismaticBurst;