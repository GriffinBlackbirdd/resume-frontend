"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FloatingDock } from "@/components/floating-dock";
import Hyperspeed from "@/components/Hyperspeed";
import FlipLink from "@/components/ui/text-effect-flipper";
import ImageCursorTrail from "@/components/ui/image-cursortrail";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { AceternityAuthModal } from "@/components/auth/AceternityAuthModal";

export default function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [loading, isAuthenticated, router]);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      setAuthMode('signup');
      setShowAuthModal(true);
    }
  };

  const handleSignIn = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleSwitchMode = () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login');
  };

  return (
    <div className="relative bg-black overflow-hidden">
      {/* Hero and About Us Sections with Hyperspeed Background */}
      <div className="relative">
        {/* Hyperspeed Background */}
        <div className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
          <Hyperspeed />
        </div>
        
        {/* Floating Dock */}
        <FloatingDock />
        
        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* AI Powered Badge */}
        <div className={cn(
          "mb-12 px-4 py-2 rounded-full animate-float",
          "bg-gradient-to-r from-purple-500/10 via-blue-500/15 to-cyan-500/10",
          "backdrop-blur-xl border border-white/20",
          "text-white text-xs font-semibold tracking-wider uppercase",
          "shadow-2xl shadow-purple-500/20 animate-glow",
          "hover:scale-105 transition-all duration-300",
          "relative overflow-hidden cursor-pointer"
        )}>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-cyan-500/5 animate-gradient opacity-50"></div>
          <span className="relative flex items-center space-x-1.5">
            <span className="animate-pulse text-xs">✨</span>
            <span>AI Powered</span>
          </span>
        </div>
        
        {/* Hero Text */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
            Build resumes with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-500 to-cyan-400 animate-pulse">
              hyperspeed
            </span>
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Create stunning, professional resumes in seconds with our AI-powered platform. 
            Stand out from the crowd and land your dream job faster than ever.
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          {/* Get Started Button (All White) */}
          <button 
            onClick={handleGetStarted}
            className={cn(
              "group px-12 py-4 rounded-2xl",
              "bg-white text-black font-bold text-lg",
              "hover:bg-gray-100 hover:scale-105",
              "transition-all duration-300 ease-out",
              "shadow-2xl hover:shadow-3xl",
              "shadow-white/20 hover:shadow-white/30",
              "min-w-[220px] relative overflow-hidden"
            )}
          >
            <span className="relative z-10 flex items-center justify-center space-x-2">
              <span>{isAuthenticated ? 'Go to Dashboard' : 'Get started'}</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
          
          {/* Learn More Button (Glass Morphism) */}
          <button className={cn(
            "group px-12 py-4 rounded-2xl",
            "bg-gradient-to-r from-white/5 to-white/10",
            "backdrop-blur-xl border border-white/20",
            "text-white font-bold text-lg",
            "hover:from-white/10 hover:to-white/15",
            "hover:border-white/30 hover:scale-105",
            "transition-all duration-300 ease-out",
            "shadow-2xl hover:shadow-3xl",
            "shadow-purple-500/20 hover:shadow-purple-500/30",
            "min-w-[220px] relative overflow-hidden"
          )}>
            <span className="relative z-10 flex items-center justify-center space-x-2">
              <span>Learn more</span>
              <svg className="w-5 h-5 group-hover:rotate-45 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </button>
        </div>

        {/* Sign In Link for existing users */}
        {!isAuthenticated && (
          <div className="mt-8">
            <p className="text-white/60 text-sm">
              Already have an account?{' '}
              <button
                onClick={handleSignIn}
                className="text-white hover:text-purple-400 font-medium underline underline-offset-2 transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        )}
        
        {/* Additional Visual Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10">
          <div className="w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
        </div>
        <div className="absolute top-1/3 right-1/4 -z-10">
          <div className="w-48 h-48 bg-blue-500/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
        </div>
        <div className="absolute bottom-1/3 left-1/4 -z-10">
          <div className="w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
        </div>

        {/* About Us Section */}
        <div className="relative z-10 py-32 px-4 bg-gradient-to-b from-transparent via-black/50 to-black">
        <div className="max-w-7xl mx-auto">
          {/* About Us heading moved above */}
          <div className="text-center mb-16">
            <div className={cn(
              "inline-block px-4 py-2 rounded-full",
              "bg-gradient-to-r from-purple-500/20 to-cyan-500/20",
              "border border-white/10 backdrop-blur-sm",
              "text-white/80 text-sm font-medium uppercase tracking-wider"
            )}>
              About Us
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Side - Text Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                
                <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                  Revolutionizing{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                    Career Success
                  </span>
                </h2>
              </div>

              <div className="space-y-6 text-white/70 text-lg leading-relaxed">
                <p>
                  At Alpha, we believe that every professional deserves a resume that 
                  truly represents their unique value proposition. Our AI-powered platform 
                  combines cutting-edge technology with industry expertise to create 
                  resumes that don't just list your experience—they tell your story.
                </p>
                
                <p>
                  From Fortune 500 executives to recent graduates, our intelligent 
                  algorithms analyze industry trends, optimize for ATS systems, and 
                  craft compelling narratives that get you noticed by the right people.
                </p>

                <div className="pt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-8 space-y-4 sm:space-y-0 text-white/60">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/30 flex items-center justify-center border border-purple-400/20">
                        <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      </div>
                      <span className="font-medium">AI-Powered</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/30 flex items-center justify-center border border-blue-400/20">
                        <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                        </svg>
                      </div>
                      <span className="font-medium">ATS Optimized</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-600/30 flex items-center justify-center border border-cyan-400/20">
                        <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      </div>
                      <span className="font-medium">Industry Expert</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Text Flipper */}
            <div className="flex flex-col items-center justify-center">
              <div className="text-center space-y-4">
                <FlipLink href="#features">
                  RESUMES
                </FlipLink>
                <FlipLink href="#features">
                  CAREERS
                </FlipLink>
                <FlipLink href="#features">
                  SUCCESS
                </FlipLink>
              </div>
            </div>

          </div>
        </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 py-32 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          {/* Section heading */}
          <div className="text-center mb-20">
            <div className={cn(
              "inline-block px-4 py-2 rounded-full mb-6",
              "bg-gradient-to-r from-purple-500/20 to-cyan-500/20",
              "border border-white/10 backdrop-blur-sm",
              "text-white/80 text-sm font-medium uppercase tracking-wider"
            )}>
              Features
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4">
              Powerful tools for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                perfect resumes
              </span>
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Everything you need to create, customize, and optimize your resume for maximum impact
            </p>
          </div>

          {/* Features Grid */}
          <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2">
            <GridItem
              area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
              icon={<svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>}
              title="AI-Powered Writing"
              description="Our advanced AI analyzes your experience and generates compelling, professional content that highlights your achievements and skills."
            />

            <GridItem
              area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
              icon={<svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
              </svg>}
              title="ATS Optimization"
              description="Ensure your resume passes through Applicant Tracking Systems with our intelligent formatting and keyword optimization."
            />

            <GridItem
              area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
              icon={<svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v4H4zm3-4.5c-1.25 0-2.25-1-2.25-2.25S5.75 9 7 9s2.25 1 2.25 2.25S8.25 13.5 7 13.5z"/>
              </svg>}
              title="Real-time Collaboration"
              description="Share your resume with mentors, career coaches, or peers for instant feedback and collaborative improvements."
            />

            <GridItem
              area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
              icon={<svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>}
              title="Multiple Export Formats"
              description="Export your resume in PDF, Word, or plain text formats. Each format is optimized for different application methods."
            />

            <GridItem
              area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
              icon={<svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22,21H2V3H4V19H6V17H10V19H12V16H16V19H18V17H22V21M16,8H18V15H16V8M12,2H14V15H12V2M6,10H10V15H6V10Z"/>
              </svg>}
              title="Analytics Dashboard"
              description="Track your resume's performance with detailed analytics on views, downloads, and application success rates."
            />
          </ul>
        </div>
      </div>

      {/* Resume Templates Section */}
      <div className="relative z-10 py-32 bg-black">
        <div className="max-w-7xl mx-auto px-4">
          {/* Section heading */}
          <div className="text-center mb-16">
            <div className={cn(
              "inline-block px-4 py-2 rounded-full mb-6",
              "bg-gradient-to-r from-purple-500/20 to-cyan-500/20",
              "border border-white/10 backdrop-blur-sm",
              "text-white/80 text-sm font-medium uppercase tracking-wider"
            )}>
              Templates
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
              Choose from our{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                various templates
              </span>
            </h2>
          </div>

          {/* Image Cursor Trail Component */}
          <ImageCursorTrail
            items={[
              "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=500&fit=crop",
              "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop",
              "https://images.unsplash.com/photo-1494790108755-2616b169eb56?w=400&h=500&fit=crop",
              "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop",
              "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop",
              "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop",
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop",
              "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop"
            ]}
            className="h-[500px] bg-gradient-to-br from-gray-900/50 to-black/80 border border-white/5 rounded-2xl"
            imgClass="w-48 h-60 shadow-2xl shadow-purple-500/20"
            maxNumberOfImages={6}
            distance={15}
            fadeAnimation={true}
          >
            <div className="text-center space-y-6">
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </ImageCursorTrail>
        </div>
      </div>

      {/* Authentication Modal */}
      <AceternityAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onSwitchMode={handleSwitchMode}
      />
    </div>
  );
}

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}

const GridItem = ({ area, icon, title, description }: GridItemProps) => {
  return (
    <li className={`min-h-[14rem] list-none ${area}`}>
      <div className="relative h-full rounded-2xl border border-white/10 p-2 md:rounded-3xl md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl bg-gradient-to-br from-gray-900/80 to-black/60 p-6 backdrop-blur-sm md:p-6">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border border-white/20 p-2 bg-white/5">
              {icon}
            </div>
            <div className="space-y-3">
              <h3 className="pt-0.5 font-sans text-xl/[1.375rem] font-semibold text-white md:text-2xl/[1.875rem]">
                {title}
              </h3>
              <h2 className="font-sans text-sm/[1.125rem] text-white/70 md:text-base/[1.375rem]">
                {description}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};