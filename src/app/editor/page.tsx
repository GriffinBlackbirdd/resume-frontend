"use client";

import React, { useState, useEffect } from "react";
import MonacoEditor from "@monaco-editor/react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import * as yaml from 'js-yaml';
import confetti from 'canvas-confetti';
import { User, Link, FileText, Briefcase, Rocket, GraduationCap, Zap, Award, Star, Settings, Eye, Download, BarChart3, RefreshCw, Palette, Play, Pause } from 'lucide-react';
import { BrandButton } from "@/components/ui/brand-button";
import { CinematicButton } from "@/components/ui/cinematic-button";
import { TextButton } from "@/components/ui/text-button";
import { ThemeToggleButton } from "@/components/ui/theme-toggle";
import { useTheme } from "@/contexts/ThemeContext";

export default function ResumeEditor() {
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const { theme } = useTheme();
  const projectId = searchParams.get('project_id');

  // Initialize YAML content - use empty string if loading from project, default content otherwise
  const getInitialYamlContent = () => {
    if (projectId) {
      console.log('🔍 ProjectId detected, starting with empty YAML (will load from project)');
      return '# Loading project...';
    }
    console.log('🔍 No projectId, starting with default YAML');
    return `# RenderCV Resume Configuration
cv:
  name: John Doe
  location: New York, NY
  email: john.doe@example.com
# phone: tel:+1-555-123-4567
  website: https://johndoe.com
  linkedin: johndoe
  github: johndoe

  sections:
    summary:
      - Experienced software engineer with 5+ years in full-stack development
      - Passionate about creating scalable web applications and user experiences

    experience:
      - company: Tech Corp
        position: Senior Software Engineer
        location: New York, NY
        start_date: 2021-01
        end_date: present
        highlights:
          - Led development of microservices architecture serving 1M+ users
          - Reduced application load time by 40% through optimization
          - Mentored 3 junior developers and conducted code reviews

      - company: StartupXYZ
        position: Full Stack Developer
        location: San Francisco, CA
        start_date: 2019-06
        end_date: 2020-12
        highlights:
          - Built responsive web applications using React and Node.js
          - Implemented CI/CD pipelines reducing deployment time by 60%

    education:
      - institution: State University
        area: Computer Science
        degree: Bachelor of Science
        start_date: 2015
        end_date: 2019

    technologies:
      - label: Languages
        details: JavaScript, TypeScript, Python, Java
      - label: Frameworks
        details: React, Node.js, Express, Django
      - label: Databases
        details: PostgreSQL, MongoDB, Redis
      - label: Tools
        details: AWS, Docker, Kubernetes, Git, CI/CD

design:
  theme: sb2novDesign`;
  };

  const [yamlContent, setYamlContent] = useState(getInitialYamlContent());

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRenderEnabled, setAutoRenderEnabled] = useState(true);

  // Loading states
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [showInitialLoadingOverlay, setShowInitialLoadingOverlay] = useState(!!projectId); // Show overlay only for projects
  const [pdfRenderReady, setPdfRenderReady] = useState(false);
  const [isProjectDataLoaded, setIsProjectDataLoaded] = useState(false); // Track when project YAML is loaded

  const [lastYamlContent, setLastYamlContent] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState<string>('engineeringClassic');
  const [renderKey, setRenderKey] = useState<number>(0);
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [isLoadingAtsScore, setIsLoadingAtsScore] = useState(false);
  const [atsError, setAtsError] = useState<string | null>(null);
  const [jobDescriptionPath, setJobDescriptionPath] = useState<string | null>(null);
  const [hasJobDescription, setHasJobDescription] = useState(false);
  const [originalResumePath, setOriginalResumePath] = useState<string | null>(null);
  const [oldAtsScore, setOldAtsScore] = useState<number | null>(null);
  const [isLoadingOldAtsScore, setIsLoadingOldAtsScore] = useState(false);
  const [oldAtsError, setOldAtsError] = useState<string | null>(null);

  // Gap Analysis state
  const [isGapAnalysisRunning, setIsGapAnalysisRunning] = useState(false);
  const [gapAnalysisCompleted, setGapAnalysisCompleted] = useState(false);
  const [gapAnalysisError, setGapAnalysisError] = useState<string | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<string[]>([]);

  // Editor tab state
  const [activeTab, setActiveTab] = useState<'yaml' | 'form'>('yaml');
  const [formDataInitialized, setFormDataInitialized] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [isFormFieldActive, setIsFormFieldActive] = useState(false);
  const [formEditTimeout, setFormEditTimeout] = useState<NodeJS.Timeout | null>(null);
  const [originalYamlContent, setOriginalYamlContent] = useState<string>('');
  const [yamlWasManuallyEdited, setYamlWasManuallyEdited] = useState(false);
  const [skipInitialFormSync, setSkipInitialFormSync] = useState(false);
  const [justInitializedForm, setJustInitializedForm] = useState(false);

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isResumeFinalized, setIsResumeFinalized] = useState(false);

  const formSteps = [
    { id: 0, title: 'Personal Information', icon: 'User' },
    { id: 1, title: 'Social Networks', icon: 'Link' },
    { id: 2, title: 'Professional Summary', icon: 'FileText' },
    { id: 3, title: 'Work Experience', icon: 'Briefcase' },
    { id: 4, title: 'Projects', icon: 'Rocket' },
    { id: 5, title: 'Education', icon: 'GraduationCap' },
    { id: 6, title: 'Technologies', icon: 'Zap' },
    { id: 7, title: 'Certifications', icon: 'Award' },
    { id: 8, title: 'Achievements', icon: 'Star' }
  ];

  const getIcon = (iconName: string, size: string = "w-4 h-4") => {
    const icons = {
      User,
      Link,
      FileText,
      Briefcase,
      Rocket,
      GraduationCap,
      Zap,
      Award,
      Star
    };
    const IconComponent = icons[iconName as keyof typeof icons];
    return IconComponent ? <IconComponent className={size} /> : null;
  };

  // Form data state
  const [formData, setFormData] = useState({
    personalInfo: {
      name: 'John Doe',
      location: 'New York, NY',
      email: 'john.doe@example.com',
      phone: '',
      website: 'https://johndoe.com'
    },
    socialNetworks: [{
      network: 'GitHub',
      username: 'JohnDoe'
    }],
    summary: ['Experienced software engineer with 5+ years in full-stack development', 'Passionate about creating scalable web applications and user experiences'],
    experience: [{
      company: 'Tech Corp',
      position: 'Senior Software Engineer',
      location: 'New York, NY',
      start_date: '2021-01',
      end_date: 'present',
      highlights: ['Led development of microservices architecture serving 1M+ users', 'Reduced application load time by 40% through optimization', 'Mentored 3 junior developers and conducted code reviews']
    }],
    education: [{
      institution: 'State University',
      area: 'Computer Science',
      degree: 'BTech',
      start_date: '2015-09',
      end_date: '2019-06',
      gpa: '8.0/10.0',
      highlights: []
    }],
    technologies: [{
      label: 'Languages',
      details: 'JavaScript, TypeScript, Python, Java'
    }, {
      label: 'Frameworks',
      details: 'React, Node.js, Express, Django'
    }],
    projects: [{
      name: '',
      summary: '',
      highlights: ['']
    }],
    certifications: [{
      name: 'AWS Certified Solutions Architect',
      date: '2021-05'
    }],
    achievements: [{
      name: 'Some Project',
      date: '2021-09',
      highlights: ['Became employee of the year']
    }]
  });

  // Markdown renderer state
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

  // Available themes
  const themes = [
    { value: 'engineeringClassic', label: 'Engineering Classic', filename: 'engineeringClassic.yaml' },
    { value: 'classicDesign', label: 'Classic Design', filename: 'classicDesign.yaml' },
    { value: 'engineeringDesign', label: 'Engineering Design', filename: 'engineeringDesign.yaml' },
    { value: 'modernDesign', label: 'Modern Design', filename: 'modernDesign.yaml' },
    { value: 'sb2novDesign', label: 'SB2Nov Design', filename: 'sb2novDesign.yaml' }
  ];

  // Load YAML content, JD path, original resume path, and original ATS score from sessionStorage if available
  // Only load from sessionStorage if we're NOT loading a project (no projectId)
  useEffect(() => {
    // Skip sessionStorage loading if we have a projectId (dashboard flow)
    if (projectId) {
      console.log('🔍 ProjectId detected, skipping sessionStorage loading (will load from project API)');
      return;
    }

    const generatedYaml = sessionStorage.getItem('generatedYaml');
    const storedJdPath = sessionStorage.getItem('jobDescriptionPath');
    const storedOriginalResumePath = sessionStorage.getItem('originalResumePath');
    const storedOriginalAtsScore = sessionStorage.getItem('originalAtsScore');

    console.log('📦 Loading from sessionStorage (revamp flow)');
    console.log('Generated YAML from sessionStorage:', generatedYaml ? `${generatedYaml.substring(0, 100)}...` : 'null');
    console.log('Job Description Path from sessionStorage:', storedJdPath);
    console.log('Original Resume Path from sessionStorage:', storedOriginalResumePath);
    console.log('Original ATS Score from sessionStorage:', storedOriginalAtsScore);

    if (generatedYaml) {
      console.log('Generated YAML length:', generatedYaml.length);
      console.log('Generated YAML preview:', generatedYaml.substring(0, 200));
      setYamlContent(generatedYaml);
      console.log('Successfully loaded YAML from sessionStorage');
      // Clear from sessionStorage after loading
      sessionStorage.removeItem('generatedYaml');
    } else {
      console.log('No generated YAML found in sessionStorage');
    }

    if (storedJdPath) {
      setJobDescriptionPath(storedJdPath);
      setHasJobDescription(true);
      console.log('Successfully loaded JD path from sessionStorage:', storedJdPath);
      console.log('✅ Set hasJobDescription to true');
      // Don't clear from sessionStorage immediately - wait until both ATS scores are calculated
      // sessionStorage.removeItem('jobDescriptionPath');
    } else {
      console.log('No job description path found in sessionStorage');
    }

    if (storedOriginalResumePath) {
      setOriginalResumePath(storedOriginalResumePath);
      console.log('Successfully loaded original resume path from sessionStorage:', storedOriginalResumePath);
      // Don't clear from sessionStorage immediately - may be needed for ATS calculations
      // sessionStorage.removeItem('originalResumePath');
    } else {
      console.log('No original resume path found in sessionStorage');
    }

    if (storedOriginalAtsScore) {
      const atsScore = parseFloat(storedOriginalAtsScore);
      if (!isNaN(atsScore)) {
        setOldAtsScore(atsScore);
        console.log('✅ Successfully loaded original ATS score from sessionStorage:', atsScore);
        // Clear from sessionStorage after loading
        sessionStorage.removeItem('originalAtsScore');
      }
    } else {
      console.log('No original ATS score found in sessionStorage');
    }
  }, [projectId]); // Add projectId as dependency

  // Load YAML content from project if project_id is provided
  useEffect(() => {
    const loadProjectYaml = async () => {
      if (projectId && token) {
        try {
          console.log('🏢 Loading project YAML (dashboard flow)');
          console.log(`📁 Project ID: ${projectId}`);
          const response = await fetch(`https://stable-dane-quickly.ngrok-free.app/project/${projectId}/yaml`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'ngrok-skip-browser-warning': 'true',
            },
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Successfully loaded project YAML:', data.yaml_content?.substring(0, 200));
            console.log('📊 Existing ATS score:', data.ats_score);

            console.log('🔄 Setting YAML content from project...');
            setYamlContent(data.yaml_content);

            // Set existing ATS score if available
            if (data.ats_score !== null && data.ats_score !== undefined) {
              setAtsScore(data.ats_score);
              console.log('✅ Loaded existing ATS score:', data.ats_score);
            }

            // Mark project data as loaded
            setIsProjectDataLoaded(true);

            // Enable ATS scoring for projects loaded from cloud
            setHasJobDescription(true);
          } else {
            console.error('Failed to load project YAML:', response.statusText);
          }
        } catch (error) {
          console.error('Error loading project YAML:', error);
        } finally {
          // Mark project loading as complete
          setIsLoadingProject(false);
        }
      } else {
        // No project ID, so not loading from project
        setIsLoadingProject(false);
        // For new resumes, data is considered loaded immediately
        setIsProjectDataLoaded(true);
      }
    };

    loadProjectYaml();
  }, [projectId, token]);

  // Function to toggle auto-render
  const toggleAutoRender = () => {
    setAutoRenderEnabled(!autoRenderEnabled);
  };

  // Gap Analysis function
  const runGapAnalysis = async () => {
    if (!originalResumePath || !jobDescriptionPath) {
      setGapAnalysisError('Missing resume or job description path');
      return;
    }

    setIsGapAnalysisRunning(true);
    setGapAnalysisError(null);
    setGapAnalysisCompleted(false);

    try {
      console.log('🔍 Starting gap analysis...');
      console.log('🔍 Resume path:', originalResumePath);
      console.log('🔍 JD path:', jobDescriptionPath);

      let currentProjectId = projectId;

      // If this is a session-based project (no projectId), create a project first
      if (!projectId && token) {
        try {
          console.log('🔍 Creating project for session-based gap analysis...');

          const createProjectData = {
            job_role: selectedTheme || 'Gap Analysis Project',
            target_company: 'N/A',
            yaml_content: yamlContent || '# Generated from gap analysis session',
          };

          const createResponse = await fetch('https://stable-dane-quickly.ngrok-free.app/create-project', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'ngrok-skip-browser-warning': 'true',
            },
            body: JSON.stringify(createProjectData),
          });

          if (createResponse.ok) {
            const projectResult = await createResponse.json();
            currentProjectId = projectResult.project_id;
            console.log('✅ Created project for gap analysis:', currentProjectId);
          } else {
            console.log('⚠️ Failed to create project, proceeding without cloud storage');
          }
        } catch (createError) {
          console.log('⚠️ Error creating project:', createError);
        }
      }

      const formData = new FormData();
      formData.append('originalResumePath', originalResumePath);
      formData.append('jobDescriptionPath', jobDescriptionPath);
      if (currentProjectId) {
        formData.append('project_id', currentProjectId);
      }

      const response = await fetch('https://stable-dane-quickly.ngrok-free.app/run-gap-analysis', {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Gap analysis completed:', result);
        setGapAnalysisCompleted(true);
        setGeneratedFiles(result.generated_files || []);
        setGapAnalysisError(null);

        if (result.cloud_uploaded) {
          console.log('✅ Gap analysis files uploaded to cloud storage');
        }
      } else {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        console.error('❌ Gap analysis failed:', errorData);
        setGapAnalysisError(errorData.detail || 'Gap analysis failed');
      }
    } catch (error) {
      console.error('Error running gap analysis:', error);
      setGapAnalysisError('Network error while running gap analysis');
    } finally {
      setIsGapAnalysisRunning(false);
    }
  };

  const showGapAnalysisContent = async (fileType: string) => {
    try {
      // Set loading state
      setMarkdownModal(prev => ({
        ...prev,
        isOpen: true,
        isLoading: true,
        title: "Loading...",
        content: "",
      }));

      console.log('🔍 Fetching gap analysis content:', fileType);
      const url = projectId
        ? `https://stable-dane-quickly.ngrok-free.app/get-gap-analysis-content/${fileType}?project_id=${projectId}`
        : `https://stable-dane-quickly.ngrok-free.app/get-gap-analysis-content/${fileType}`;
      const response = await fetch(url, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Gap analysis content received:', data.title);

        setMarkdownModal({
          isOpen: true,
          isLoading: false,
          title: data.title,
          content: data.content,
        });
      } else {
        console.error('❌ Failed to fetch gap analysis content:', response.statusText);
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));

        setMarkdownModal({
          isOpen: true,
          isLoading: false,
          title: "Error",
          content: `**Error loading content:** ${errorData.detail || response.statusText}`,
        });
      }
    } catch (error) {
      console.error('Error fetching gap analysis content:', error);
      setMarkdownModal({
        isOpen: true,
        isLoading: false,
        title: "Error",
        content: `**Network Error:** ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
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

  // Step navigation functions
  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0: // Personal Information
        return formData.personalInfo.name.trim() !== '' && formData.personalInfo.email.trim() !== '';
      case 1: // Social Networks (optional)
        return true;
      case 2: // Professional Summary
        return formData.summary.some(item => item.trim() !== '');
      case 3: // Work Experience
        return formData.experience.some(exp => exp.company.trim() !== '' && exp.position.trim() !== '');
      case 4: // Projects (optional)
        return true;
      case 5: // Education
        return formData.education.some(edu => edu.institution.trim() !== '');
      case 6: // Technologies
        return formData.technologies.some(tech => tech.label.trim() !== '' && tech.details.trim() !== '');
      case 7: // Certifications (optional)
        return true;
      case 8: // Achievements (optional)
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCompletedSteps(prev => new Set([...Array.from(prev), currentStep]));
      if (currentStep < formSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      alert('Please fill in required fields before proceeding.');
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    // Temporarily allow all steps for debugging
    setCurrentStep(stepIndex);
  };

  const finalizeResume = () => {
    // Mark the current step (8) as completed
    setCompletedSteps(prev => new Set([...Array.from(prev), currentStep]));
    // Mark resume as finalized
    setIsResumeFinalized(true);

    // Trigger confetti bursts from bottom corners
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Left bottom corner burst
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#FDBA2F', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444']
      });

      // Right bottom corner burst
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#FDBA2F', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444']
      });
    }, 250);
  };

  // Function to handle theme change
  const handleThemeChange = (newTheme: string) => {
    console.log('Theme changed to:', newTheme);
    setSelectedTheme(newTheme);
    setLastUserSelectedTheme(newTheme); // Track user's explicit selection
    // If auto-render is enabled, render immediately with new theme
    if (autoRenderEnabled && yamlContent.trim() !== '') {
      renderResume(newTheme); // Pass the new theme directly to avoid closure issues
    }
  };

  // Track the last theme that was explicitly set by the user
  const [lastUserSelectedTheme, setLastUserSelectedTheme] = useState<string>('engineeringClassic');
  // Flag to prevent theme updates during sync
  const [isUpdatingThemeFromYaml, setIsUpdatingThemeFromYaml] = useState<boolean>(false);

  // Function to get ATS score for session-based projects (using PDF blob and JD path)
  const getSessionAtsScore = async (resumeBlob: Blob) => {
    console.log('🔍 getSessionAtsScore called');
    console.log('🔍 hasJobDescription:', hasJobDescription);
    console.log('🔍 jobDescriptionPath:', jobDescriptionPath);

    if (!hasJobDescription || !jobDescriptionPath) {
      console.log('❌ Missing requirements for session-based ATS score');
      setAtsError('Missing job description for ATS calculation');
      return;
    }

    setIsLoadingAtsScore(true);
    setAtsError(null);

    try {
      console.log('🔍 Session ATS: Calculating score with blob and JD path');
      console.log('🔍 Session ATS: Job description path:', jobDescriptionPath);

      const formData = new FormData();
      formData.append('resumeFile', resumeBlob, 'current_resume.pdf');
      formData.append('jobDescriptionPath', jobDescriptionPath);

      console.log('🔍 Session ATS: Making request to /get-ats-score-with-stored-jd');
      console.log('🔍 Session ATS: Resume blob size:', resumeBlob.size);
      console.log('🔍 Session ATS: JD path:', jobDescriptionPath);

      const response = await fetch('https://stable-dane-quickly.ngrok-free.app/get-ats-score-with-stored-jd', {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
        body: formData,
      });

      console.log('🔍 Session ATS: Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Session ATS score calculated:', result.ats_score);
        setAtsScore(result.ats_score);
        setAtsError(null);

        // Clean up sessionStorage after successful ATS calculation
        sessionStorage.removeItem('jobDescriptionPath');
        console.log('🧹 Cleaned up jobDescriptionPath from sessionStorage');
      } else {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        console.error('❌ Session ATS calculation failed:', errorData);
        setAtsError(errorData.detail || 'Failed to calculate ATS score');
      }
    } catch (error) {
      console.error('Error calculating session ATS score:', error);
      setAtsError('Network error while calculating ATS score');
    } finally {
      setIsLoadingAtsScore(false);
    }
  };


  // Function to convert form data to YAML
  const convertFormToYaml = () => {
    const yaml = `# RenderCV Resume Configuration
cv:
  name: ${formData.personalInfo.name}
  location: ${formData.personalInfo.location}
  email: ${formData.personalInfo.email}
  phone: ${formData.personalInfo.phone}
  website: ${formData.personalInfo.website}${formData.socialNetworks.some(sn => sn.network.trim() && sn.username.trim()) ? `

  social_networks:${formData.socialNetworks.filter(sn => sn.network.trim() && sn.username.trim()).map(sn => `
    - network: '${sn.network}'
      username: ${sn.username}`).join('')}` : ''}

  sections:
    summary:${formData.summary.map(item => `\n      - ${item}`).join('')}

    experience:${formData.experience.map(exp => `
      - company: ${exp.company}
        position: ${exp.position}
        location: ${exp.location}
        start_date: ${exp.start_date}
        end_date: ${exp.end_date}
        highlights:${exp.highlights.map(h => `\n          - ${h}`).join('')}`).join('')}${formData.projects.some(p => p.name.trim()) ? `

    projects:${formData.projects.filter(p => p.name.trim()).map(proj => `
      - name: ${proj.name}${proj.summary.trim() ? `\n        summary: ${proj.summary}` : ''}${proj.highlights.some(h => h.trim()) ? `\n        highlights:${proj.highlights.filter(h => h.trim()).map(h => `\n          - ${h}`).join('')}` : ''}`).join('')}` : ''}

    education:${formData.education.map(edu => `
      - institution: ${edu.institution}
        area: ${edu.area}
        degree: ${edu.degree}
        start_date: ${edu.start_date}
        end_date: ${edu.end_date}${edu.gpa && (edu.gpa as string).trim() ? `\n        highlights:\n          - 'CGPA: ${edu.gpa}'` : ''}${edu.highlights && (edu.highlights as string[]).some(h => (h as string).trim()) ? `${edu.gpa && (edu.gpa as string).trim() ? '' : '\n        highlights:'}${(edu.highlights as string[]).filter(h => (h as string).trim()).map(h => `\n          - '${h}'`).join('')}` : ''}`).join('')}

    technologies:${formData.technologies.map(tech => `
      - label: ${tech.label}
        details: ${tech.details}`).join('')}${formData.certifications.some(cert => cert.name.trim()) ? `

    Certifications:${formData.certifications.filter(cert => cert.name.trim()).map(cert => `
      - name: ${cert.name}
        date: ${cert.date}`).join('')}` : ''}${formData.achievements.some(ach => ach.name.trim()) ? `

    Achievment:${formData.achievements.filter(ach => ach.name.trim()).map(ach => `
      - name: ${ach.name}
        date: ${ach.date}${ach.highlights.some(h => h.trim()) ? `\n        highlights:${ach.highlights.filter(h => h.trim()).map(h => `\n          - ${h}`).join('')}` : ''}`).join('')}` : ''}`;

    return yaml;
  };

  // Flexible field mapping system to handle various naming conventions
  const getFlexibleField = (sections: any, ...possibleNames: string[]) => {
    for (const name of possibleNames) {
      if (sections[name]) {
        return sections[name];
      }
    }
    return null;
  };

  // Function to convert YAML to form data
  const convertYamlToForm = (yamlString: string) => {
    try {
      const parsedYaml = yaml.load(yamlString) as any;

      if (!parsedYaml || !parsedYaml.cv) {
        console.warn('Invalid YAML structure: missing cv section');
        return;
      }

      const cv = parsedYaml.cv;
      const design = parsedYaml.design;
      const sections = cv.sections || {};

      // Update form data from YAML
      const newFormData = {
        personalInfo: {
          name: cv.name || '',
          location: cv.location || '',
          email: cv.email || '',
          phone: cv.phone || '',
          website: cv.website || ''
        },
        socialNetworks: cv.social_networks ? cv.social_networks.map((sn: any) => ({
          network: sn.network || '',
          username: sn.username || ''
        })) : [{ network: '', username: '' }],
        summary: getFlexibleField(sections, 'summary', 'Summary') || [''],
        experience: (() => {
          const expData = getFlexibleField(sections, 'experience', 'Experience', 'work_experience', 'Work Experience');
          return expData ? expData.map((exp: any) => ({
            company: exp.company || '',
            position: exp.position || '',
            location: exp.location || '',
            start_date: exp.start_date || '',
            end_date: exp.end_date || '',
            highlights: exp.highlights || ['']
          })) : [{
            company: '',
            position: '',
            location: '',
            start_date: '',
            end_date: '',
            highlights: ['']
          }];
        })(),
        projects: (() => {
          const projData = getFlexibleField(sections, 'projects', 'Projects');
          return projData ? projData.map((proj: any) => ({
            name: proj.name || '',
            summary: proj.summary || '',
            highlights: proj.highlights || ['']
          })) : [{
            name: '',
            summary: '',
            highlights: ['']
          }];
        })(),
        education: (() => {
          const eduData = getFlexibleField(sections, 'education', 'Education');
          return eduData ? eduData.map((edu: any) => ({
            institution: edu.institution || '',
            area: edu.area || '',
            degree: edu.degree || '',
            start_date: edu.start_date || '',
            end_date: edu.end_date || '',
            gpa: edu.highlights?.find((h: string) => h.includes('CGPA:') || h.includes('GPA:'))?.replace(/CGPA:\s*|GPA:\s*|'/g, '') || '',
            highlights: edu.highlights?.filter((h: string) => !h.includes('CGPA:') && !h.includes('GPA:')) || []
          })) : [{
            institution: '',
            area: '',
            degree: '',
            start_date: '',
            end_date: '',
            gpa: '',
            highlights: []
          }];
        })(),
        technologies: (() => {
          const techData = getFlexibleField(sections, 'technologies', 'Technologies', 'skills', 'Skills', 'Skills & Abilities', 'skills_abilities');
          return techData ? techData.map((tech: any) => ({
            label: tech.label || '',
            details: tech.details || ''
          })) : [{
            label: '',
            details: ''
          }];
        })(),
        certifications: (() => {
          const certData = getFlexibleField(sections, 'certifications', 'Certifications');
          return certData ? certData.map((cert: any) => ({
            name: cert.name || '',
            date: cert.date || ''
          })) : [{
            name: '',
            date: ''
          }];
        })(),
        achievements: (() => {
          const achData = getFlexibleField(sections, 'achievements', 'Achievements', 'achievment', 'Achievment');
          return achData ? achData.map((ach: any) => ({
            name: ach.name || '',
            date: ach.date || '',
            highlights: ach.highlights || ['']
          })) : [{
            name: '',
            date: '',
            highlights: ['']
          }];
        })()
      };

      setFormData(newFormData);
      setFormDataInitialized(true);
      setJustInitializedForm(true);

      // Skip the initial sync that would happen after form initialization
      setSkipInitialFormSync(true);
      setTimeout(() => {
        setSkipInitialFormSync(false);
      }, 200);

      // Clear the just initialized flag after a longer delay
      setTimeout(() => {
        setJustInitializedForm(false);
      }, 500);

      // Update theme if present and not explicitly set by user
      if (design?.theme && !isUpdatingThemeFromYaml) {
                setSelectedTheme(design.theme);
        setLastUserSelectedTheme(design.theme);
      }

    } catch (error) {
      console.warn('Error parsing YAML:', error);
    }
  };

  // Function to get ATS score using cloud-based project data
  const getAtsScore = async (resumeBlob?: Blob) => {
    // For cloud-based projects
    if (projectId && token) {
      setIsLoadingAtsScore(true);
      setAtsError(null);

      try {
        console.log(`Calculating ATS score for project: ${projectId}`);

        // Send current YAML content to get ATS score
        const formData = new FormData();
        formData.append('yaml_content', yamlContent);

        const response = await fetch(`https://stable-dane-quickly.ngrok-free.app/project/${projectId}/calculate-ats`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ ATS score calculated:', result.ats_score);
          setAtsScore(result.ats_score);
          setAtsError(null);
        } else {
          const errorData = await response.json().catch(() => ({ detail: response.statusText }));
          console.error('❌ ATS calculation failed:', errorData);
          setAtsError(errorData.detail || 'Failed to calculate ATS score');
        }
      } catch (error) {
        console.error('Error calculating ATS score:', error);
        setAtsError('Network error while calculating ATS score');
      } finally {
        setIsLoadingAtsScore(false);
      }
      return;
    }

    // For session-based projects
    if (resumeBlob && hasJobDescription && jobDescriptionPath) {
      console.log('🔍 Session-based project detected, using getSessionAtsScore');
      console.log('🔍 hasJobDescription:', hasJobDescription);
      console.log('🔍 jobDescriptionPath:', jobDescriptionPath);
      await getSessionAtsScore(resumeBlob);
      return;
    }

    console.log('❌ No suitable ATS calculation method available');
    console.log('🔍 Debug info:');
    console.log('  - projectId:', projectId);
    console.log('  - token:', token ? 'present' : 'missing');
    console.log('  - resumeBlob:', resumeBlob ? 'present' : 'missing');
    console.log('  - hasJobDescription:', hasJobDescription);
    console.log('  - jobDescriptionPath:', jobDescriptionPath);
  };

  // Function to get old resume ATS score (only for legacy sessionStorage workflow)
  const getOldAtsScore = async () => {
    // Skip for cloud-based projects - they don't have originalResumePath
    if (projectId) {
      console.log('Cloud-based project detected, skipping old ATS score calculation');
      return;
    }

    if (!hasJobDescription || !jobDescriptionPath || !originalResumePath) {
      console.log('No job description or original resume available, skipping old ATS score');
      return;
    }

    setIsLoadingOldAtsScore(true);
    setOldAtsError(null);

    try {
      console.log('🔍 Frontend: Getting original ATS score...');
      console.log('🔍 Frontend: Original resume path:', originalResumePath);
      console.log('🔍 Frontend: Job description path:', jobDescriptionPath);

      const formData = new FormData();
      formData.append('originalResumePath', originalResumePath);
      formData.append('jobDescriptionPath', jobDescriptionPath);

      const atsResponse = await fetch('https://stable-dane-quickly.ngrok-free.app/get-original-ats-score', {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
        body: formData,
      });

      if (atsResponse.ok) {
        const result = await atsResponse.json();
        console.log('🔍 Frontend: Original ATS response:', result);

        if (result.success) {
          setOldAtsScore(result.ats_score);
          setOldAtsError(null);
          console.log('✅ Frontend: Original ATS score set to:', result.ats_score);
        } else {
          const errorMessage = result.error || 'Failed to get old resume ATS score';
          setOldAtsError(errorMessage);
          console.error('❌ Frontend: ATS calculation failed:', result.error);
          console.error('❌ Frontend: Full error response:', result);
        }
      } else {
        console.error('❌ Frontend: HTTP error status:', atsResponse.status);
        console.error('❌ Frontend: HTTP error status text:', atsResponse.statusText);

        try {
          const errorData = await atsResponse.json();
          console.error('❌ Frontend: Error response body:', errorData);
          setOldAtsError(errorData.detail || `HTTP ${atsResponse.status}: ${atsResponse.statusText}`);
        } catch (parseError) {
          console.error('❌ Frontend: Could not parse error response:', parseError);
          setOldAtsError(`HTTP ${atsResponse.status}: ${atsResponse.statusText}`);
        }
      }
    } catch (error) {
      console.error('Error getting old resume ATS score:', error);
      setOldAtsError('Network error while getting old resume ATS score');
    } finally {
      setIsLoadingOldAtsScore(false);
    }
  };

  // Render function using FastAPI endpoint
  const renderResume = async (themeOverride?: string) => {
    const themeToUse = themeOverride || selectedTheme;
    console.log('🔍 RENDER DEBUG:');
    console.log('   - themeOverride:', themeOverride);
    console.log('   - selectedTheme state:', selectedTheme);
    console.log('   - themeToUse (final):', themeToUse);
    console.log('   - typeof themeToUse:', typeof themeToUse);

    setIsRendering(true);
    setError(null);

    try {
      // Clean up previous PDF URL
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }

      console.log('Attempting to render resume via FastAPI...');
      console.log('🎨 Frontend sending theme:', themeToUse);
      console.log('📝 YAML content length:', yamlContent.length);

      const requestBody = {
        yamlContent,
        theme: themeToUse
      };
      console.log('📦 Request payload theme:', requestBody.theme);
      console.log('📦 Request payload YAML length:', requestBody.yamlContent.length);

      const response = await fetch('https://stable-dane-quickly.ngrok-free.app/render-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        console.log('FastAPI response OK, creating blob...');
        const blob = await response.blob();
        console.log('Blob created, size:', blob.size);

        // Add timestamp to force browser to reload PDF
        const url = URL.createObjectURL(blob);
        const timestamp = Date.now();
        const urlWithTimestamp = `${url}#${timestamp}`;

        setPdfUrl(urlWithTimestamp);
        setError(null);
        setRenderKey(prev => prev + 1); // Force iframe reload
        setPdfRenderReady(true); // Mark PDF as ready
        console.log('PDF URL set successfully with theme:', themeToUse);
        console.log('PDF blob size:', blob.size, 'bytes');

        // Hide loading overlay when PDF is ready
        setShowInitialLoadingOverlay(false);

        // Get ATS score after successful rendering
        await getAtsScore(blob);

        return;
      } else {
        let errorMessage = 'Unknown error';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.error || response.statusText;
        } catch {
          errorMessage = response.statusText;
        }
        setError(`Render error: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Render failed:', error);
      setError('Failed to render resume. Make sure FastAPI server is running on port 8000.');
    } finally {
      setIsRendering(false);
    }
  };

  // Effect to handle initial loading and delayed PDF rendering
  useEffect(() => {
    console.log('🔄 Loading effect check:', {
      isLoadingProject,
      isProjectDataLoaded,
      autoRenderEnabled,
      hasYamlContent: yamlContent.trim() !== '',
      showInitialLoadingOverlay,
      projectId
    });

    if (!isLoadingProject && isProjectDataLoaded && autoRenderEnabled && yamlContent.trim() !== '') {
      console.log('⏰ Starting 2-second delay before PDF rendering...');
      // Set a delay before rendering the PDF
      const timer = setTimeout(() => {
        console.log('🚀 Now rendering PDF after delay...');
        renderResume();
        // Hide loading overlay after PDF starts rendering (fallback)
        setTimeout(() => {
          console.log('⚠️ Fallback: Hiding loading overlay after 5 seconds...');
          setShowInitialLoadingOverlay(false);
        }, 5000);
      }, 2000); // 2 second delay to ensure YAML is properly loaded

      return () => clearTimeout(timer);
    }
  }, [isLoadingProject, yamlContent, autoRenderEnabled, renderResume]);

  useEffect(() => {
    // Auto-render when YAML content changes (debounced)
    const timeout = setTimeout(() => {
      // Only render if project data is loaded to prevent empty YAML errors
      if (isProjectDataLoaded && autoRenderEnabled && yamlContent !== lastYamlContent && yamlContent.trim() !== '') {
        setLastYamlContent(yamlContent);
        renderResume();
      }
    }, 1000); // 1 second debounce to avoid excessive renders while typing

    return () => clearTimeout(timeout);
  }, [yamlContent, autoRenderEnabled, lastYamlContent, isProjectDataLoaded]);

  useEffect(() => {
    // Auto-render when theme changes (no debounce needed for theme changes)
    if (isProjectDataLoaded && autoRenderEnabled && yamlContent.trim() !== '') {
      renderResume();
    }
  }, [selectedTheme, isProjectDataLoaded]);

  // Store original YAML when it's loaded/changed
  useEffect(() => {
    if (yamlContent && yamlContent !== originalYamlContent) {
      setOriginalYamlContent(yamlContent);
      setYamlWasManuallyEdited(false);
    }
  }, [yamlContent]);

  // Handle YAML changes from editor
  const handleYamlChange = (value: string | undefined) => {
    if (value !== undefined) {
      setYamlContent(value);
      if (value !== originalYamlContent) {
        setYamlWasManuallyEdited(true);
      }
    }
  };

  // Handle form field focus/editing
  const handleFormFieldFocus = () => {
    setIsFormFieldActive(true);
    // Clear any existing timeout
    if (formEditTimeout) {
      clearTimeout(formEditTimeout);
    }
  };

  const handleFormFieldChange = () => {
    setIsFormFieldActive(true);
    // Clear any existing timeout
    if (formEditTimeout) {
      clearTimeout(formEditTimeout);
    }
    // Set a timeout to allow sync after user stops typing
    const timeout = setTimeout(() => {
      setIsFormFieldActive(false);
    }, 1000); // 1 second delay after last change
    setFormEditTimeout(timeout);
  };

  const handleFormFieldBlur = () => {
    // Allow immediate sync when field loses focus
    if (formEditTimeout) {
      clearTimeout(formEditTimeout);
    }
    setTimeout(() => {
      setIsFormFieldActive(false);
    }, 100); // Small delay to prevent flicker
  };

  // Universal form input props to prevent sync loops
  const getFormInputProps = () => ({
    onFocus: handleFormFieldFocus,
    onChange: handleFormFieldChange,
    onBlur: handleFormFieldBlur,
    onInput: handleFormFieldChange, // For additional input events
  });

  // Sync form data to YAML when form changes and form tab is active
  useEffect(() => {
    // Only sync form to YAML when:
    // 1. We're in form tab AND
    // 2. Form has been initialized from YAML (prevents initial overwrite) AND
    // 3. We're not already in the middle of a sync operation AND
    // 4. We're not skipping the initial sync after form initialization AND
    // 5. Either the original YAML was simple OR user manually edited it (indicating they want form sync)
    const shouldSyncFormToYaml = activeTab === 'form' &&
                              formDataInitialized &&
                              !syncInProgress &&
                              !skipInitialFormSync &&
                              !justInitializedForm &&
                              true;

    if (shouldSyncFormToYaml) {
      const newYaml = convertFormToYaml();
      if (newYaml !== yamlContent) {
        setSyncInProgress(true);
        setYamlContent(newYaml);
        setTimeout(() => setSyncInProgress(false), 100);
      }
    }
  }, [formData, activeTab, selectedTheme, formDataInitialized, syncInProgress, skipInitialFormSync, yamlContent, originalYamlContent, yamlWasManuallyEdited]);

  // Sync YAML to form data when YAML changes (but NOT when form fields are being edited)
  useEffect(() => {
    if (yamlContent && yamlContent.trim() && !syncInProgress && !isFormFieldActive) {
      setSyncInProgress(true);
      convertYamlToForm(yamlContent);
      setTimeout(() => setSyncInProgress(false), 100);
    }
  }, [yamlContent, syncInProgress, isFormFieldActive]);

  // Initialize form data when switching to form tab
  useEffect(() => {
    if (activeTab === 'form' && yamlContent && yamlContent.trim() && !formDataInitialized && !syncInProgress) {
      setSyncInProgress(true);
      convertYamlToForm(yamlContent);
      // Don't set formDataInitialized here - let convertYamlToForm do it
      setTimeout(() => setSyncInProgress(false), 100);
    }
  }, [activeTab, yamlContent, formDataInitialized, syncInProgress]);

  // Handle tab switching with complex YAML preservation
  const handleTabSwitch = (tab: 'yaml' | 'form') => {

    // Skip initial sync when switching to form tab
    if (tab === 'form' && activeTab === 'yaml') {
      setSkipInitialFormSync(true);
      setTimeout(() => {
        setSkipInitialFormSync(false);
      }, 300);
    }

    setActiveTab(tab);
  };

  // Get old resume ATS score when component loads with necessary data
  useEffect(() => {
    if (hasJobDescription && originalResumePath && jobDescriptionPath && !oldAtsScore && !projectId) {
      console.log('🔍 Triggering old ATS score calculation...');
      console.log('🔍 hasJobDescription:', hasJobDescription);
      console.log('🔍 originalResumePath:', originalResumePath);
      console.log('🔍 jobDescriptionPath:', jobDescriptionPath);
      console.log('🔍 oldAtsScore:', oldAtsScore);
      console.log('🔍 projectId:', projectId);
      getOldAtsScore();
    }
  }, [hasJobDescription, originalResumePath, jobDescriptionPath, oldAtsScore, projectId]);

  return (
    <div className="min-h-screen bg-vista-white dark:bg-onyx-gray dark:bg-charcoal-black dark:texture-grid-dark text-mine-shaft dark:text-platinum-gray dark:text-platinum-gray">
      {/* Header */}
      <header className="border-b border-mine-shaft/10 dark:border-gray-700 dark:border-gray-800 bg-vista-white dark:bg-onyx-gray/95 dark:bg-charcoal-black/95 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left Section - Branding */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
                <img src="/logo.jpeg" alt="Resume Editor Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-2xl font-bebas tracking-tight text-mine-shaft dark:text-platinum-gray dark:text-platinum-gray">Resume Editor</h1>
                <div className="text-xs text-mine-shaft dark:text-platinum-gray/60 dark:text-platinum-gray/60 font-editorial">Professional Resume Builder</div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-vista-white dark:bg-onyx-gray dark:bg-onyx-gray rounded-full border border-mine-shaft/10 dark:border-gray-700 dark:border-gray-700">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-mine-shaft dark:text-platinum-gray/70 font-sf">resume.yaml</span>
            </div>
          </div>

          {/* Center Section - Key Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* ATS Score */}
            <div className="flex items-center space-x-3 px-4 py-2 bg-vista-white dark:bg-onyx-gray rounded-xl border border-mine-shaft/10 dark:border-gray-700">
              <BarChart3 className="w-4 h-4 text-sunglow" />
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-mine-shaft dark:text-platinum-gray/60 font-sf">ATS:</span>
                  {atsScore !== null ? (
                    <div className={cn(
                      "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
                      atsScore >= 80 ? "bg-green-500/20 text-green-400" :
                      atsScore >= 60 ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    )}>
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        atsScore >= 80 ? "bg-green-400" :
                        atsScore >= 60 ? "bg-yellow-400" :
                        "bg-red-400"
                      )}></div>
                      <span>{atsScore}%</span>
                    </div>
                  ) : isLoadingAtsScore ? (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-xs text-mine-shaft dark:text-platinum-gray/40 font-sf">--</span>
                  )}
                </div>
                {!projectId && oldAtsScore !== null && atsScore !== null && (
                  <div className="flex items-center space-x-1">
                    {atsScore > oldAtsScore ? (
                      <div className="flex items-center space-x-1 text-xs text-emerald-600 font-sf">
                        <span>↑</span>
                        <span>+{(atsScore - oldAtsScore).toFixed(1)}%</span>
                      </div>
                    ) : atsScore < oldAtsScore ? (
                      <div className="flex items-center space-x-1 text-xs text-red-600 font-sf">
                        <span>↓</span>
                        <span>{(atsScore - oldAtsScore).toFixed(1)}%</span>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            {/* Auto-Render Status */}
            <div className="flex items-center space-x-3 px-4 py-2 bg-vista-white dark:bg-onyx-gray rounded-xl border border-mine-shaft/10 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                {autoRenderEnabled ? (
                  <><RefreshCw className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-emerald-600 font-sf font-medium">Auto-Render</span></>
                ) : (
                  <><Pause className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-600 font-sf font-medium">Manual Mode</span></>
                )}
              </div>
              <div className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                autoRenderEnabled ? "bg-emerald-500 animate-pulse" : "bg-yellow-500"
              )}></div>
            </div>

            {/* Theme Selector */}
            <div className="flex items-center space-x-2 px-4 py-2 bg-vista-white dark:bg-onyx-gray rounded-xl border border-mine-shaft/10 dark:border-gray-700">
              <Palette className="w-4 h-4 text-sunglow" />
              <select
                value={selectedTheme}
                onChange={(e) => handleThemeChange(e.target.value)}
                className="bg-vista-white dark:bg-onyx-gray border-none text-sm text-mine-shaft dark:text-platinum-gray font-sf focus:outline-none cursor-pointer"
              >
                {themes.map((theme) => (
                  <option key={theme.value} value={theme.value} className="bg-vista-white dark:bg-onyx-gray">
                    {theme.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Section - Controls */}
          <div className="flex items-center space-x-3">
            {/* Auto-Render Toggle */}
            <BrandButton
              onClick={toggleAutoRender}
              variant={autoRenderEnabled ? "primary" : "secondary"}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border",
                autoRenderEnabled
                  ? "bg-sunglow/20 text-sunglow border-sunglow/30 hover:bg-sunglow/30"
                  : "bg-vista-white dark:bg-onyx-gray text-mine-shaft dark:text-platinum-gray/70 border-mine-shaft/20 dark:border-gray-600 hover:bg-mine-shaft/5"
              )}
            >
              {autoRenderEnabled ? <RefreshCw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="hidden sm:inline">
                {autoRenderEnabled ? "Auto: ON" : "Auto: OFF"}
              </span>
            </BrandButton>

            {/* Render Now Button */}
            <BrandButton
              onClick={() => renderResume()}
              disabled={isRendering}
              variant="primary"
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium shadow-lg"
            >
              {isRendering ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span>{isRendering ? "Rendering..." : "Preview"}</span>
            </BrandButton>

            {/* Settings Menu (Mobile) */}
            <TextButton className="lg:hidden p-2 bg-vista-white dark:bg-onyx-gray rounded-lg border border-mine-shaft/10 dark:border-gray-700 hover:bg-sunglow/5 transition-all duration-200">
              <Settings className="w-4 h-4 text-mine-shaft dark:text-platinum-gray" />
            </TextButton>
          </div>
        </div>
      </header>


      {/* Main Editor Layout */}
      <div className="flex flex-1 mt-6 min-h-0">
        {/* Left Panel - Editor with Tabs */}
        <div className="w-1/2 border-r border-mine-shaft/10 dark:border-gray-700 dark:border-gray-800 bg-vista-white dark:bg-onyx-gray dark:bg-charcoal-black">
          {/* Tab Headers */}
          <div className="flex border-b border-mine-shaft/10 dark:border-gray-700 dark:border-gray-800">
            <BrandButton
              variant={activeTab === 'yaml' ? 'primary' : 'ghost'}
              onClick={() => handleTabSwitch('yaml')}
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium focus:ring-none focus:ring-offset-0 rounded-none border-none focus:border-none",
                activeTab === 'yaml'
                  ? "bg-sunglow text-mine-shaft dark:text-platinum-gray"
                  : "text-mine-shaft dark:text-platinum-gray/60 hover:text-mine-shaft dark:text-platinum-gray hover:bg-mine-shaft/5"
              )}
            >
              <span className="font-sf font-medium">YAML Editor</span>
            </BrandButton>
            <BrandButton
              variant={activeTab === 'form' ? 'primary' : 'ghost'}
              onClick={() => handleTabSwitch('form')}
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium focus:ring-none focus:ring-offset-0 rounded-none border-none focus:border-none",
                activeTab === 'form'
                  ? "bg-sunglow text-mine-shaft dark:text-platinum-gray"
                  : "text-mine-shaft dark:text-platinum-gray/60 hover:text-mine-shaft dark:text-platinum-gray hover:bg-mine-shaft/5"
              )}
            >
              <span className="font-sf font-medium">Form Editor</span>
            </BrandButton>
          </div>

          {/* Tab Content */}
          <div className="h-[calc(100vh-210px)]">
            {activeTab === 'yaml' ? (
              <div className="h-full p-4">
                <div className="h-[calc(100%-2rem)] border border-mine-shaft/10 dark:border-gray-700 rounded-lg overflow-hidden">
                  <MonacoEditor
                    height="100%"
                    defaultLanguage="yaml"
                    value={yamlContent}
                    onChange={handleYamlChange}
                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: "on",
                      renderWhitespace: "selection",
                      tabSize: 2,
                      insertSpaces: true,
                      wordWrap: "on",
                      automaticLayout: true,
                      scrollBeyondLastLine: false,
                      folding: true,
                      bracketPairColorization: { enabled: true },
                      cursorBlinking: "smooth",
                      cursorSmoothCaretAnimation: "on",
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex">

                {/* Sidebar Navigation */}
                <div className="w-80 bg-vista-white dark:bg-onyx-gray border-r border-mine-shaft/10 dark:border-gray-700 flex flex-col">
                  {/* Breadcrumb Trail */}
                  <div className="p-4 border-b border-mine-shaft/10 dark:border-gray-700">
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-mine-shaft dark:text-platinum-gray/40 font-editorial">Resume Builder</span>
                      <span className="text-mine-shaft dark:text-platinum-gray/40">/</span>
                      <span className="text-sunglow font-medium font-sf">{formSteps[currentStep].title}</span>
                    </div>
                  </div>

                  {/* Floating Progress Indicator */}
                  <div className="p-4 border-b border-mine-shaft/10 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-mine-shaft dark:text-platinum-gray font-medium font-sf">Overall Progress</span>
                      <span className="text-sm text-mine-shaft dark:text-platinum-gray/60 font-sf">{Math.round(((Array.from(completedSteps).length) / formSteps.length) * 100)}%</span>
                    </div>
                    <div className="relative">
                      <svg className="w-16 h-16 mx-auto transform -rotate-90" viewBox="0 0 64 64">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          fill="none"
                          stroke="rgb(229 231 235)"
                          strokeWidth="4"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          fill="none"
                          stroke="#FDBA2F"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 28}`}
                          strokeDashoffset={`${2 * Math.PI * 28 * (1 - (Array.from(completedSteps).length) / formSteps.length)}`}
                          className="transition-all duration-500"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-mine-shaft dark:text-platinum-gray font-sf">{Array.from(completedSteps).length}/{formSteps.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Step Navigation List */}
                  <div className="flex-1 overflow-y-auto p-2">
                    {formSteps.map((step, index) => (
                      <button
                        key={step.id}
                        onClick={() => goToStep(index)}
                        className={cn(
                          "w-full p-3 mb-2 rounded-lg text-left transition-all duration-200",
                          index === currentStep
                            ? "bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600/50 text-mine-shaft dark:text-platinum-gray"
                            : completedSteps.has(index)
                            ? "bg-green-600/10 border border-green-500/20 text-green-400 hover:bg-green-600/20 cursor-pointer"
                            : index < currentStep
                            ? "bg-mine-shaft/10 border border-mine-shaft/20 dark:border-gray-600 text-mine-shaft dark:text-platinum-gray/60 hover:bg-sunglow/20/50 cursor-pointer"
                            : "bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 text-mine-shaft dark:text-platinum-gray/60 cursor-not-allowed opacity-60"
                        )}
                        disabled={index > currentStep && !completedSteps.has(index)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium font-sf",
                            index === currentStep
                              ? "bg-sunglow text-mine-shaft dark:text-platinum-gray"
                              : completedSteps.has(index)
                              ? "bg-emerald-500 text-mine-shaft dark:text-platinum-gray"
                              : index < currentStep
                              ? "bg-sunglow/20 text-sunglow border border-sunglow/30"
                              : "bg-sunglow/10 text-sunglow/50 border border-sunglow/20"
                          )}>
                            {completedSteps.has(index) ? "✓" : index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              {getIcon(step.icon)}
                              <span className="font-medium text-sm font-sf">{step.title}</span>
                            </div>
                            {index === currentStep && (
                              <div className="text-xs text-mine-shaft dark:text-platinum-gray/60 mt-1 font-editorial">Currently editing</div>
                            )}
                            {completedSteps.has(index) && index !== currentStep && (
                              <div className="text-xs text-emerald-600/80 mt-1 font-editorial">Completed</div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col bg-vista-white dark:bg-onyx-gray">
                  {/* Header */}
                  <div className="p-6 border-b border-mine-shaft/10 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-sunglow/20 rounded-xl flex items-center justify-center">
                          {getIcon(formSteps[currentStep].icon, "w-6 h-6")}
                        </div>
                        <div>
                          <h2 className="text-2xl text-mine-shaft dark:text-platinum-gray font-bebas tracking-tight">{formSteps[currentStep].title}</h2>
                          <p className="text-mine-shaft dark:text-platinum-gray/60 text-sm font-editorial">Step {currentStep + 1} of {formSteps.length}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-sunglow font-sf">
                          {Math.round(((currentStep + 1) / formSteps.length) * 100)}%
                        </div>
                        <div className="text-xs text-mine-shaft dark:text-platinum-gray/60 font-editorial">Complete</div>
                      </div>
                    </div>
                  </div>

                {/* Step Content */}
                <div className="flex-1 overflow-y-auto p-6 form-scroll">
                  {currentStep === 0 && (
                    <div className="space-y-6">
                      <h4 className="text-xl font-semibold text-mine-shaft dark:text-platinum-gray font-bebas mb-4">Personal Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-mine-shaft dark:text-platinum-gray/70 font-sf mb-2">Full Name *</label>
                          <input
                            type="text"
                            value={formData.personalInfo.name}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                personalInfo: { ...prev.personalInfo, name: e.target.value }
                              }));
                              handleFormFieldChange();
                            }}
                            onFocus={handleFormFieldFocus}
                            onBlur={handleFormFieldBlur}
                            className="w-full px-3 py-2 bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 rounded-lg text-mine-shaft dark:text-platinum-gray focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent"
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-mine-shaft dark:text-platinum-gray/70 font-sf mb-2">Email *</label>
                          <input
                            type="email"
                            value={formData.personalInfo.email}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                personalInfo: { ...prev.personalInfo, email: e.target.value }
                              }));
                              handleFormFieldChange();
                            }}
                            onFocus={handleFormFieldFocus}
                            onBlur={handleFormFieldBlur}
                            className="w-full px-3 py-2 bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 rounded-lg text-mine-shaft dark:text-platinum-gray focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent"
                            placeholder="john@example.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-mine-shaft dark:text-platinum-gray/70 font-sf mb-2">Location</label>
                          <input
                            type="text"
                            value={formData.personalInfo.location}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                personalInfo: { ...prev.personalInfo, location: e.target.value }
                              }));
                              handleFormFieldChange();
                            }}
                            onFocus={handleFormFieldFocus}
                            onBlur={handleFormFieldBlur}
                            className="w-full px-3 py-2 bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 rounded-lg text-mine-shaft dark:text-platinum-gray focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent"
                            placeholder="New York, NY"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-mine-shaft dark:text-platinum-gray/70 font-sf mb-2">Phone</label>
                          <input
                            type="tel"
                            value={formData.personalInfo.phone}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                personalInfo: { ...prev.personalInfo, phone: e.target.value }
                              }));
                              handleFormFieldChange();
                            }}
                            onFocus={handleFormFieldFocus}
                            onBlur={handleFormFieldBlur}
                            className="w-full px-3 py-2 bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 rounded-lg text-mine-shaft dark:text-platinum-gray focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent"
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-mine-shaft dark:text-platinum-gray/70 font-sf mb-2">Website</label>
                          <input
                            type="url"
                            value={formData.personalInfo.website}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                personalInfo: { ...prev.personalInfo, website: e.target.value }
                              }));
                              handleFormFieldChange();
                            }}
                            onFocus={handleFormFieldFocus}
                            onBlur={handleFormFieldBlur}
                            className="w-full px-3 py-2 bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 rounded-lg text-mine-shaft dark:text-platinum-gray focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent"
                            placeholder="https://yourwebsite.com"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <h4 className="text-xl font-semibold text-mine-shaft dark:text-platinum-gray font-bebas mb-4">Social Networks</h4>
                      <p className="text-mine-shaft dark:text-platinum-gray/60 font-editorial mb-4">Add your professional social media profiles and online presence.</p>
                      <div className="space-y-4">
                        {formData.socialNetworks.map((social, index) => (
                          <div key={index} className="bg-vista-white dark:bg-onyx-gray rounded-lg p-4 border border-mine-shaft/10 dark:border-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-mine-shaft dark:text-platinum-gray/70 font-sf mb-2">Network</label>
                                <select
                                  value={social.network}
                                  onChange={(e) => {
                                    const newSocial = [...formData.socialNetworks];
                                    newSocial[index].network = e.target.value;
                                    setFormData(prev => ({ ...prev, socialNetworks: newSocial }));
                                    handleFormFieldChange();
                                  }}
                                  onFocus={handleFormFieldFocus}
                                  onBlur={handleFormFieldBlur}
                                  className="w-full px-3 py-2 bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 rounded-lg text-mine-shaft dark:text-platinum-gray focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent [color-scheme:dark]"
                                >
                                  <option value="GitHub">GitHub</option>
                                  <option value="LinkedIn">LinkedIn</option>
                                  <option value="Twitter">Twitter</option>
                                  <option value="Portfolio">Portfolio</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-mine-shaft dark:text-platinum-gray/70 font-sf mb-2">Username</label>
                                <input
                                  type="text"
                                  value={social.username}
                                  onChange={(e) => {
                                    const newSocial = [...formData.socialNetworks];
                                    newSocial[index].username = e.target.value;
                                    setFormData(prev => ({ ...prev, socialNetworks: newSocial }));
                                    handleFormFieldChange();
                                  }}
                                  onFocus={handleFormFieldFocus}
                                  onBlur={handleFormFieldBlur}
                                  className="w-full px-3 py-2 bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 rounded-lg text-mine-shaft dark:text-platinum-gray focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent [color-scheme:dark]"
                                  placeholder="your-username"
                                />
                              </div>
                            </div>
                            {formData.socialNetworks.length > 1 && (
                              <button
                                onClick={() => {
                                  const newSocial = formData.socialNetworks.filter((_, si) => si !== index);
                                  setFormData(prev => ({ ...prev, socialNetworks: newSocial }));
                                }}
                                className="mt-4 px-3 py-1 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors text-sm"
                              >
                                Remove Network
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            setFormData(prev => ({ ...prev, socialNetworks: [...prev.socialNetworks, {
                              network: 'GitHub', username: 'your-username'
                            }] }));
                            handleFormFieldChange();
                          }}
                          className="px-4 py-2 bg-mine-shaft/10 text-mine-shaft dark:text-platinum-gray/60 border border-mine-shaft/20 dark:border-gray-600 rounded-lg hover:bg-sunglow/20 transition-colors text-sm"
                        >
                          + Add Social Network
                        </button>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <h4 className="text-xl font-semibold text-mine-shaft dark:text-platinum-gray font-bebas mb-4">Professional Summary</h4>
                      {formData.summary.map((item, index) => (
                        <div key={index} className="mb-3 flex">
                          <textarea
                            value={item}
                            onChange={(e) => {
                              const newSummary = [...formData.summary];
                              newSummary[index] = e.target.value;
                              setFormData(prev => ({ ...prev, summary: newSummary }));
                              handleFormFieldChange();
                            }}
                            onFocus={handleFormFieldFocus}
                            onBlur={handleFormFieldBlur}
                            rows={2}
                            className="flex-1 px-3 py-2 bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 rounded-lg text-mine-shaft dark:text-platinum-gray focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent resize-none"
                            placeholder="Professional summary point..."
                          />
                          {formData.summary.length > 1 && (
                            <button
                              onClick={() => {
                                const newSummary = formData.summary.filter((_, i) => i !== index);
                                setFormData(prev => ({ ...prev, summary: newSummary }));
                              }}
                              className="ml-2 px-3 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          setFormData(prev => ({ ...prev, summary: [...prev.summary, 'Professional summary point describing your key skills and experience'] }));
                          handleFormFieldChange();
                        }}
                        className="px-4 py-2 bg-mine-shaft/10 text-mine-shaft dark:text-platinum-gray/60 border border-mine-shaft/20 dark:border-gray-600 rounded-lg hover:bg-sunglow/20 transition-colors text-sm"
                      >
                        + Add Summary Point
                      </button>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <h4 className="text-xl font-semibold text-mine-shaft dark:text-platinum-gray font-bebas mb-4">Work Experience</h4>
                      <div className="space-y-6">
                        {formData.experience.map((exp, index) => (
                          <div key={index} className="bg-vista-white dark:bg-onyx-gray rounded-lg p-4 border border-mine-shaft/10 dark:border-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium text-mine-shaft dark:text-platinum-gray/70 font-sf mb-2">Company *</label>
                                <input
                                  type="text"
                                  value={exp.company}
                                  onChange={(e) => {
                                    const newExp = [...formData.experience];
                                    newExp[index].company = e.target.value;
                                    setFormData(prev => ({ ...prev, experience: newExp }));
                                    handleFormFieldChange();
                                  }}
                                  onFocus={handleFormFieldFocus}
                                  onBlur={handleFormFieldBlur}
                                  className="w-full px-3 py-2 bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 rounded-lg text-mine-shaft dark:text-platinum-gray focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent [color-scheme:dark]"
                                  placeholder="Company Name"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-mine-shaft dark:text-platinum-gray/70 font-sf mb-2">Position *</label>
                                <input
                                  type="text"
                                  value={exp.position}
                                  onChange={(e) => {
                                    const newExp = [...formData.experience];
                                    newExp[index].position = e.target.value;
                                    setFormData(prev => ({ ...prev, experience: newExp }));
                                    handleFormFieldChange();
                                  }}
                                  onFocus={handleFormFieldFocus}
                                  onBlur={handleFormFieldBlur}
                                  className="w-full px-3 py-2 bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 rounded-lg text-mine-shaft dark:text-platinum-gray focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent [color-scheme:dark]"
                                  placeholder="Job Title"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-mine-shaft dark:text-platinum-gray/70 font-sf mb-2">Location</label>
                                <input
                                  type="text"
                                  value={exp.location}
                                  onChange={(e) => {
                                    const newExp = [...formData.experience];
                                    newExp[index].location = e.target.value;
                                    setFormData(prev => ({ ...prev, experience: newExp }));
                                    handleFormFieldChange();
                                  }}
                                  onFocus={handleFormFieldFocus}
                                  onBlur={handleFormFieldBlur}
                                  className="w-full px-3 py-2 bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 rounded-lg text-mine-shaft dark:text-platinum-gray focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent [color-scheme:dark]"
                                  placeholder="City, State"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-mine-shaft dark:text-platinum-gray/70 font-sf mb-2">Start Date</label>
                                  <input
                                    type="month"
                                    value={exp.start_date}
                                    onChange={(e) => {
                                      const newExp = [...formData.experience];
                                      newExp[index].start_date = e.target.value;
                                      setFormData(prev => ({ ...prev, experience: newExp }));
                                      handleFormFieldChange();
                                    }}
                                    onFocus={handleFormFieldFocus}
                                    onBlur={handleFormFieldBlur}
                                    className="w-full px-3 py-2 bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 rounded-lg text-mine-shaft dark:text-platinum-gray focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent [color-scheme:dark]"
                                    placeholder="2021-01"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-mine-shaft dark:text-platinum-gray/70 font-sf mb-2">End Date</label>
                                  <div className="space-y-2">
                                    <input
                                      type="month"
                                      value={exp.end_date === 'present' ? '' : exp.end_date}
                                      onChange={(e) => {
                                        const newExp = [...formData.experience];
                                        newExp[index].end_date = e.target.value;
                                        setFormData(prev => ({ ...prev, experience: newExp }));
                                        handleFormFieldChange();
                                      }}
                                      onFocus={handleFormFieldFocus}
                                      onBlur={handleFormFieldBlur}
                                      disabled={exp.end_date === 'present'}
                                      className="w-full px-3 py-2 bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 rounded-lg text-mine-shaft dark:text-platinum-gray focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed [color-scheme:dark]"
                                      placeholder="2023-12"
                                    />
                                    <label className="flex items-center text-mine-shaft dark:text-platinum-gray/70 font-sf text-sm cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        checked={exp.end_date === 'present'}
                                        onChange={(e) => {
                                          const newExp = [...formData.experience];
                                          newExp[index].end_date = e.target.checked ? 'present' : '';
                                          setFormData(prev => ({ ...prev, experience: newExp }));
                                          handleFormFieldChange();
                                        }}
                                        onFocus={handleFormFieldFocus}
                                        onBlur={handleFormFieldBlur}
                                        className="form-checkbox mr-3"
                                      />
                                      <span className="font-medium">Currently working here</span>
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-mine-shaft dark:text-platinum-gray/70 font-sf mb-2">Key Achievements</label>
                              {exp.highlights.map((highlight, hIndex) => (
                                <div key={hIndex} className="mb-2 flex">
                                  <input
                                    type="text"
                                    value={highlight}
                                    onChange={(e) => {
                                      const newExp = [...formData.experience];
                                      newExp[index].highlights[hIndex] = e.target.value;
                                      setFormData(prev => ({ ...prev, experience: newExp }));
                                      handleFormFieldChange();
                                    }}
                                    onFocus={handleFormFieldFocus}
                                    onBlur={handleFormFieldBlur}
                                    className="flex-1 px-3 py-2 bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 rounded-lg text-mine-shaft dark:text-platinum-gray focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent"
                                    placeholder="Achievement or responsibility..."
                                  />
                                  {exp.highlights.length > 1 && (
                                    <button
                                      onClick={() => {
                                        const newExp = [...formData.experience];
                                        newExp[index].highlights = newExp[index].highlights.filter((_, hi) => hi !== hIndex);
                                        setFormData(prev => ({ ...prev, experience: newExp }));
                                      }}
                                      className="ml-2 px-3 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  const newExp = [...formData.experience];
                                  newExp[index].highlights.push('Achievement or responsibility that demonstrates your impact and skills');
                                  setFormData(prev => ({ ...prev, experience: newExp }));
                                  handleFormFieldChange();
                                }}
                                className="px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-600/30 transition-colors text-sm mr-2"
                              >
                                + Add Achievement
                              </button>
                              {formData.experience.length > 1 && (
                                <button
                                  onClick={() => {
                                    const newExp = formData.experience.filter((_, ei) => ei !== index);
                                    setFormData(prev => ({ ...prev, experience: newExp }));
                                  }}
                                  className="px-3 py-1 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors text-sm"
                                >
                                  Remove Experience
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            setFormData(prev => ({ ...prev, experience: [...prev.experience, {
                              company: 'Company Name', position: 'Job Title', location: 'City, State', start_date: '2023-01', end_date: 'present', highlights: ['Key achievement or responsibility that demonstrates your impact']
                            }] }));
                            handleFormFieldChange();
                          }}
                          className="px-4 py-2 bg-mine-shaft/10 text-mine-shaft dark:text-platinum-gray/60 border border-mine-shaft/20 dark:border-gray-600 rounded-lg hover:bg-sunglow/20 transition-colors text-sm"
                        >
                          + Add Experience
                        </button>
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <h4 className="text-xl font-semibold text-mine-shaft dark:text-platinum-gray font-bebas mb-4">Projects</h4>
                      <p className="text-mine-shaft dark:text-platinum-gray/60 font-editorial mb-4">Add your notable projects, side projects, or portfolio items.</p>
                      <div className="space-y-4">
                        {formData.projects.map((project, index) => (
                          <div key={index} className="bg-vista-white dark:bg-onyx-gray rounded-lg p-4 border border-mine-shaft/10 dark:border-gray-700">
                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-mine-shaft dark:text-platinum-gray/70 font-sf mb-2">Project Name</label>
                                <input
                                  type="text"
                                  value={project.name}
                                  onChange={(e) => {
                                    const newProjects = [...formData.projects];
                                    newProjects[index].name = e.target.value;
                                    setFormData(prev => ({ ...prev, projects: newProjects }));
                                    handleFormFieldChange();
                                  }}
                                  onFocus={handleFormFieldFocus}
                                  onBlur={handleFormFieldBlur}
                                  className="w-full px-3 py-2 bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 rounded-lg text-mine-shaft dark:text-platinum-gray focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent [color-scheme:dark]"
                                  placeholder="My Awesome Project"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-mine-shaft dark:text-platinum-gray/70 font-sf mb-2">Description</label>
                                <textarea
                                  value={project.summary}
                                  onChange={(e) => {
                                    const newProjects = [...formData.projects];
                                    newProjects[index].summary = e.target.value;
                                    setFormData(prev => ({ ...prev, projects: newProjects }));
                                    handleFormFieldChange();
                                  }}
                                  onFocus={handleFormFieldFocus}
                                  onBlur={handleFormFieldBlur}
                                  rows={3}
                                  className="w-full px-3 py-2 bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 rounded-lg text-mine-shaft dark:text-platinum-gray focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent resize-none"
                                  placeholder="Brief project description..."
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-mine-shaft dark:text-platinum-gray/70 font-sf mb-2">Key Highlights</label>
                                {project.highlights.map((highlight, hIndex) => (
                                  <div key={hIndex} className="mb-2 flex">
                                    <input
                                      type="text"
                                      value={highlight}
                                      onChange={(e) => {
                                        const newProjects = [...formData.projects];
                                        newProjects[index].highlights[hIndex] = e.target.value;
                                        setFormData(prev => ({ ...prev, projects: newProjects }));
                                        handleFormFieldChange();
                                      }}
                                      onFocus={handleFormFieldFocus}
                                      onBlur={handleFormFieldBlur}
                                      className="flex-1 px-3 py-2 bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 rounded-lg text-mine-shaft dark:text-platinum-gray focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent"
                                      placeholder="Key achievement or feature..."
                                    />
                                    {project.highlights.length > 1 && (
                                      <button
                                        onClick={() => {
                                          const newProjects = [...formData.projects];
                                          newProjects[index].highlights = newProjects[index].highlights.filter((_, hi) => hi !== hIndex);
                                          setFormData(prev => ({ ...prev, projects: newProjects }));
                                        }}
                                        className="ml-2 px-3 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors"
                                      >
                                        ×
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <button
                                  onClick={() => {
                                    const newProjects = [...formData.projects];
                                    newProjects[index].highlights.push('Key feature or achievement of this project');
                                    setFormData(prev => ({ ...prev, projects: newProjects }));
                                    handleFormFieldChange();
                                  }}
                                  className="px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-600/30 transition-colors text-sm mr-2"
                                >
                                  + Add Highlight
                                </button>
                              </div>
                              {formData.projects.length > 1 && (
                                <button
                                  onClick={() => {
                                    const newProjects = formData.projects.filter((_, pi) => pi !== index);
                                    setFormData(prev => ({ ...prev, projects: newProjects }));
                                  }}
                                  className="px-3 py-1 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors text-sm self-start"
                                >
                                  Remove Project
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            setFormData(prev => ({ ...prev, projects: [...prev.projects, { name: 'Project Name', summary: 'Brief description of the project and your role in it', highlights: ['Key feature or achievement of this project'] }] }));
                            handleFormFieldChange();
                          }}
                          className="px-4 py-2 bg-mine-shaft/10 text-mine-shaft dark:text-platinum-gray/60 border border-mine-shaft/20 dark:border-gray-600 rounded-lg hover:bg-sunglow/20 transition-colors text-sm"
                        >
                          + Add Project
                        </button>
                      </div>
                    </div>
                  )}

                  {currentStep === 5 && (
                    <div className="space-y-6">
                      <h4 className="text-xl font-semibold text-mine-shaft dark:text-platinum-gray font-bebas mb-4">Education</h4>
                      <div className="space-y-4">
                        {formData.education.map((edu, index) => (
                          <div key={index} className="bg-vista-white dark:bg-onyx-gray rounded-lg p-4 border border-mine-shaft/10 dark:border-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-mine-shaft dark:text-platinum-gray/70 font-sf mb-2">Institution *</label>
                                <input
                                  type="text"
                                  value={edu.institution}
                                  onChange={(e) => {
                                    const newEdu = [...formData.education];
                                    newEdu[index].institution = e.target.value;
                                    setFormData(prev => ({ ...prev, education: newEdu }));
                                    handleFormFieldChange();
                                  }}
                                  onFocus={handleFormFieldFocus}
                                  onBlur={handleFormFieldBlur}
                                  className="w-full px-3 py-2 bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 rounded-lg text-mine-shaft dark:text-platinum-gray focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent [color-scheme:dark]"
                                  placeholder="University Name"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-mine-shaft dark:text-platinum-gray/70 font-sf mb-2">Degree</label>
                                <input
                                  type="text"
                                  value={edu.degree}
                                  onChange={(e) => {
                                    const newEdu = [...formData.education];
                                    newEdu[index].degree = e.target.value;
                                    setFormData(prev => ({ ...prev, education: newEdu }));
                                    handleFormFieldChange();
                                  }}
                                  onFocus={handleFormFieldFocus}
                                  onBlur={handleFormFieldBlur}
                                  className="w-full px-3 py-2 bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 rounded-lg text-mine-shaft dark:text-platinum-gray focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent [color-scheme:dark]"
                                  placeholder="BTech"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-mine-shaft dark:text-platinum-gray/70 font-sf mb-2">Field of Study</label>
                                <input
                                  type="text"
                                  value={edu.area}
                                  onChange={(e) => {
                                    const newEdu = [...formData.education];
                                    newEdu[index].area = e.target.value;
                                    setFormData(prev => ({ ...prev, education: newEdu }));
                                    handleFormFieldChange();
                                  }}
                                  onFocus={handleFormFieldFocus}
                                  onBlur={handleFormFieldBlur}
                                  className="w-full px-3 py-2 bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 rounded-lg text-mine-shaft dark:text-platinum-gray focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent [color-scheme:dark]"
                                  placeholder="Computer Science"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-mine-shaft dark:text-platinum-gray/70 font-sf mb-2">CGPA/GPA</label>
                                <input
                                  type="text"
                                  value={edu.gpa || ''}
                                  onChange={(e) => {
                                    const newEdu = [...formData.education];
                                    newEdu[index].gpa = e.target.value;
                                    setFormData(prev => ({ ...prev, education: newEdu }));
                                    handleFormFieldChange();
                                  }}
                                  onFocus={handleFormFieldFocus}
                                  onBlur={handleFormFieldBlur}
                                  className="w-full px-3 py-2 bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 rounded-lg text-mine-shaft dark:text-platinum-gray focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent [color-scheme:dark]"
                                  placeholder="8.0/10.0 or 3.8/4.0"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-sm font-medium text-mine-shaft dark:text-platinum-gray/70 font-sf mb-2">Start Date</label>
                                  <input
                                    type="month"
                                    value={edu.start_date}
                                    onChange={(e) => {
                                      const newEdu = [...formData.education];
                                      newEdu[index].start_date = e.target.value;
                                      setFormData(prev => ({ ...prev, education: newEdu }));
                                      handleFormFieldChange();
                                    }}
                                    onFocus={handleFormFieldFocus}
                                    onBlur={handleFormFieldBlur}
                                    className="w-full px-3 py-2 bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 rounded-lg text-mine-shaft dark:text-platinum-gray focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent [color-scheme:dark]"
                                    placeholder="2015-09"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-mine-shaft dark:text-platinum-gray/70 font-sf mb-2">End Date</label>
                                  <input
                                    type="month"
                                    value={edu.end_date}
                                    onChange={(e) => {
                                      const newEdu = [...formData.education];
                                      newEdu[index].end_date = e.target.value;
                                      setFormData(prev => ({ ...prev, education: newEdu }));
                                      handleFormFieldChange();
                                    }}
                                    onFocus={handleFormFieldFocus}
                                    onBlur={handleFormFieldBlur}
                                    className="w-full px-3 py-2 bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 rounded-lg text-mine-shaft dark:text-platinum-gray focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent [color-scheme:dark]"
                                    placeholder="2019-06"
                                  />
                                </div>
                              </div>
                            </div>
                            {formData.education.length > 1 && (
                              <button
                                onClick={() => {
                                  const newEdu = formData.education.filter((_, ei) => ei !== index);
                                  setFormData(prev => ({ ...prev, education: newEdu }));
                                }}
                                className="mt-4 px-3 py-1 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors text-sm"
                              >
                                Remove Education
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            setFormData(prev => ({ ...prev, education: [...prev.education, {
                              institution: 'University Name', area: 'Computer Science', degree: 'Bachelor of Science', start_date: '2019-09', end_date: '2023-06', gpa: '3.8/4.0', highlights: []
                            }] }));
                            handleFormFieldChange();
                          }}
                          className="px-4 py-2 bg-mine-shaft/10 text-mine-shaft dark:text-platinum-gray/60 border border-mine-shaft/20 dark:border-gray-600 rounded-lg hover:bg-sunglow/20 transition-colors text-sm"
                        >
                          + Add Education
                        </button>
                      </div>
                    </div>
                  )}

                  {currentStep === 6 && (
                    <div className="space-y-6">
                      <h4 className="text-xl font-semibold text-mine-shaft dark:text-platinum-gray font-bebas mb-4">Technologies</h4>
                      <div className="space-y-4">
                        {formData.technologies.map((tech, index) => (
                          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-mine-shaft dark:text-platinum-gray/70 font-sf mb-2">Category</label>
                              <input
                                type="text"
                                value={tech.label}
                                onChange={(e) => {
                                  const newTech = [...formData.technologies];
                                  newTech[index].label = e.target.value;
                                  setFormData(prev => ({ ...prev, technologies: newTech }));
                                  handleFormFieldChange();
                                }}
                                onFocus={handleFormFieldFocus}
                                onBlur={handleFormFieldBlur}
                                className="w-full px-3 py-2 bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 rounded-lg text-mine-shaft dark:text-platinum-gray focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent"
                                placeholder="Languages"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-mine-shaft dark:text-platinum-gray/70 font-sf mb-2">Technologies</label>
                              <div className="flex">
                                <input
                                  type="text"
                                  value={tech.details}
                                  onChange={(e) => {
                                    const newTech = [...formData.technologies];
                                    newTech[index].details = e.target.value;
                                    setFormData(prev => ({ ...prev, technologies: newTech }));
                                    handleFormFieldChange();
                                  }}
                                  onFocus={handleFormFieldFocus}
                                  onBlur={handleFormFieldBlur}
                                  className="flex-1 px-3 py-2 bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 rounded-lg text-mine-shaft dark:text-platinum-gray focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent"
                                  placeholder="JavaScript, TypeScript, Python"
                                />
                                {formData.technologies.length > 1 && (
                                  <button
                                    onClick={() => {
                                      const newTech = formData.technologies.filter((_, i) => i !== index);
                                      setFormData(prev => ({ ...prev, technologies: newTech }));
                                    }}
                                    className="ml-2 px-3 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            setFormData(prev => ({ ...prev, technologies: [...prev.technologies, { label: 'Category Name', details: 'Technology, Framework, Tool' }] }));
                            handleFormFieldChange();
                          }}
                          className="px-4 py-2 bg-mine-shaft/10 text-mine-shaft dark:text-platinum-gray/60 border border-mine-shaft/20 dark:border-gray-600 rounded-lg hover:bg-sunglow/20 transition-colors text-sm"
                        >
                          + Add Technology Category
                        </button>
                      </div>
                    </div>
                  )}

                  {currentStep === 7 && (
                    <div className="space-y-6">
                      <h4 className="text-xl font-semibold text-mine-shaft dark:text-platinum-gray font-bebas mb-4">Certifications</h4>
                      <p className="text-mine-shaft dark:text-platinum-gray/60 font-editorial mb-4">Add your professional certifications, licenses, or credentials.</p>
                      <div className="space-y-4">
                        {formData.certifications.map((cert, index) => (
                          <div key={index} className="bg-vista-white dark:bg-onyx-gray rounded-lg p-4 border border-mine-shaft/10 dark:border-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-mine-shaft dark:text-platinum-gray/70 font-sf mb-2">Certification Name</label>
                                <input
                                  type="text"
                                  value={cert.name}
                                  onChange={(e) => {
                                    const newCerts = [...formData.certifications];
                                    newCerts[index].name = e.target.value;
                                    setFormData(prev => ({ ...prev, certifications: newCerts }));
                                    handleFormFieldChange();
                                  }}
                                  onFocus={handleFormFieldFocus}
                                  onBlur={handleFormFieldBlur}
                                  className="w-full px-3 py-2 bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 rounded-lg text-mine-shaft dark:text-platinum-gray focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent [color-scheme:dark]"
                                  placeholder="AWS Certified Solutions Architect"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-mine-shaft dark:text-platinum-gray/70 font-sf mb-2">Date Issued</label>
                                <input
                                  type="month"
                                  value={cert.date}
                                  onChange={(e) => {
                                    const newCerts = [...formData.certifications];
                                    newCerts[index].date = e.target.value;
                                    setFormData(prev => ({ ...prev, certifications: newCerts }));
                                    handleFormFieldChange();
                                  }}
                                  onFocus={handleFormFieldFocus}
                                  onBlur={handleFormFieldBlur}
                                  className="w-full px-3 py-2 bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 rounded-lg text-mine-shaft dark:text-platinum-gray focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent [color-scheme:dark]"
                                  placeholder="2021-05"
                                />
                              </div>
                            </div>
                            {formData.certifications.length > 1 && (
                              <button
                                onClick={() => {
                                  const newCerts = formData.certifications.filter((_, ci) => ci !== index);
                                  setFormData(prev => ({ ...prev, certifications: newCerts }));
                                }}
                                className="mt-4 px-3 py-1 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors text-sm"
                              >
                                Remove Certification
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            setFormData(prev => ({ ...prev, certifications: [...prev.certifications, { name: 'Certification Name', date: '2024-01' }] }));
                            handleFormFieldChange();
                          }}
                          className="px-4 py-2 bg-mine-shaft/10 text-mine-shaft dark:text-platinum-gray/60 border border-mine-shaft/20 dark:border-gray-600 rounded-lg hover:bg-sunglow/20 transition-colors text-sm"
                        >
                          + Add Certification
                        </button>
                      </div>
                    </div>
                  )}

                  {currentStep === 8 && (
                    <div className="space-y-6">
                      <h4 className="text-xl font-semibold text-mine-shaft dark:text-platinum-gray font-bebas mb-4">Achievements</h4>
                      <p className="text-mine-shaft dark:text-platinum-gray/60 font-editorial mb-4">Highlight your notable accomplishments, awards, or recognitions.</p>
                      <div className="space-y-4">
                        {formData.achievements.map((achievement, index) => (
                          <div key={index} className="bg-vista-white dark:bg-onyx-gray rounded-lg p-4 border border-mine-shaft/10 dark:border-gray-700">
                            <div className="grid grid-cols-1 gap-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-mine-shaft dark:text-platinum-gray/70 font-sf mb-2">Achievement Name</label>
                                  <input
                                    type="text"
                                    value={achievement.name}
                                    onChange={(e) => {
                                      const newAchievements = [...formData.achievements];
                                      newAchievements[index].name = e.target.value;
                                      setFormData(prev => ({ ...prev, achievements: newAchievements }));
                                      handleFormFieldChange();
                                    }}
                                    onFocus={handleFormFieldFocus}
                                    onBlur={handleFormFieldBlur}
                                    className="w-full px-3 py-2 bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 rounded-lg text-mine-shaft dark:text-platinum-gray focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent [color-scheme:dark]"
                                    placeholder="Some Project"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-mine-shaft dark:text-platinum-gray/70 font-sf mb-2">Date</label>
                                  <input
                                    type="month"
                                    value={achievement.date}
                                    onChange={(e) => {
                                      const newAchievements = [...formData.achievements];
                                      newAchievements[index].date = e.target.value;
                                      setFormData(prev => ({ ...prev, achievements: newAchievements }));
                                      handleFormFieldChange();
                                    }}
                                    onFocus={handleFormFieldFocus}
                                    onBlur={handleFormFieldBlur}
                                    className="w-full px-3 py-2 bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 rounded-lg text-mine-shaft dark:text-platinum-gray focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent [color-scheme:dark]"
                                    placeholder="2021-09"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-mine-shaft dark:text-platinum-gray/70 font-sf mb-2">Highlights</label>
                                {achievement.highlights.map((highlight, hIndex) => (
                                  <div key={hIndex} className="mb-2 flex">
                                    <input
                                      type="text"
                                      value={highlight}
                                      onChange={(e) => {
                                        const newAchievements = [...formData.achievements];
                                        newAchievements[index].highlights[hIndex] = e.target.value;
                                        setFormData(prev => ({ ...prev, achievements: newAchievements }));
                                        handleFormFieldChange();
                                      }}
                                      onFocus={handleFormFieldFocus}
                                      onBlur={handleFormFieldBlur}
                                      className="flex-1 px-3 py-2 bg-vista-white dark:bg-onyx-gray border border-mine-shaft/20 dark:border-gray-600 rounded-lg text-mine-shaft dark:text-platinum-gray focus:outline-none focus:ring-2 focus:ring-sunglow focus:border-transparent"
                                      placeholder="Became employee of the year"
                                    />
                                    {achievement.highlights.length > 1 && (
                                      <button
                                        onClick={() => {
                                          const newAchievements = [...formData.achievements];
                                          newAchievements[index].highlights = newAchievements[index].highlights.filter((_, hi) => hi !== hIndex);
                                          setFormData(prev => ({ ...prev, achievements: newAchievements }));
                                        }}
                                        className="ml-2 px-3 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors"
                                      >
                                        ×
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <button
                                  onClick={() => {
                                    const newAchievements = [...formData.achievements];
                                    newAchievements[index].highlights.push('Specific detail or impact of this achievement');
                                    setFormData(prev => ({ ...prev, achievements: newAchievements }));
                                    handleFormFieldChange();
                                  }}
                                  className="px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-600/30 transition-colors text-sm mr-2"
                                >
                                  + Add Highlight
                                </button>
                              </div>
                            </div>
                            {formData.achievements.length > 1 && (
                              <button
                                onClick={() => {
                                  const newAchievements = formData.achievements.filter((_, ai) => ai !== index);
                                  setFormData(prev => ({ ...prev, achievements: newAchievements }));
                                }}
                                className="mt-4 px-3 py-1 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors text-sm"
                              >
                                Remove Achievement
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            setFormData(prev => ({ ...prev, achievements: [...prev.achievements, { name: 'Achievement Name', date: '2024-01', highlights: ['Specific detail or impact of this achievement'] }] }));
                            handleFormFieldChange();
                          }}
                          className="px-4 py-2 bg-mine-shaft/10 text-mine-shaft dark:text-platinum-gray/60 border border-mine-shaft/20 dark:border-gray-600 rounded-lg hover:bg-sunglow/20 transition-colors text-sm"
                        >
                          + Add Achievement
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                  {/* Enhanced Navigation Buttons */}
                  <div className="border-t border-mine-shaft/10 dark:border-gray-700 bg-vista-white dark:bg-onyx-gray backdrop-blur-sm">
                    <div className="p-6 flex items-center justify-between">
                      <button
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        className={cn(
                          "flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 border",
                          currentStep === 0
                            ? "bg-vista-white dark:bg-onyx-gray text-mine-shaft dark:text-platinum-gray/60 cursor-not-allowed border-mine-shaft/10 dark:border-gray-700"
                            : "bg-vista-white dark:bg-onyx-gray text-mine-shaft dark:text-platinum-gray border-mine-shaft/20 dark:border-gray-600 hover:bg-mine-shaft/5"
                        )}
                      >
                        <span>←</span>
                        <span>Previous</span>
                      </button>

                      <div className="flex items-center justify-end">
                        {currentStep < formSteps.length - 1 && (
                          <button
                            onClick={nextStep}
                            className="flex items-center space-x-2 px-6 py-3 bg-sunglow hover:bg-sunglow/80 text-mine-shaft dark:text-platinum-gray rounded-xl text-sm font-medium transition-all duration-200 shadow-lg"
                          >
                            <span>Next Step</span>
                            <span>→</span>
                          </button>
                        )}
                        {currentStep === formSteps.length - 1 && !isResumeFinalized && (
                          <button
                            onClick={finalizeResume}
                            className="flex items-center space-x-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg transform hover:scale-105"
                          >
                            <span>Finalize Resume</span>
                          </button>
                        )}
                        {currentStep === formSteps.length - 1 && isResumeFinalized && (
                          <div className="flex items-center space-x-2 px-8 py-3 bg-emerald-500 text-white rounded-xl text-sm font-medium shadow-lg">
                            <span>Resume Completed!</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - PDF Preview */}
        <div className="w-1/2 bg-vista-white dark:bg-charcoal-black flex flex-col">
          <div className="flex items-center justify-between border-b border-mine-shaft/10 dark:border-gray-700 px-4 py-2">
            <span className="text-sm font-medium text-mine-shaft dark:text-platinum-gray font-sf">PDF Preview</span>
          </div>
          <div className="flex-1 p-4 flex items-center justify-center min-h-0">
            {isRendering ? (
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-sunglow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-mine-shaft dark:text-platinum-gray/60 font-editorial">Rendering your resume...</p>
                <p className="text-mine-shaft dark:text-platinum-gray/40 text-xs mt-2 font-editorial">Using {themes.find(t => t.value === selectedTheme)?.label} design...</p>
              </div>
            ) : error ? (
              <div className="text-center text-red-400">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <p className="mb-2">Failed to render PDF</p>
                <p className="text-sm text-red-300 mb-4">{error}</p>
                <div className="text-xs text-mine-shaft dark:text-platinum-gray/40 space-y-1">
                  <p>Troubleshooting:</p>
                  <p>1. Verify FastAPI server is running on port 8000</p>
                  <p>2. Check that RenderCV is installed: pip install rendercv</p>
                  <p>3. Ensure design files are accessible</p>
                </div>
                <div className="mt-4 flex space-x-2 justify-center">
                  <button
                    onClick={() => renderResume()}
                    className="px-4 py-2 bg-sunglow/20 hover:bg-sunglow/30 text-mine-shaft dark:text-platinum-gray rounded-lg text-sm"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={toggleAutoRender}
                    className="px-4 py-2 bg-sunglow hover:bg-sunglow/80 text-mine-shaft dark:text-platinum-gray rounded-lg text-sm font-sf"
                  >
                    {autoRenderEnabled ? "Disable Auto-Render" : "Enable Auto-Render"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full h-full relative">
                {/* Loading Overlay */}
                {showInitialLoadingOverlay && (
                  <div className="absolute inset-0 bg-vista-white dark:bg-onyx-gray/95 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                    <div className="text-center">
                      <div className="w-12 h-12 border-3 border-sunglow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-mine-shaft dark:text-platinum-gray text-2xl font-bebas tracking-tight mb-2">Loading Resume Editor</p>
                      <p className="text-mine-shaft dark:text-platinum-gray/60 font-editorial text-base">Preparing your resume template...</p>
                      <div className="mt-4 flex justify-center space-x-1">
                        <div className="w-2 h-2 bg-sunglow rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-sunglow rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-sunglow rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                {pdfUrl && !showInitialLoadingOverlay ? (
                  <div className="w-full h-full">
                    <iframe
                      key={renderKey}
                      src={pdfUrl}
                      className="w-full h-full rounded-lg border border-white/10"
                      title="Resume Preview"
                      onLoad={() => {
                        console.log('PDF iframe loaded successfully');
                        // Hide loading overlay when PDF is fully loaded
                        setShowInitialLoadingOverlay(false);
                      }}
                      onError={() => console.error('PDF iframe failed to load')}
                    />
                  </div>
                ) : showInitialLoadingOverlay ? null : (
                  <div className="text-center text-mine-shaft dark:text-platinum-gray/40">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                    <p>PDF preview will appear here</p>
                    <p className="text-sm mt-2">
                      {autoRenderEnabled ? "Auto-render will trigger shortly..." : "Click 'Render Now' to generate PDF"}
                    </p>
                    <div className="mt-4 flex space-x-2 justify-center">
                      <button
                        onClick={() => renderResume()}
                        className="px-4 py-2 bg-sunglow/20 hover:bg-sunglow/30 text-mine-shaft dark:text-platinum-gray rounded-lg text-sm"
                      >
                        Render Now
                      </button>
                      <button
                        onClick={toggleAutoRender}
                        className={cn(
                          "px-4 py-2 text-mine-shaft dark:text-platinum-gray rounded-lg text-sm",
                          autoRenderEnabled
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-mine-shaft/10 hover:bg-mine-shaft/20"
                        )}
                      >
                        {autoRenderEnabled ? "Disable Auto-Render" : "Enable Auto-Render"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          }
          </div>
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
    </div>
  );
}