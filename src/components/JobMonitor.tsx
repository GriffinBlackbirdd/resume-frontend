import React, { useEffect } from 'react';
import { useJobStatus } from '@/hooks/useJobStatus';

interface JobMonitorProps {
  projectId: string;
  jobId: string;
  onComplete: () => void;
  onError: (error: string) => void;
  onProgress?: (progress: number, message: string) => void;
}

export function JobMonitor({ projectId, jobId, onComplete, onError, onProgress }: JobMonitorProps) {
  const { jobStatus } = useJobStatus(jobId, {
    pollingInterval: 2000,
    onComplete: (result) => {
      console.log(`✅ Job ${jobId} for project ${projectId} completed:`, result);
      onComplete();
    },
    onError: (error) => {
      console.error(`❌ Job ${jobId} for project ${projectId} failed:`, error);
      onError(error);
    }
  });

  useEffect(() => {
    if (jobStatus && onProgress) {
      onProgress(jobStatus.progress, jobStatus.message);
    }
  }, [jobStatus, onProgress]);

  // This component doesn't render anything - it just monitors the job
  return null;
}