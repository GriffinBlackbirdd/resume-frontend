"use client";

import React, { useState, useEffect } from "react";
import MonacoEditor from "@monaco-editor/react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import * as yaml from 'js-yaml';
import { User, Link, FileText, Briefcase, Rocket, GraduationCap, Zap, Award, Star, Settings, Eye, Download, BarChart3, RefreshCw, Palette, Play, Pause } from 'lucide-react';

export default function ResumeEditor() {
  const searchParams = useSearchParams();
  const { token } = useAuth();
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
  theme: sb2nov`;
  };

  const [yamlContent, setYamlContent] = useState(getInitialYamlContent());

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRenderEnabled, setAutoRenderEnabled] = useState(true);
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

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

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
    { value: 'sb2novDesign', label: 'SB2Nov Design', filename: 'sb2novDesign.yaml' },
    { value: 'test', label: 'Test Design', filename: 'test.yaml' }
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
          const response = await fetch(`http://localhost:8000/project/${projectId}/yaml`, {
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

            // Enable ATS scoring for projects loaded from cloud
            setHasJobDescription(true);
          } else {
            console.error('Failed to load project YAML:', response.statusText);
          }
        } catch (error) {
          console.error('Error loading project YAML:', error);
        }
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

          const createResponse = await fetch('http://localhost:8000/create-project', {
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

      const response = await fetch('http://localhost:8000/run-gap-analysis', {
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
        ? `http://localhost:8000/get-gap-analysis-content/${fileType}?project_id=${projectId}`
        : `http://localhost:8000/get-gap-analysis-content/${fileType}`;
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
      setCompletedSteps(prev => new Set([...prev, currentStep]));
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

      const response = await fetch('http://localhost:8000/get-ats-score-with-stored-jd', {
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

  // Function to check if YAML content is more complex than form can handle
  const isYamlMoreComplexThanForm = (yamlString: string) => {
    try {
      const parsedYaml = yaml.load(yamlString) as any;
      if (!parsedYaml || !parsedYaml.cv) return false;

      const cv = parsedYaml.cv;
      const sections = cv.sections || {};

      // Check for complex fields that form doesn't fully support
      const hasComplexSummary = sections.summary && sections.summary.length > 5;
      const hasComplexExperience = sections.experience && sections.experience.length > 3;
      const hasComplexProjects = sections.projects && sections.projects.length > 3;
      const hasComplexTechnologies = sections.technologies && sections.technologies.length > 6;
      const hasLongHighlights = sections.experience && sections.experience.some((exp: any) =>
        exp.highlights && exp.highlights.length > 5
      );
      const hasDetailedProjects = sections.projects && sections.projects.some((proj: any) =>
        proj.highlights && proj.highlights.length > 3
      );

      return hasComplexSummary || hasComplexExperience || hasComplexProjects ||
             hasComplexTechnologies || hasLongHighlights || hasDetailedProjects;
    } catch (error) {
      return false;
    }
  };

  // Function to convert form data to YAML
  const convertFormToYaml = () => {
    const yaml = `# RenderCV Resume Configuration
cv:
  name: ${formData.personalInfo.name}
  location: ${formData.personalInfo.location}
  email: ${formData.personalInfo.email}
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
        end_date: ${edu.end_date}${edu.gpa && edu.gpa.trim() ? `\n        highlights:\n          - 'CGPA: ${edu.gpa}'` : ''}${edu.highlights && edu.highlights.some(h => h.trim()) ? `${edu.gpa && edu.gpa.trim() ? '' : '\n        highlights:'}${edu.highlights.filter(h => h.trim()).map(h => `\n          - '${h}'`).join('')}` : ''}`).join('')}

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

      // Update form data from YAML
      const newFormData = {
        personalInfo: {
          name: cv.name || '',
          location: cv.location || '',
          email: cv.email || '',
          website: cv.website || ''
        },
        socialNetworks: cv.social_networks ? cv.social_networks.map((sn: any) => ({
          network: sn.network || '',
          username: sn.username || ''
        })) : [{ network: '', username: '' }],
        summary: cv.sections?.summary || [''],
        experience: cv.sections?.experience ? cv.sections.experience.map((exp: any) => ({
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
        }],
        projects: cv.sections?.projects ? cv.sections.projects.map((proj: any) => ({
          name: proj.name || '',
          summary: proj.summary || '',
          highlights: proj.highlights || ['']
        })) : [{
          name: '',
          summary: '',
          highlights: ['']
        }],
        education: cv.sections?.education ? cv.sections.education.map((edu: any) => ({
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
        }],
        technologies: cv.sections?.technologies ? cv.sections.technologies.map((tech: any) => ({
          label: tech.label || '',
          details: tech.details || ''
        })) : [{
          label: '',
          details: ''
        }],
        certifications: cv.sections?.Certifications ? cv.sections.Certifications.map((cert: any) => ({
          name: cert.name || '',
          date: cert.date || ''
        })) : [{
          name: '',
          date: ''
        }],
        achievements: cv.sections?.Achievment ? cv.sections.Achievment.map((ach: any) => ({
          name: ach.name || '',
          date: ach.date || '',
          highlights: ach.highlights || ['']
        })) : [{
          name: '',
          date: '',
          highlights: ['']
        }]
      };

      setFormData(newFormData);
      setFormDataInitialized(true);

      // Update theme if present and not explicitly set by user
      if (design?.theme && !isUpdatingThemeFromYaml) {
        console.log('Updating theme from YAML:', design.theme);
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

        const response = await fetch(`http://localhost:8000/project/${projectId}/calculate-ats`, {
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

      const atsResponse = await fetch('http://localhost:8000/get-original-ats-score', {
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

      const response = await fetch('http://localhost:8000/render-resume', {
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
        console.log('PDF URL set successfully with theme:', themeToUse);
        console.log('PDF blob size:', blob.size, 'bytes');

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

  useEffect(() => {
    // Auto-render on component mount with initial YAML
    if (yamlContent && autoRenderEnabled) {
      renderResume();
    }
  }, []);

  useEffect(() => {
    // Auto-render when YAML content changes (debounced)
    const timeout = setTimeout(() => {
      if (autoRenderEnabled && yamlContent !== lastYamlContent && yamlContent.trim() !== '') {
        setLastYamlContent(yamlContent);
        renderResume();
      }
    }, 1000); // 1 second debounce to avoid excessive renders while typing

    return () => clearTimeout(timeout);
  }, [yamlContent, autoRenderEnabled, lastYamlContent]);

  useEffect(() => {
    // Auto-render when theme changes (no debounce needed for theme changes)
    if (autoRenderEnabled && yamlContent.trim() !== '') {
      renderResume();
    }
  }, [selectedTheme]);

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
    // 4. Either the original YAML was simple OR user manually edited it (indicating they want form sync)
    const shouldSyncFormToYaml = activeTab === 'form' &&
                                formDataInitialized &&
                                !syncInProgress &&
                                (!isYamlMoreComplexThanForm(originalYamlContent) || yamlWasManuallyEdited);

    if (shouldSyncFormToYaml) {
      const newYaml = convertFormToYaml();
      if (newYaml !== yamlContent) {
        console.log('🔄 Syncing form data to YAML (simple content or manually edited)');
        setSyncInProgress(true);
        setYamlContent(newYaml);
        setTimeout(() => setSyncInProgress(false), 100);
      }
    } else if (activeTab === 'form' && isYamlMoreComplexThanForm(originalYamlContent) && !yamlWasManuallyEdited) {
      console.log('⚠️ Preserving complex YAML content, not syncing from form');
    }
  }, [formData, activeTab, selectedTheme, formDataInitialized, syncInProgress, yamlContent, originalYamlContent, yamlWasManuallyEdited]);

  // Sync YAML to form data when YAML changes (but NOT when form fields are being edited)
  useEffect(() => {
    if (yamlContent && yamlContent.trim() && !syncInProgress && !isFormFieldActive) {
      console.log('🔄 Syncing YAML to form data');
      setSyncInProgress(true);
      convertYamlToForm(yamlContent);
      setTimeout(() => setSyncInProgress(false), 100);
    }
  }, [yamlContent, syncInProgress, isFormFieldActive]);

  // Handle tab switching with complex YAML preservation
  const handleTabSwitch = (tab: 'yaml' | 'form') => {
    // When switching back to YAML from form, restore original complex content if it wasn't manually edited
    if (tab === 'yaml' && activeTab === 'form' && isYamlMoreComplexThanForm(originalYamlContent) && !yamlWasManuallyEdited) {
      console.log('🔄 Restoring original complex YAML content');
      setYamlContent(originalYamlContent);
    }

    // Reset form initialization when switching to form tab to ensure clean sync
    if (tab === 'form' && activeTab === 'yaml') {
      setFormDataInitialized(false);
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
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-gradient-to-r from-gray-900 to-gray-800 backdrop-blur-sm shadow-lg">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left Section - Branding */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Resume Editor</h1>
                <div className="text-xs text-white/50">Professional Resume Builder</div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-white/70">resume.yaml</span>
            </div>
          </div>

          {/* Center Section - Key Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* ATS Score */}
            <div className="flex items-center space-x-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-white/60">ATS:</span>
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
                    <span className="text-xs text-white/40">--</span>
                  )}
                </div>
                {!projectId && oldAtsScore !== null && atsScore !== null && (
                  <div className="flex items-center space-x-1">
                    {atsScore > oldAtsScore ? (
                      <div className="flex items-center space-x-1 text-xs text-green-400">
                        <span>↑</span>
                        <span>+{(atsScore - oldAtsScore).toFixed(1)}%</span>
                      </div>
                    ) : atsScore < oldAtsScore ? (
                      <div className="flex items-center space-x-1 text-xs text-red-400">
                        <span>↓</span>
                        <span>{(atsScore - oldAtsScore).toFixed(1)}%</span>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            {/* Auto-Render Status */}
            <div className="flex items-center space-x-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center space-x-2">
                {autoRenderEnabled ? (
                  <><RefreshCw className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400 font-medium">Auto-Render</span></>
                ) : (
                  <><Pause className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-yellow-400 font-medium">Manual Mode</span></>
                )}
              </div>
              <div className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                autoRenderEnabled ? "bg-green-400 animate-pulse" : "bg-yellow-400"
              )}></div>
            </div>

            {/* Theme Selector */}
            <div className="flex items-center space-x-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
              <Palette className="w-4 h-4 text-gray-400" />
              <select
                value={selectedTheme}
                onChange={(e) => handleThemeChange(e.target.value)}
                className="bg-transparent border-none text-sm text-white focus:outline-none cursor-pointer"
              >
                {themes.map((theme) => (
                  <option key={theme.value} value={theme.value} className="bg-gray-800">
                    {theme.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Section - Controls */}
          <div className="flex items-center space-x-3">
            {/* Auto-Render Toggle */}
            <button
              onClick={toggleAutoRender}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border",
                autoRenderEnabled
                  ? "bg-green-600/20 text-green-400 border-green-500/30 hover:bg-green-600/30"
                  : "bg-gray-700/50 text-gray-300 border-gray-600/50 hover:bg-gray-600/60"
              )}
            >
              {autoRenderEnabled ? <RefreshCw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="hidden sm:inline">
                {autoRenderEnabled ? "Auto: ON" : "Auto: OFF"}
              </span>
            </button>

            {/* Render Now Button */}
            <button
              onClick={() => renderResume()}
              disabled={isRendering}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all duration-200 border border-gray-600 hover:border-gray-500 shadow-lg"
            >
              {isRendering ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span>{isRendering ? "Rendering..." : "Preview"}</span>
            </button>

            {/* Settings Menu (Mobile) */}
            <button className="lg:hidden p-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-200">
              <Settings className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </header>


      {/* Main Editor Layout */}
      <div className="flex h-[calc(100vh-145px)]">
        {/* Left Panel - Editor with Tabs */}
        <div className="w-1/2 border-r border-white/10 bg-gray-900/30">
          {/* Tab Headers */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => handleTabSwitch('yaml')}
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === 'yaml'
                  ? "text-white border-blue-500 bg-gray-800/50"
                  : "text-white/60 border-transparent hover:text-white/80 hover:bg-gray-800/30"
              )}
            >
              YAML Editor
            </button>
            <button
              onClick={() => handleTabSwitch('form')}
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === 'form'
                  ? "text-white border-blue-500 bg-gray-800/50"
                  : "text-white/60 border-transparent hover:text-white/80 hover:bg-gray-800/30"
              )}
            >
              Form Editor
            </button>
          </div>

          {/* Tab Content */}
          <div className="h-[calc(100%-41px)]">
            {activeTab === 'yaml' ? (
              <div className="h-full p-4">
                <div className="h-[calc(100%-2rem)] border border-white/10 rounded-lg overflow-hidden">
                  <MonacoEditor
                    height="100%"
                    defaultLanguage="yaml"
                    value={yamlContent}
                    onChange={handleYamlChange}
                    theme="vs-dark"
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
                {/* Complex YAML Warning */}
                {isYamlMoreComplexThanForm(originalYamlContent) && !yamlWasManuallyEdited && (
                  <div className="absolute top-16 left-4 right-4 z-10 bg-yellow-900/90 border border-yellow-500/50 rounded-lg p-3 backdrop-blur-sm">
                    <div className="flex items-center space-x-2 text-yellow-200 text-sm">
                      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Complex Resume Detected</span>
                    </div>
                    <p className="mt-1 text-yellow-200/80 text-xs">
                      This resume contains detailed information that may not be fully editable in form mode. Your original YAML content is preserved and will be restored when you switch back to YAML editor.
                    </p>
                  </div>
                )}

                {/* Sidebar Navigation */}
                <div className="w-80 bg-gray-900/50 border-r border-white/10 flex flex-col">
                  {/* Breadcrumb Trail */}
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-white/40">Resume Builder</span>
                      <span className="text-white/40">/</span>
                      <span className="text-blue-400 font-medium">{formSteps[currentStep].title}</span>
                    </div>
                  </div>

                  {/* Floating Progress Indicator */}
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-medium">Overall Progress</span>
                      <span className="text-sm text-white/60">{Math.round(((Array.from(completedSteps).length) / formSteps.length) * 100)}%</span>
                    </div>
                    <div className="relative">
                      <svg className="w-16 h-16 mx-auto transform -rotate-90" viewBox="0 0 64 64">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          fill="none"
                          stroke="rgb(75 85 99)"
                          strokeWidth="4"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          fill="none"
                          stroke="rgb(147 51 234)"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 28}`}
                          strokeDashoffset={`${2 * Math.PI * 28 * (1 - (Array.from(completedSteps).length) / formSteps.length)}`}
                          className="transition-all duration-500"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{Array.from(completedSteps).length}/{formSteps.length}</span>
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
                            ? "bg-gray-700/50 border border-gray-600/50 text-white"
                            : completedSteps.has(index)
                            ? "bg-green-600/10 border border-green-500/20 text-green-400 hover:bg-green-600/20 cursor-pointer"
                            : index < currentStep
                            ? "bg-gray-700/30 border border-gray-600/30 text-gray-300 hover:bg-gray-700/50 cursor-pointer"
                            : "bg-gray-800/30 border border-gray-700/30 text-gray-500 cursor-not-allowed opacity-60"
                        )}
                        disabled={index > currentStep && !completedSteps.has(index)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                            index === currentStep
                              ? "bg-gray-600 text-white"
                              : completedSteps.has(index)
                              ? "bg-green-500 text-white"
                              : index < currentStep
                              ? "bg-gray-600 text-gray-300"
                              : "bg-gray-700 text-gray-500"
                          )}>
                            {completedSteps.has(index) ? "✓" : index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              {getIcon(step.icon)}
                              <span className="font-medium text-sm">{step.title}</span>
                            </div>
                            {index === currentStep && (
                              <div className="text-xs text-white/60 mt-1">Currently editing</div>
                            )}
                            {completedSteps.has(index) && index !== currentStep && (
                              <div className="text-xs text-green-400/80 mt-1">Completed</div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col">
                  {/* Header */}
                  <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-700/30 rounded-xl flex items-center justify-center">
                          {getIcon(formSteps[currentStep].icon, "w-6 h-6")}
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-white">{formSteps[currentStep].title}</h2>
                          <p className="text-white/60 text-sm">Step {currentStep + 1} of {formSteps.length}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-400">
                          {Math.round(((currentStep + 1) / formSteps.length) * 100)}%
                        </div>
                        <div className="text-xs text-white/60">Complete</div>
                      </div>
                    </div>
                  </div>

                {/* Step Content */}
                <div className="flex-1 overflow-y-auto p-6 form-scroll">
                  {currentStep === 0 && (
                    <div className="space-y-6">
                      <h4 className="text-xl font-semibold text-white mb-4">Personal Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-white/70 mb-2">Full Name *</label>
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
                            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white/70 mb-2">Email *</label>
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
                            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="john@example.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white/70 mb-2">Location</label>
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
                            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="New York, NY"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white/70 mb-2">Website</label>
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
                            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://yourwebsite.com"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <h4 className="text-xl font-semibold text-white mb-4">Social Networks</h4>
                      <p className="text-white/60 mb-4">Add your professional social media profiles and online presence.</p>
                      <div className="space-y-4">
                        {formData.socialNetworks.map((social, index) => (
                          <div key={index} className="bg-gray-700/20 rounded-lg p-4 border border-gray-600/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">Network</label>
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
                                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [color-scheme:dark]"
                                >
                                  <option value="GitHub">GitHub</option>
                                  <option value="LinkedIn">LinkedIn</option>
                                  <option value="Twitter">Twitter</option>
                                  <option value="Portfolio">Portfolio</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">Username</label>
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
                                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [color-scheme:dark]"
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
                          onClick={() => setFormData(prev => ({ ...prev, socialNetworks: [...prev.socialNetworks, {
                            network: 'GitHub', username: ''
                          }] }))}
                          className="px-4 py-2 bg-gray-700/30 text-gray-300 border border-gray-600/50 rounded-lg hover:bg-gray-600/50 transition-colors text-sm"
                        >
                          + Add Social Network
                        </button>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <h4 className="text-xl font-semibold text-white mb-4">Professional Summary</h4>
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
                            className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
                        onClick={() => setFormData(prev => ({ ...prev, summary: [...prev.summary, ''] }))}
                        className="px-4 py-2 bg-gray-700/30 text-gray-300 border border-gray-600/50 rounded-lg hover:bg-gray-600/50 transition-colors text-sm"
                      >
                        + Add Summary Point
                      </button>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <h4 className="text-xl font-semibold text-white mb-4">Work Experience</h4>
                      <div className="space-y-6">
                        {formData.experience.map((exp, index) => (
                          <div key={index} className="bg-gray-700/20 rounded-lg p-4 border border-gray-600/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">Company *</label>
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
                                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [color-scheme:dark]"
                                  placeholder="Company Name"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">Position *</label>
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
                                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [color-scheme:dark]"
                                  placeholder="Job Title"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">Location</label>
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
                                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [color-scheme:dark]"
                                  placeholder="City, State"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-white/70 mb-2">Start Date</label>
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
                                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [color-scheme:dark]"
                                    placeholder="2021-01"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-white/70 mb-2">End Date</label>
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
                                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed [color-scheme:dark]"
                                      placeholder="2023-12"
                                    />
                                    <label className="flex items-center text-white/70 text-sm cursor-pointer select-none">
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
                              <label className="block text-sm font-medium text-white/70 mb-2">Key Achievements</label>
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
                                    className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                  newExp[index].highlights.push('');
                                  setFormData(prev => ({ ...prev, experience: newExp }));
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
                          onClick={() => setFormData(prev => ({ ...prev, experience: [...prev.experience, {
                            company: '', position: '', location: '', start_date: '', end_date: 'present', highlights: ['']
                          }] }))}
                          className="px-4 py-2 bg-gray-700/30 text-gray-300 border border-gray-600/50 rounded-lg hover:bg-gray-600/50 transition-colors text-sm"
                        >
                          + Add Experience
                        </button>
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <h4 className="text-xl font-semibold text-white mb-4">Projects</h4>
                      <p className="text-white/60 mb-4">Add your notable projects, side projects, or portfolio items.</p>
                      <div className="space-y-4">
                        {formData.projects.map((project, index) => (
                          <div key={index} className="bg-gray-700/20 rounded-lg p-4 border border-gray-600/30">
                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">Project Name</label>
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
                                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [color-scheme:dark]"
                                  placeholder="My Awesome Project"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">Description</label>
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
                                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                  placeholder="Brief project description..."
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">Key Highlights</label>
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
                                      className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                    newProjects[index].highlights.push('');
                                    setFormData(prev => ({ ...prev, projects: newProjects }));
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
                          onClick={() => setFormData(prev => ({ ...prev, projects: [...prev.projects, { name: '', summary: '', highlights: [''] }] }))}
                          className="px-4 py-2 bg-gray-700/30 text-gray-300 border border-gray-600/50 rounded-lg hover:bg-gray-600/50 transition-colors text-sm"
                        >
                          + Add Project
                        </button>
                      </div>
                    </div>
                  )}

                  {currentStep === 5 && (
                    <div className="space-y-6">
                      <h4 className="text-xl font-semibold text-white mb-4">Education</h4>
                      <div className="space-y-4">
                        {formData.education.map((edu, index) => (
                          <div key={index} className="bg-gray-700/20 rounded-lg p-4 border border-gray-600/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">Institution *</label>
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
                                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [color-scheme:dark]"
                                  placeholder="University Name"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">Degree</label>
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
                                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [color-scheme:dark]"
                                  placeholder="BTech"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">Field of Study</label>
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
                                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [color-scheme:dark]"
                                  placeholder="Computer Science"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">CGPA/GPA</label>
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
                                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [color-scheme:dark]"
                                  placeholder="8.0/10.0 or 3.8/4.0"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-sm font-medium text-white/70 mb-2">Start Date</label>
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
                                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [color-scheme:dark]"
                                    placeholder="2015-09"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-white/70 mb-2">End Date</label>
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
                                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [color-scheme:dark]"
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
                          onClick={() => setFormData(prev => ({ ...prev, education: [...prev.education, {
                            institution: '', area: '', degree: '', start_date: '', end_date: '', gpa: '', highlights: []
                          }] }))}
                          className="px-4 py-2 bg-gray-700/30 text-gray-300 border border-gray-600/50 rounded-lg hover:bg-gray-600/50 transition-colors text-sm"
                        >
                          + Add Education
                        </button>
                      </div>
                    </div>
                  )}

                  {currentStep === 6 && (
                    <div className="space-y-6">
                      <h4 className="text-xl font-semibold text-white mb-4">Technologies</h4>
                      <div className="space-y-4">
                        {formData.technologies.map((tech, index) => (
                          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-white/70 mb-2">Category</label>
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
                                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Languages"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-white/70 mb-2">Technologies</label>
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
                                  className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          onClick={() => setFormData(prev => ({ ...prev, technologies: [...prev.technologies, { label: '', details: '' }] }))}
                          className="px-4 py-2 bg-gray-700/30 text-gray-300 border border-gray-600/50 rounded-lg hover:bg-gray-600/50 transition-colors text-sm"
                        >
                          + Add Technology Category
                        </button>
                      </div>
                    </div>
                  )}

                  {currentStep === 7 && (
                    <div className="space-y-6">
                      <h4 className="text-xl font-semibold text-white mb-4">Certifications</h4>
                      <p className="text-white/60 mb-4">Add your professional certifications, licenses, or credentials.</p>
                      <div className="space-y-4">
                        {formData.certifications.map((cert, index) => (
                          <div key={index} className="bg-gray-700/20 rounded-lg p-4 border border-gray-600/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">Certification Name</label>
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
                                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [color-scheme:dark]"
                                  placeholder="AWS Certified Solutions Architect"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">Date Issued</label>
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
                                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [color-scheme:dark]"
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
                          onClick={() => setFormData(prev => ({ ...prev, certifications: [...prev.certifications, { name: '', date: '' }] }))}
                          className="px-4 py-2 bg-gray-700/30 text-gray-300 border border-gray-600/50 rounded-lg hover:bg-gray-600/50 transition-colors text-sm"
                        >
                          + Add Certification
                        </button>
                      </div>
                    </div>
                  )}

                  {currentStep === 8 && (
                    <div className="space-y-6">
                      <h4 className="text-xl font-semibold text-white mb-4">Achievements</h4>
                      <p className="text-white/60 mb-4">Highlight your notable accomplishments, awards, or recognitions.</p>
                      <div className="space-y-4">
                        {formData.achievements.map((achievement, index) => (
                          <div key={index} className="bg-gray-700/20 rounded-lg p-4 border border-gray-600/30">
                            <div className="grid grid-cols-1 gap-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-white/70 mb-2">Achievement Name</label>
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
                                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [color-scheme:dark]"
                                    placeholder="Some Project"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-white/70 mb-2">Date</label>
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
                                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [color-scheme:dark]"
                                    placeholder="2021-09"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">Highlights</label>
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
                                      className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                    newAchievements[index].highlights.push('');
                                    setFormData(prev => ({ ...prev, achievements: newAchievements }));
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
                          onClick={() => setFormData(prev => ({ ...prev, achievements: [...prev.achievements, { name: '', date: '', highlights: [''] }] }))}
                          className="px-4 py-2 bg-gray-700/30 text-gray-300 border border-gray-600/50 rounded-lg hover:bg-gray-600/50 transition-colors text-sm"
                        >
                          + Add Achievement
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                  {/* Enhanced Navigation Buttons */}
                  <div className="border-t border-white/10 bg-gray-900/30 backdrop-blur-sm">
                    <div className="p-6 flex items-center justify-between">
                      <button
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        className={cn(
                          "flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                          currentStep === 0
                            ? "bg-gray-800/50 text-gray-500 cursor-not-allowed border border-gray-700/50"
                            : "bg-gray-700/50 text-white hover:bg-gray-600/60 border border-gray-600/50 hover:border-gray-500/50"
                        )}
                      >
                        <span>←</span>
                        <span>Previous</span>
                      </button>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          {formSteps.map((_, index) => (
                            <div
                              key={index}
                              className={cn(
                                "w-2 h-2 rounded-full transition-all duration-300",
                                index === currentStep
                                  ? "bg-blue-500 w-6"
                                  : completedSteps.has(index)
                                  ? "bg-green-500"
                                  : index < currentStep
                                  ? "bg-gray-500"
                                  : "bg-gray-700"
                              )}
                            />
                          ))}
                        </div>

                        {currentStep < formSteps.length - 1 && (
                          <button
                            onClick={nextStep}
                            className="flex items-center space-x-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm font-medium transition-all duration-200 border border-gray-600 hover:border-gray-500 shadow-lg"
                          >
                            <span>Next Step</span>
                            <span>→</span>
                          </button>
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
        <div className="w-1/2 bg-gray-900/20">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
            <span className="text-sm font-medium text-white/80">PDF Preview</span>
          </div>
          <div className="h-full p-4 flex items-center justify-center">
            {isRendering ? (
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white/60">Rendering your resume...</p>
                <p className="text-white/40 text-xs mt-2">Using {themes.find(t => t.value === selectedTheme)?.label} design...</p>
              </div>
            ) : error ? (
              <div className="text-center text-red-400">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <p className="mb-2">Failed to render PDF</p>
                <p className="text-sm text-red-300 mb-4">{error}</p>
                <div className="text-xs text-white/40 space-y-1">
                  <p>Troubleshooting:</p>
                  <p>1. Verify FastAPI server is running on port 8000</p>
                  <p>2. Check that RenderCV is installed: pip install rendercv</p>
                  <p>3. Ensure design files are accessible</p>
                </div>
                <div className="mt-4 flex space-x-2 justify-center">
                  <button
                    onClick={() => renderResume()}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={toggleAutoRender}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
                  >
                    {autoRenderEnabled ? "Disable Auto-Render" : "Enable Auto-Render"}
                  </button>
                </div>
              </div>
            ) : pdfUrl ? (
              <div className="w-full h-full">
                <iframe
                  key={renderKey}
                  src={pdfUrl}
                  className="w-full h-full rounded-lg border border-white/10"
                  title="Resume Preview"
                  onLoad={() => console.log('PDF iframe loaded successfully')}
                  onError={() => console.error('PDF iframe failed to load')}
                />
              </div>
            ) : (
              <div className="text-center text-white/40">
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
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
                  >
                    Render Now
                  </button>
                  <button
                    onClick={toggleAutoRender}
                    className={cn(
                      "px-4 py-2 text-white rounded-lg text-sm",
                      autoRenderEnabled
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-gray-600 hover:bg-gray-700"
                    )}
                  >
                    {autoRenderEnabled ? "Auto: ON" : "Auto: OFF"}
                  </button>
                </div>
              </div>
            )}
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