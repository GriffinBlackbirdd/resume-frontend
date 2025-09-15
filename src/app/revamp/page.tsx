"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import VerticalStepper, { VerticalStep } from "@/components/ui/vertical-stepper";
import AnalysisLoadingScreen from "@/components/AnalysisLoadingScreen";
import { useAuth } from "@/contexts/AuthContext";
import { BrandButton } from "@/components/ui/brand-button";
import { CinematicButton } from "@/components/ui/cinematic-button";
import { TextButton } from "@/components/ui/text-button";

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

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.email && formData.phone && formData.linkedin);
      case 2:
        return !!(formData.jobRole);
      case 3:
        const hasJobDescription = formData.useJobDescriptionText
          ? formData.jobDescriptionText.trim().length > 0
          : formData.jobDescriptionFile !== null;
        return !!(formData.resumeFile && hasJobDescription);
      case 4:
        return true; // Review step is always valid
      default:
        return true;
    }
  };


  return (
    <div className="min-h-screen bg-vista-white texture-paper">
      <AnalysisLoadingScreen isVisible={isAnalyzing} />

      {/* Header */}
      <div className="bg-vista-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <TextButton
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 group"
            >
              <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </TextButton>
            <div className="text-center">
              <h1 className="text-xl font-bold brand-heading text-mine-shaft">Resume Revamp</h1>
              <p className="text-sm text-gray-600 brand-body">Optimize your resume for your dream job</p>
            </div>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">

        {/* Vertical Stepper */}
        <VerticalStepper
          onFinalStepCompleted={handleComplete}
          onStepChange={(step) => {
            // Handle step change if needed
          }}
          validateStep={validateStep}
          steps={[
            {
              title: "Personal Information",
              description: "Your contact details and profiles"
            },
            {
              title: "Job Details",
              description: "Target role and company information"
            },
            {
              title: "Resume & Job Description",
              description: "Upload your documents"
            },
            {
              title: "Review",
              description: "Confirm and submit"
            }
          ]}
        >
          {/* Step 1: Personal Information */}
          <VerticalStep>
            <div className="space-y-6">
                <div className="space-y-6">
                  <div className="bg-vista-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold brand-heading text-mine-shaft mb-6">Contact Information</h3>

                      <div className="space-y-5">
                        {/* Location */}
                        <div>
                          <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Location
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <input
                              type="text"
                              id="location"
                              value={formData.location}
                              onChange={(e) => handleInputChange("location", e.target.value)}
                              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-mine-shaft placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent transition-all"
                              placeholder="Enter your location"
                            />
                          </div>
                        </div>

                        {/* Email */}
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                              </svg>
                            </div>
                            <input
                              type="email"
                              id="email"
                              value={formData.email}
                              onChange={(e) => handleInputChange("email", e.target.value)}
                              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-mine-shaft placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent transition-all"
                              placeholder="john.doe@example.com"
                              required
                            />
                          </div>
                        </div>

                        {/* Phone */}
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                            </div>
                            <input
                              type="tel"
                              id="phone"
                              value={formData.phone}
                              onChange={(e) => handleInputChange("phone", e.target.value)}
                              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-mine-shaft placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent transition-all"
                              placeholder="+1 (555) 123-4567"
                              required
                            />
                          </div>
                        </div>

                        {/* LinkedIn */}
                        <div>
                          <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-2">
                            LinkedIn Profile <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                              </svg>
                            </div>
                            <input
                              type="url"
                              id="linkedin"
                              value={formData.linkedin}
                              onChange={(e) => handleInputChange("linkedin", e.target.value)}
                              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-mine-shaft placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent transition-all"
                              placeholder="https://linkedin.com/in/johndoe"
                              required
                            />
                          </div>
                        </div>
                  </div>
                </div>

                <div className="bg-vista-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold brand-heading text-mine-shaft">Professional Links</h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Optional</span>
                  </div>

                  <div>
                    <label htmlFor="github" className="block text-sm font-medium text-gray-700 mb-2">
                      GitHub Profile
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                      </div>
                      <input
                        type="url"
                        id="github"
                        value={formData.github}
                        onChange={(e) => handleInputChange("github", e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-mine-shaft placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent transition-all"
                        placeholder="https://github.com/johndoe"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </VerticalStep>

          {/* Step 2: Job Details */}
          <VerticalStep>
            <div className="space-y-6">

              <div className="space-y-6">
                <div className="bg-vista-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold brand-heading text-mine-shaft mb-6">Target Position</h3>
                  <div className="space-y-5">
                    <div>
                      <label htmlFor="jobRole" className="block text-sm font-medium text-gray-700 mb-2">
                        Target Job Role <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="jobRole"
                        value={formData.jobRole}
                        onChange={(e) => handleInputChange("jobRole", e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-mine-shaft placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent transition-all"
                        placeholder="e.g., AI Engineer, Full Stack Developer, Product Manager"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1.5">Enter the exact job title you're applying for</p>
                    </div>

                    <div>
                      <label htmlFor="targetCompany" className="block text-sm font-medium text-gray-700 mb-2">
                        Target Company
                      </label>
                      <input
                        type="text"
                        id="targetCompany"
                        value={formData.targetCompany}
                        onChange={(e) => handleInputChange("targetCompany", e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-mine-shaft placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent transition-all"
                        placeholder="e.g., Google, Microsoft, OpenAI, Tesla"
                      />
                      <p className="text-xs text-gray-500 mt-1.5">Company name you're targeting for this role</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </VerticalStep>

          {/* Step 3: Resume & Job Description */}
          <VerticalStep>
            <div className="space-y-6">
              <div className="bg-vista-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold brand-heading text-mine-shaft mb-6">Upload Documents</h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Resume <span className="text-red-500">*</span>
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
                          "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all",
                          formData.resumeFile
                            ? "border-green-500 bg-green-50"
                            : "border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100"
                        )}
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {formData.resumeFile ? (
                            <>
                              <svg className="w-8 h-8 mb-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-sm text-green-600 font-medium">{formData.resumeFile.name}</p>
                              <p className="text-xs text-gray-500">Click to change</p>
                            </>
                          ) : (
                            <>
                              <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <p className="text-sm text-gray-600 font-medium">Upload your resume</p>
                              <p className="text-xs text-gray-500">PDF only, up to 10MB</p>
                            </>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Description <span className="text-red-500">*</span>
                    </label>

                    <div className="mb-3">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.useJobDescriptionText}
                          onChange={(e) => {
                            handleInputChange("useJobDescriptionText", e.target.checked);
                            if (e.target.checked) {
                              handleFileChange("jobDescriptionFile", null);
                            } else {
                              handleInputChange("jobDescriptionText", "");
                            }
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="text-sm text-gray-700">Paste job description as text</span>
                      </label>
                    </div>

                    {formData.useJobDescriptionText ? (
                      <textarea
                        value={formData.jobDescriptionText}
                        onChange={(e) => handleInputChange("jobDescriptionText", e.target.value)}
                        placeholder="Paste the job description here..."
                        rows={8}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-mine-shaft placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent transition-all resize-vertical"
                      />
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
                            "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all",
                            formData.jobDescriptionFile
                              ? "border-green-500 bg-green-50"
                              : "border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100"
                          )}
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {formData.jobDescriptionFile ? (
                              <>
                                <svg className="w-8 h-8 mb-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm text-green-600 font-medium">{formData.jobDescriptionFile.name}</p>
                                <p className="text-xs text-gray-500">Click to change</p>
                              </>
                            ) : (
                              <>
                                <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-sm text-gray-600 font-medium">Upload job description</p>
                                <p className="text-xs text-gray-500">PDF, DOCX, or TXT up to 10MB</p>
                              </>
                            )}
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </VerticalStep>

          {/* Step 4: Review */}
          <VerticalStep>
            <div className="space-y-6">

              <div className="space-y-6">
                <div className="bg-vista-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold brand-heading text-mine-shaft mb-6">Review Your Information</h3>
                  <div className="space-y-6">
                    {/* Personal Info Summary */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Personal Information
                      </h4>
                      <div className="space-y-2">
                        {formData.location && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Location:</span>
                            <span className="text-gray-900 font-medium">{formData.location}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Email:</span>
                          <span className="text-gray-900 font-medium">{formData.email}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Phone:</span>
                          <span className="text-gray-900 font-medium">{formData.phone}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">LinkedIn:</span>
                          <span className="text-gray-900 dark:text-gray-100 font-medium text-sm truncate max-w-xs">{formData.linkedin}</span>
                        </div>
                        {formData.github && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">GitHub:</span>
                            <span className="text-gray-900 dark:text-gray-100 font-medium text-sm truncate max-w-xs">{formData.github}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Job Details Summary */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                        </svg>
                        Job Details
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Target Role:</span>
                          <span className="text-gray-900 font-medium">{formData.jobRole}</span>
                        </div>
                        {formData.targetCompany && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Target Company:</span>
                            <span className="text-gray-900 font-medium">{formData.targetCompany}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Files Summary */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Uploaded Files
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Resume:</span>
                          <span className="text-green-600 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {formData.resumeFile?.name}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Job Description:</span>
                          <span className="text-green-600 flex items-center">
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
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-blue-700 text-sm text-center">
                      🚀 Your resume will be analyzed and optimized to match the job requirements perfectly!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </VerticalStep>
        </VerticalStepper>
      </div>
    </div>
  );
}