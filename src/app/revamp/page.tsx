"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Stepper, { Step } from "@/components/ui/stepper";
import AnalysisLoadingScreen from "@/components/AnalysisLoadingScreen";
import { useAuth } from "@/contexts/AuthContext";

interface FormData {
  location: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  jobRole: string;
  targetCompany: string;
  resumeFile: File | null;
  jobDescriptionFile: File | null;
  useJobDescriptionText: boolean;
  jobDescriptionText: string;
}

export default function RevampPage() {
  const router = useRouter();
  const { token } = useAuth(); // Get the authentication token
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    location: "",
    email: "",
    phone: "",
    linkedin: "",
    github: "",
    jobRole: "",
    targetCompany: "",
    resumeFile: null,
    jobDescriptionFile: null,
    useJobDescriptionText: false,
    jobDescriptionText: "",
  });

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (field: keyof FormData, file: File | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const handleComplete = async () => {
    setIsAnalyzing(true);

    try {
      // Prepare form data for API
      const apiFormData = new FormData();
      apiFormData.append('location', formData.location);
      apiFormData.append('email', formData.email);
      apiFormData.append('phone', formData.phone);
      apiFormData.append('linkedin', formData.linkedin);
      apiFormData.append('github', formData.github || '');
      apiFormData.append('jobRole', formData.jobRole);
      apiFormData.append('targetCompany', formData.targetCompany || '');

      if (formData.resumeFile) {
        apiFormData.append('resumeFile', formData.resumeFile);
      }

      // Handle job description - either file or text
      if (formData.useJobDescriptionText && formData.jobDescriptionText.trim()) {
        apiFormData.append('jobDescriptionText', formData.jobDescriptionText.trim());
      } else if (formData.jobDescriptionFile) {
        apiFormData.append('jobDescriptionFile', formData.jobDescriptionFile);
      }

      // Call the FastAPI endpoint
      const headers: HeadersInit = {
        'ngrok-skip-browser-warning': 'true'
      };

      // Add Authorization header if user is authenticated
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔐 Adding Authorization header to request');
      } else {
        console.log('⚠️ No token found - request will be made without authentication');
      }

      const response = await fetch('http://localhost:8000/revamp-existing', {
        method: 'POST',
        headers,
        body: apiFormData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Analysis failed');
      }

      // Store YAML content, JD path, original resume path, and original ATS score in sessionStorage and redirect to editor
      sessionStorage.setItem('generatedYaml', result.yamlContent);
      if (result.jobDescriptionPath) {
        sessionStorage.setItem('jobDescriptionPath', result.jobDescriptionPath);
      }
      if (result.originalResumePath) {
        sessionStorage.setItem('originalResumePath', result.originalResumePath);
      }
      if (result.original_ats_score !== null && result.original_ats_score !== undefined) {
        sessionStorage.setItem('originalAtsScore', result.original_ats_score.toString());
        console.log('✅ Stored original ATS score in session:', result.original_ats_score);
      }
      router.push('/editor');

    } catch (error) {
      console.error('Error during analysis:', error);
      setIsAnalyzing(false);

      let errorMessage = 'Unknown error occurred';
      let troubleshooting = '';

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // If it's a service unavailable error, show helpful message
      if (errorMessage.includes('not available')) {
        troubleshooting = '\n\nTo fix this:\n1. Open a terminal in the project folder\n2. Run: python start_backend.py\n3. Wait for "Backend will be available" message\n4. Try your analysis again';
      }

      alert(`Analysis failed: ${errorMessage}${troubleshooting}`);
    }
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return formData.email && formData.phone && formData.linkedin;
      case 2:
        const hasJobDescription = formData.useJobDescriptionText
          ? formData.jobDescriptionText.trim().length > 0
          : formData.jobDescriptionFile !== null;
        return formData.jobRole && formData.resumeFile && hasJobDescription;
      case 3:
        return true; // Review step is always valid
      default:
        return true;
    }
  };


  return (
    <div className="min-h-screen bg-black text-white">
      <AnalysisLoadingScreen isVisible={isAnalyzing} />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <button
            onClick={() => router.back()}
            className="absolute top-8 left-8 flex items-center text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Revamp Your Resume
          </h1>
          <p className="text-zinc-400 max-w-lg mx-auto">
            Let's transform your existing resume to perfectly match your target job
          </p>
        </div>

        {/* Stepper */}
        <Stepper
          onFinalStepCompleted={handleComplete}
          onStepChange={(step) => {
            // Handle step change if needed
          }}
          validateStep={validateStep}
        >
          {/* Step 1: Personal Information */}
          <Step>
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-white mb-2">Personal Information</h2>
                <p className="text-zinc-400">Tell us about yourself</p>
              </div>

              <div className="max-w-md mx-auto space-y-6">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-white mb-3">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="New York, NY"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white mb-3">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="john.doe@example.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-white mb-3">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="linkedin" className="block text-sm font-medium text-white mb-3">
                    LinkedIn Profile *
                  </label>
                  <input
                    type="url"
                    id="linkedin"
                    value={formData.linkedin}
                    onChange={(e) => handleInputChange("linkedin", e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="https://linkedin.com/in/johndoe"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="github" className="block text-sm font-medium text-white mb-3">
                    GitHub Profile <span className="text-zinc-500">(Optional)</span>
                  </label>
                  <input
                    type="url"
                    id="github"
                    value={formData.github}
                    onChange={(e) => handleInputChange("github", e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="https://github.com/johndoe"
                  />
                </div>
              </div>
            </div>
          </Step>

          {/* Step 2: File Uploads */}
          <Step>
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-white mb-2">Job Details & Files</h2>
                <p className="text-zinc-400">Enter job role and upload your files for analysis</p>
              </div>

              <div className="max-w-lg mx-auto space-y-8">
                {/* Job Role Input */}
                <div>
                  <label htmlFor="jobRole" className="block text-sm font-medium text-white mb-3">
                    Target Job Role *
                  </label>
                  <input
                    type="text"
                    id="jobRole"
                    value={formData.jobRole}
                    onChange={(e) => handleInputChange("jobRole", e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g., AI Engineer, Full Stack Developer, Product Manager"
                    required
                  />
                  <p className="text-xs text-zinc-500 mt-2">Enter the exact job title you're applying for</p>
                </div>

                {/* Target Company Input */}
                <div>
                  <label htmlFor="targetCompany" className="block text-sm font-medium text-white mb-3">
                    Target Company <span className="text-zinc-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    id="targetCompany"
                    value={formData.targetCompany}
                    onChange={(e) => handleInputChange("targetCompany", e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g., Google, Microsoft, OpenAI, Tesla"
                  />
                  <p className="text-xs text-zinc-500 mt-2">Company name you're targeting for this role</p>
                </div>

                {/* Resume Upload */}
                <div>
                  <label className="block text-sm font-medium text-white mb-4">
                    Current Resume *
                  </label>
                  <div className="relative">
                    <input
                      id="resume-upload"
                      type="file"
                      className="sr-only"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        handleFileChange("resumeFile", file);
                      }}
                    />
                    <label
                      htmlFor="resume-upload"
                      className={cn(
                        "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                        formData.resumeFile
                          ? "border-green-500 bg-green-500/10"
                          : "border-zinc-600 hover:border-zinc-500 bg-zinc-800/50 hover:bg-zinc-800"
                      )}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {formData.resumeFile ? (
                          <>
                            <svg className="w-8 h-8 mb-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-green-400 font-medium">{formData.resumeFile.name}</p>
                            <p className="text-xs text-zinc-500">Click to change</p>
                          </>
                        ) : (
                          <>
                            <svg className="w-8 h-8 mb-2 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-sm text-white font-medium">Upload your resume</p>
                            <p className="text-xs text-zinc-500">PDF only, up to 10MB</p>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                {/* Job Description Upload */}
                <div>
                  <label className="block text-sm font-medium text-white mb-4">
                    Job Description *
                  </label>

                  {/* Checkbox for paste option */}
                  <div className="mb-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.useJobDescriptionText}
                        onChange={(e) => {
                          handleInputChange("useJobDescriptionText", e.target.checked);
                          // Clear the other option when switching
                          if (e.target.checked) {
                            handleFileChange("jobDescriptionFile", null);
                          } else {
                            handleInputChange("jobDescriptionText", "");
                          }
                        }}
                        className="w-4 h-4 text-blue-600 bg-zinc-700 border-zinc-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm text-white">Paste job description as text</span>
                    </label>
                  </div>

                  {/* Show text area or file upload based on checkbox */}
                  {formData.useJobDescriptionText ? (
                    <div>
                      <textarea
                        value={formData.jobDescriptionText}
                        onChange={(e) => handleInputChange("jobDescriptionText", e.target.value)}
                        placeholder="Paste the job description here..."
                        rows={8}
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-vertical"
                      />
                      <p className="text-xs text-zinc-500 mt-2">Paste the complete job description text</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        id="job-description-upload"
                        type="file"
                        className="sr-only"
                        accept=".pdf,.docx,.txt"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          handleFileChange("jobDescriptionFile", file);
                        }}
                      />
                      <label
                        htmlFor="job-description-upload"
                        className={cn(
                          "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                          formData.jobDescriptionFile
                            ? "border-green-500 bg-green-500/10"
                            : "border-zinc-600 hover:border-zinc-500 bg-zinc-800/50 hover:bg-zinc-800"
                        )}
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {formData.jobDescriptionFile ? (
                            <>
                              <svg className="w-8 h-8 mb-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-sm text-green-400 font-medium">{formData.jobDescriptionFile.name}</p>
                              <p className="text-xs text-zinc-500">Click to change</p>
                            </>
                          ) : (
                            <>
                              <svg className="w-8 h-8 mb-2 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="text-sm text-white font-medium">Upload job description</p>
                              <p className="text-xs text-zinc-500">PDF, DOCX, or TXT up to 10MB</p>
                            </>
                          )}
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Step>

          {/* Step 3: Review */}
          <Step>
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-white mb-2">Review & Submit</h2>
                <p className="text-zinc-400">Please review your information before submitting</p>
              </div>

              <div className="max-w-lg mx-auto space-y-6">
                {/* Personal Info Summary */}
                <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Personal Information
                  </h3>
                  <div className="space-y-3">
                    {formData.location && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Location:</span>
                        <span className="text-white">{formData.location}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Email:</span>
                      <span className="text-white">{formData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Phone:</span>
                      <span className="text-white">{formData.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">LinkedIn:</span>
                      <span className="text-white text-sm">{formData.linkedin}</span>
                    </div>
                    {formData.github && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">GitHub:</span>
                        <span className="text-white text-sm">{formData.github}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Job Details Summary */}
                <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                    </svg>
                    Job Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Target Role:</span>
                      <span className="text-white font-medium">{formData.jobRole}</span>
                    </div>
                  </div>
                </div>

                {/* Files Summary */}
                <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Uploaded Files
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Resume:</span>
                      <span className="text-green-400 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {formData.resumeFile?.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Job Description:</span>
                      <span className="text-green-400 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {formData.useJobDescriptionText
                          ? `Text (${formData.jobDescriptionText.length} characters)`
                          : formData.jobDescriptionFile?.name
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <p className="text-blue-300 text-sm text-center">
                    🚀 Your resume will be analyzed and optimized to match the job requirements perfectly!
                  </p>
                </div>
              </div>
            </div>
          </Step>
        </Stepper>
      </div>
    </div>
  );
}