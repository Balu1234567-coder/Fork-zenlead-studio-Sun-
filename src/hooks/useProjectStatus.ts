import { useState, useEffect, useCallback, useRef } from 'react';
import { Project, ProjectStatus } from '@/types/projects';
import { ProjectsApiService, ProjectUtils } from '@/lib/projectsApiService';

interface UseProjectStatusOptions {
  projectId: string;
  pollInterval?: number; // in milliseconds, default 3000
  enablePolling?: boolean; // default true
  onStatusChange?: (status: ProjectStatus, project?: Project) => void;
  onComplete?: (project: Project) => void;
  onError?: (error: Error) => void;
}

interface ProjectStatusState {
  status: ProjectStatus | null;
  progress?: number;
  currentStep?: string;
  estimatedTime?: number;
  lastUpdated: Date | null;
  isPolling: boolean;
  error: string | null;
}

export const useProjectStatus = (options: UseProjectStatusOptions) => {
  const {
    projectId,
    pollInterval = 3000,
    enablePolling = true,
    onStatusChange,
    onComplete,
    onError
  } = options;

  const [state, setState] = useState<ProjectStatusState>({
    status: null,
    progress: undefined,
    currentStep: undefined,
    estimatedTime: undefined,
    lastUpdated: null,
    isPolling: false,
    error: null
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
    if (!projectId || !mountedRef.current) return;

    try {
      const response = await ProjectsApiService.getProjectStatus(projectId);
      
      if (!mountedRef.current) return;

      if (response.success) {
        const { status, progress, currentStep, estimatedTime } = response.data;
        
        setState(prev => {
          const newState = {
            ...prev,
            status,
            progress,
            currentStep,
            estimatedTime,
            lastUpdated: new Date(),
            error: null
          };

          // Call status change callback if status changed
          if (prev.status !== status && onStatusChange) {
            onStatusChange(status);
          }

          return newState;
        });

        // If project completed, fetch full project data and call completion callback
        if (status === 'completed' && onComplete) {
          try {
            const projectResponse = await ProjectsApiService.getProject(projectId);
            if (projectResponse.success && mountedRef.current) {
              onComplete(projectResponse.data);
            }
          } catch (error) {
            // Ignore errors when fetching full project data
            console.warn('Failed to fetch completed project data:', error);
          }
        }

        // Stop polling if project is no longer processing
        if (!['processing', 'pending'].includes(status)) {
          stopPolling();
        }
      } else {
        if (mountedRef.current) {
          setState(prev => ({
            ...prev,
            error: response.error || 'Failed to fetch status',
            lastUpdated: new Date()
          }));
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch project status:', error);
      
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          error: error.message || 'Failed to fetch status',
          lastUpdated: new Date()
        }));
        
        if (onError) {
          onError(error);
        }
      }
    }
  }, [projectId, onStatusChange, onComplete, onError, stopPolling]);

  const startPolling = useCallback(() => {
    if (!enablePolling || intervalRef.current) return;

    setState(prev => ({ ...prev, isPolling: true }));
    
    // Fetch immediately
    fetchStatus();
    
    // Then set up interval
    intervalRef.current = setInterval(fetchStatus, pollInterval);
  }, [enablePolling, fetchStatus, pollInterval]);

  // Auto-start polling when project ID changes or when initially enabled
  useEffect(() => {
    if (projectId && enablePolling) {
      startPolling();
    } else {
      stopPolling();
    }
    
    return () => stopPolling();
  }, [projectId, enablePolling, startPolling, stopPolling]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Determine if should auto-poll based on current status
  const shouldPoll = state.status && ['processing', 'pending'].includes(state.status);

  // Auto-manage polling based on status
  useEffect(() => {
    if (shouldPoll && enablePolling && !intervalRef.current) {
      startPolling();
    } else if (!shouldPoll && intervalRef.current) {
      stopPolling();
    }
  }, [shouldPoll, enablePolling, startPolling, stopPolling]);

  return {
    // Current state
    status: state.status,
    progress: state.progress,
    currentStep: state.currentStep,
    estimatedTime: state.estimatedTime,
    lastUpdated: state.lastUpdated,
    isPolling: state.isPolling,
    error: state.error,
    
    // Helper functions
    refresh,
    startPolling,
    stopPolling,
    
    // Computed values
    isProcessing: state.status ? ['processing', 'pending'].includes(state.status) : false,
    isCompleted: state.status === 'completed',
    isFailed: state.status === 'failed',
    isCancelled: state.status === 'cancelled'
  };
};

// Hook for managing multiple project statuses
export const useProjectsStatus = (projectIds: string[], options?: {
  pollInterval?: number;
  enablePolling?: boolean;
  onProjectStatusChange?: (projectId: string, status: ProjectStatus) => void;
}) => {
  const {
    pollInterval = 5000, // Longer interval for multiple projects
    enablePolling = true,
    onProjectStatusChange
  } = options || {};

  const [statuses, setStatuses] = useState<Record<string, {
    status: ProjectStatus;
    progress?: number;
    currentStep?: string;
    lastUpdated: Date;
  }>>({});

  const [isPolling, setIsPolling] = useState(false);
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
    if (!projectIds.length || !mountedRef.current) return;

    try {
      const promises = projectIds.map(async (projectId) => {
        try {
          const response = await ProjectsApiService.getProjectStatus(projectId);
          return {
            projectId,
            success: response.success,
            data: response.data,
            error: response.error
          };
        } catch (error) {
          return {
            projectId,
            success: false,
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });

      const results = await Promise.all(promises);
      
      if (!mountedRef.current) return;

      const newStatuses: typeof statuses = {};
      let hasProcessingProjects = false;

      results.forEach(({ projectId, success, data, error }) => {
        if (success && data) {
          const prevStatus = statuses[projectId]?.status;
          
          newStatuses[projectId] = {
            status: data.status,
            progress: data.progress,
            currentStep: data.currentStep,
            lastUpdated: new Date()
          };

          // Call status change callback if status changed
          if (prevStatus !== data.status && onProjectStatusChange) {
            onProjectStatusChange(projectId, data.status);
          }

          // Check if any project is still processing
          if (['processing', 'pending'].includes(data.status)) {
            hasProcessingProjects = true;
          }
        }
      });

      setStatuses(newStatuses);

      // Stop polling if no projects are processing
      if (!hasProcessingProjects && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsPolling(false);
      }
    } catch (error) {
      console.error('Failed to fetch project statuses:', error);
    }
  }, [projectIds, statuses, onProjectStatusChange]);

  const startPolling = useCallback(() => {
    if (!enablePolling || intervalRef.current) return;

    setIsPolling(true);
    
    // Fetch immediately
    fetchAllStatuses();
    
    // Then set up interval
    intervalRef.current = setInterval(fetchAllStatuses, pollInterval);
  }, [enablePolling, fetchAllStatuses, pollInterval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Auto-start polling when project IDs change
  useEffect(() => {
    const hasProcessingProjects = Object.values(statuses).some(s => 
      ['processing', 'pending'].includes(s.status)
    );

    if (projectIds.length > 0 && enablePolling && hasProcessingProjects) {
      startPolling();
    } else {
      stopPolling();
    }
    
    return () => stopPolling();
  }, [projectIds, enablePolling, statuses, startPolling, stopPolling]);

  return {
    statuses,
    isPolling,
    refresh: fetchAllStatuses,
    startPolling,
    stopPolling,
    
    // Helper functions
    getProjectStatus: (projectId: string) => statuses[projectId]?.status || null,
    getProjectProgress: (projectId: string) => statuses[projectId]?.progress,
    isProjectProcessing: (projectId: string) => {
      const status = statuses[projectId]?.status;
      return status ? ['processing', 'pending'].includes(status) : false;
    }
  };
};
