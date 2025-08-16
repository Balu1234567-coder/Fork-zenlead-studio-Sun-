import { useState, useEffect, useCallback, useRef } from 'react';
import ProjectApiService, { ProjectStatus } from '@/lib/projectApiService';

interface UseProjectStatusOptions {
  usageId: string;
  projectType: string;
  pollInterval?: number; // in milliseconds, default 5000
  enablePolling?: boolean; // default true
  onStatusChange?: (status: ProjectStatus) => void;
  onError?: (error: Error) => void;
}

interface ProjectStatusState {
  status: ProjectStatus | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isPolling: boolean;
}

export const useProjectStatus = (options: UseProjectStatusOptions) => {
  const {
    usageId,
    projectType,
    pollInterval = 5000,
    enablePolling = true,
    onStatusChange,
    onError
  } = options;

  const [state, setState] = useState<ProjectStatusState>({
    status: null,
    loading: false,
    error: null,
    lastUpdated: null,
    isPolling: false
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Stop polling when component unmounts
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState(prev => ({ ...prev, isPolling: false }));
  }, []);

  const fetchStatus = useCallback(async () => {
    if (!usageId || !projectType || !mountedRef.current) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const status = await ProjectApiService.getProjectStatus(usageId, projectType);
      
      if (!mountedRef.current) return;

      setState(prev => {
        const newState = {
          ...prev,
          status,
          loading: false,
          lastUpdated: new Date(),
          error: null
        };

        // Call status change callback if status changed
        if (prev.status?.status !== status.status && onStatusChange) {
          onStatusChange(status);
        }

        return newState;
      });

      // Stop polling if project is no longer processing
      if (!status.progress_info.is_processing && !status.progress_info.is_pending) {
        stopPolling();
      }

    } catch (error: any) {
      console.error('Failed to fetch project status:', error);
      
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Failed to fetch status',
          lastUpdated: new Date()
        }));
        
        if (onError) {
          onError(error);
        }
      }
    }
  }, [usageId, projectType, onStatusChange, onError, stopPolling]);

  const startPolling = useCallback(() => {
    if (!enablePolling || intervalRef.current) return;

    setState(prev => ({ ...prev, isPolling: true }));
    
    // Fetch immediately
    fetchStatus();
    
    // Then set up interval
    intervalRef.current = setInterval(fetchStatus, pollInterval);
  }, [enablePolling, fetchStatus, pollInterval]);

  // Auto-start polling when parameters change
  useEffect(() => {
    if (usageId && projectType && enablePolling) {
      // Fetch initial status
      fetchStatus();
      
      // Start polling if status indicates processing
      if (state.status?.progress_info.is_processing || state.status?.progress_info.is_pending) {
        startPolling();
      }
    } else {
      stopPolling();
    }
    
    return () => stopPolling();
  }, [usageId, projectType, enablePolling, fetchStatus, startPolling, stopPolling]);

  // Auto-manage polling based on status
  useEffect(() => {
    if (state.status && (state.status.progress_info.is_processing || state.status.progress_info.is_pending)) {
      if (enablePolling && !intervalRef.current) {
        startPolling();
      }
    } else {
      stopPolling();
    }
  }, [state.status?.progress_info, enablePolling, startPolling, stopPolling]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    // Current state
    status: state.status,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    isPolling: state.isPolling,
    
    // Helper functions
    refresh,
    startPolling,
    stopPolling,
    
    // Computed values
    isProcessing: state.status?.progress_info.is_processing || false,
    isPending: state.status?.progress_info.is_pending || false,
    isCompleted: state.status?.progress_info.is_completed || false,
    isFailed: state.status?.progress_info.is_failed || false,
    isCancelled: state.status?.progress_info.is_cancelled || false
  };
};

// Hook for managing multiple project statuses
export const useProjectsStatus = (projects: Array<{ usageId: string; projectType: string }>) => {
  const [statuses, setStatuses] = useState<Record<string, ProjectStatus>>({});
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const fetchAllStatuses = useCallback(async () => {
    if (!projects.length || !mountedRef.current) return;

    try {
      setLoading(true);
      
      const statusPromises = projects.map(async ({ usageId, projectType }) => {
        try {
          const status = await ProjectApiService.getProjectStatus(usageId, projectType);
          return { usageId, status, error: null };
        } catch (error) {
          return { usageId, status: null, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      });

      const results = await Promise.all(statusPromises);
      
      if (!mountedRef.current) return;

      const newStatuses: Record<string, ProjectStatus> = {};
      let hasProcessingProjects = false;

      results.forEach(({ usageId, status, error }) => {
        if (status) {
          newStatuses[usageId] = status;
          
          // Check if any project is still processing
          if (status.progress_info.is_processing || status.progress_info.is_pending) {
            hasProcessingProjects = true;
          }
        }
      });

      setStatuses(newStatuses);

      // Stop polling if no projects are processing
      if (!hasProcessingProjects && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (error) {
      console.error('Failed to fetch project statuses:', error);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [projects]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;

    // Fetch immediately
    fetchAllStatuses();
    
    // Then set up interval for processing projects
    const hasProcessingProjects = Object.values(statuses).some(s => 
      s.progress_info.is_processing || s.progress_info.is_pending
    );

    if (hasProcessingProjects) {
      intervalRef.current = setInterval(fetchAllStatuses, 10000); // Poll every 10 seconds for multiple projects
    }
  }, [fetchAllStatuses, statuses]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Auto-start polling when projects change
  useEffect(() => {
    const hasProcessingProjects = Object.values(statuses).some(s => 
      s.progress_info.is_processing || s.progress_info.is_pending
    );

    if (projects.length > 0 && hasProcessingProjects) {
      startPolling();
    } else {
      stopPolling();
    }
    
    return () => stopPolling();
  }, [projects, statuses, startPolling, stopPolling]);

  return {
    statuses,
    loading,
    refresh: fetchAllStatuses,
    startPolling,
    stopPolling,
    
    // Helper functions
    getProjectStatus: (usageId: string) => statuses[usageId] || null,
    isProjectProcessing: (usageId: string) => {
      const status = statuses[usageId];
      return status ? (status.progress_info.is_processing || status.progress_info.is_pending) : false;
    }
  };
};
