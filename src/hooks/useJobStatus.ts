import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface JobStatus {
  job_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  message: string;
  result?: any;
  error?: string;
}

interface UseJobStatusOptions {
  pollingInterval?: number; // in milliseconds
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

export function useJobStatus(jobId: string | null, options: UseJobStatusOptions = {}) {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const { token } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { pollingInterval = 2000, onComplete, onError } = options;

  const pollJobStatus = async () => {
    if (!jobId || !token) return;

    try {
      const response = await fetch(`/api/job-status?job_id=${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (response.ok) {
        const status: JobStatus = await response.json();
        setJobStatus(status);

        // Handle completion
        if (status.status === 'completed') {
          setIsPolling(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          if (onComplete && status.result) {
            onComplete(status.result);
          }
        }

        // Handle failure
        if (status.status === 'failed') {
          setIsPolling(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          if (onError && status.error) {
            onError(status.error);
          }
        }
      } else {
        console.error('Failed to fetch job status:', response.status);
      }
    } catch (error) {
      console.error('Error polling job status:', error);
    }
  };

  const startPolling = () => {
    if (!jobId || isPolling) return;

    setIsPolling(true);
    // Poll immediately
    pollJobStatus();

    // Set up interval polling
    intervalRef.current = setInterval(pollJobStatus, pollingInterval);
  };

  const stopPolling = () => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Auto-start polling when jobId changes
  useEffect(() => {
    if (jobId && token) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [jobId, token]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  return {
    jobStatus,
    isPolling,
    startPolling,
    stopPolling,
    pollJobStatus
  };
}