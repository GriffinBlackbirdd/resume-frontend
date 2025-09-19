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
import { EnhancedInput, EnhancedTextarea } from "@/components/ui/enhanced-input";
import { EnhancedFileUpload } from "@/components/ui/enhanced-file-upload";

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
    phone: "+91-",
    linkedin: "https://linkedin.com/in/",
    github: "https://github.com/",
    jobRole: "",
    targetCompany: "",
    resumeFile: null,
    jobDescriptionFile: null,
    useJobDescriptionText: false,
    jobDescriptionText: "",
  });

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    // Special handling for phone field to maintain +91- prefix
    if (field === 'phone' && typeof value === 'string') {
      if (!value.startsWith('+91-')) {
        value = '+91-' + value.replace(/^\+91-?/, '');
      }
    }

    // Special handling for LinkedIn field to maintain URL prefix
    if (field === 'linkedin' && typeof value === 'string') {
      if (!value.startsWith('https://linkedin.com/in/')) {
        value = 'https://linkedin.com/in/' + value.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\/?/, '');
      }
    }

    // Special handling for GitHub field to maintain URL prefix
    if (field === 'github' && typeof value === 'string') {
      if (!value.startsWith('https://github.com/')) {
        value = 'https://github.com/' + value.replace(/^https?:\/\/(www\.)?github\.com\/?/, '');
      }
    }

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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/revamp-existing`, {
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
        // Email must be valid format
        const isEmailValid = formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
        // Phone must be exactly 14 characters (+91- + 10 digits)
        const isPhoneValid = formData.phone && formData.phone.length === 14;
        // LinkedIn must have username (more than just the prefix)
        const isLinkedInValid = formData.linkedin && formData.linkedin.length > 28 && formData.linkedin !== 'https://linkedin.com/in/';

        return !!(isEmailValid && isPhoneValid && isLinkedInValid);
      case 2:
        return !!(formData.jobRole && formData.jobRole.trim().length > 0);
      case 3:
        const hasJobDescription = formData.useJobDescriptionText
          ? formData.jobDescriptionText.trim().length > 0
          : formData.jobDescriptionFile !== null;
        return !!(formData.resumeFile && hasJobDescription);
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
              title: "Personal Info",
              description: "Contact details and profiles"
            },
            {
              title: "Job Details",
              description: "Target role and company"
            },
            {
              title: "Documents",
              description: "Resume and job description"
            }
          ]}
        >
          {/* Step 1: Personal Information */}
          <VerticalStep>
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bebas tracking-tight text-mine-shaft mb-2">Personal Information</h2>
                <p className="text-mine-shaft/60 font-editorial">Enter your contact details and professional profiles</p>
              </div>

              <div className="bg-vista-white rounded-2xl p-6 border border-gray-200">
                <h3 className="text-lg font-sf font-semibold text-mine-shaft mb-6">Contact Information</h3>
                <div className="space-y-6">
                    {/* Location */}
                    <EnhancedInput
                      label="Location"
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      placeholder="Bangalore, India"
                      helperText="Your city, state or country"
                      icon={
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      }
                    />

                    {/* Email */}
                    <EnhancedInput
                      label="Email Address"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="johndoe@gmail.com"
                      required
                      success={formData.email ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) : undefined}
                      error={formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? "Please enter a valid email address" : undefined}
                      icon={
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      }
                    />

                    {/* Phone */}
                    <EnhancedInput
                      label="Phone Number"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="+91-9999999999"
                      required
                      success={formData.phone ? formData.phone.length === 14 : undefined}
                      icon={
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      }
                    />

                    {/* LinkedIn */}
                    <EnhancedInput
                      label="LinkedIn Profile"
                      type="url"
                      value={formData.linkedin}
                      onChange={(e) => handleInputChange("linkedin", e.target.value)}
                      placeholder="https://linkedin.com/in/johndoe"
                      required
                      success={formData.linkedin ? formData.linkedin.length > 28 && formData.linkedin !== 'https://linkedin.com/in/' : undefined}
                      error={formData.linkedin && !formData.linkedin.includes('linkedin.com') ? "Please enter a valid LinkedIn URL" : undefined}
                      icon={
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      }
                    />
                </div>
              </div>

              <div className="bg-vista-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-sf font-semibold text-mine-shaft">Professional Links</h3>
                  <span className="text-xs text-mine-shaft/60 bg-gray-100 px-3 py-1 rounded-full font-sf">Optional</span>
                </div>
                <div>
                    <EnhancedInput
                      label="GitHub Profile"
                      type="url"
                      value={formData.github}
                      onChange={(e) => handleInputChange("github", e.target.value)}
                      placeholder="https://github.com/johndoe"
                      helperText="Showcase your coding projects and contributions"
                      success={formData.github ? formData.github.length > 19 && formData.github !== 'https://github.com/' : undefined}
                      icon={
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                      }
                    />
                </div>
              </div>
            </div>
          </VerticalStep>

          {/* Step 2: Job Details */}
          <VerticalStep>
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bebas tracking-tight text-mine-shaft mb-2">Job Details</h2>
                <p className="text-mine-shaft/60 font-editorial">Tell us about the position you're targeting</p>
              </div>

              <div className="bg-vista-white rounded-2xl p-6 border border-gray-200">
                <h3 className="text-lg font-sf font-semibold text-mine-shaft mb-6">Target Position</h3>
                <div className="space-y-6">
                  <EnhancedInput
                    label="Target Job Role"
                    type="text"
                    value={formData.jobRole}
                    onChange={(e) => handleInputChange("jobRole", e.target.value)}
                    placeholder="Software Engineer"
                    required
                    helperText="Enter the exact job title you're applying for"
                    success={formData.jobRole.length > 0}
                  />

                  <EnhancedInput
                    label="Target Company"
                    type="text"
                    value={formData.targetCompany}
                    onChange={(e) => handleInputChange("targetCompany", e.target.value)}
                    placeholder="Google"
                    helperText="Company name you're targeting for this role (optional)"
                    success={formData.targetCompany.length > 0}
                  />
                </div>
              </div>
            </div>
          </VerticalStep>

          {/* Step 3: Resume & Job Description */}
          <VerticalStep>
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bebas tracking-tight text-mine-shaft mb-2">Documents</h2>
                <p className="text-mine-shaft/60 font-editorial">Upload your resume and job description for analysis</p>
              </div>

              <div className="space-y-6">
                <div className="bg-vista-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg font-sf font-semibold text-mine-shaft mb-6">Current Resume</h3>
                  <div>
                    <EnhancedFileUpload
                      label="Upload your current resume"
                      accept=".pdf"
                      maxSize={10}
                      required
                      file={formData.resumeFile}
                      onChange={(file) => handleFileChange("resumeFile", file)}
                      helperText="Upload your most recent resume in PDF format for analysis"
                    />
                  </div>
                </div>

                <div className="bg-vista-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg font-sf font-semibold text-mine-shaft mb-6">Job Description</h3>
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                      <input
                        type="checkbox"
                        id="use-text-jd"
                        checked={formData.useJobDescriptionText}
                        onChange={(e) => {
                          handleInputChange("useJobDescriptionText", e.target.checked);
                          if (e.target.checked) {
                            handleFileChange("jobDescriptionFile", null);
                          } else {
                            handleInputChange("jobDescriptionText", "");
                          }
                        }}
                        className="w-4 h-4 text-sunglow bg-vista-white border-gray-300 rounded focus:ring-sunglow"
                      />
                      <label htmlFor="use-text-jd" className="cursor-pointer font-sf text-mine-shaft">
                        Paste job description as text instead of uploading a file
                      </label>
                    </div>

                    {formData.useJobDescriptionText ? (
                      <EnhancedTextarea
                        label="Job Description"
                        value={formData.jobDescriptionText}
                        onChange={(e) => handleInputChange("jobDescriptionText", e.target.value)}
                        placeholder="Paste the job description here..."
                        required
                        helperText="Copy and paste the complete job description for better analysis"
                        className="min-h-[200px]"
                        success={formData.jobDescriptionText.trim().length > 50}
                      />
                    ) : (
                      <EnhancedFileUpload
                        label="Upload job description"
                        accept=".pdf,.docx,.txt"
                        maxSize={10}
                        required
                        file={formData.jobDescriptionFile}
                        onChange={(file) => handleFileChange("jobDescriptionFile", file)}
                        helperText="Upload the job description in PDF, DOCX, or TXT format"
                      />
                    )}
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