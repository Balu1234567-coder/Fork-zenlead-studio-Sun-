import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UrlStateManager } from '@/lib/urlStateManager';
import { ProjectUtils } from '@/lib/projectUtils';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowRight, Info } from 'lucide-react';

interface UniqueUrlHandlerProps {
  children: React.ReactNode;
  onProjectResolved?: (projectData: any) => void;
  onStateRecovered?: (state: any) => void;
}

/**
 * UniqueUrlHandler - Manages unique URL state for book generation
 * 
 * This component:
 * 1. Handles page refresh recovery
 * 2. Resolves unique URLs to project data
 * 3. Manages URL state persistence
 * 4. Provides navigation helpers
 */
const UniqueUrlHandler: React.FC<UniqueUrlHandlerProps> = ({ 
  children, 
  onProjectResolved,
  onStateRecovered 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [isResolved, setIsResolved] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshInfo, setRefreshInfo] = useState<any>(null);

  useEffect(() => {
    handleUrlResolution();
  }, [location.pathname, location.search]);

  const handleUrlResolution = async () => {
    try {
      setHasError(false);
      
      // Check if this is a refresh scenario
      const refreshResult = UrlStateManager.handlePageRefresh();
      
      if (refreshResult.should_resume && refreshResult.project_data) {
        setRefreshInfo({
          project_title: refreshResult.project_data.project_title,
          status: refreshResult.project_data.status,
          can_resume: refreshResult.should_resume,
          view_mode: refreshResult.view_mode
        });
        
        // Track URL access
        UrlStateManager.trackUrlAccess(refreshResult.url_slug!, 'direct');
        
        // Notify parent components
        if (onProjectResolved) {
          onProjectResolved(refreshResult.project_data);
        }
        
        if (onStateRecovered && refreshResult.should_resume) {
          const state = UrlStateManager.getGenerationState(refreshResult.url_slug!);
          onStateRecovered(state);
        }
        
        toast({
          title: "Project Restored",
          description: `Restored "${refreshResult.project_data.project_title}" from unique URL`,
          duration: 3000
        });
      }
      
      setIsResolved(true);
      
    } catch (error: any) {
      console.error('URL resolution error:', error);
      setHasError(true);
      setErrorMessage(error.message || 'Failed to resolve project from URL');
      
      toast({
        title: "URL Resolution Error",
        description: "Could not resolve project from this URL",
        variant: "destructive"
      });
    }
  };

  const handleRetryResolution = () => {
    setIsResolved(false);
    setHasError(false);
    handleUrlResolution();
  };

  const handleNavigateToProjects = () => {
    navigate('/book-projects');
  };

  // Show loading state while resolving
  if (!isResolved && !hasError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Resolving unique URL...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="max-w-md w-full space-y-6">
          <Alert variant="destructive">
            <AlertDescription>
              <strong>URL Resolution Failed</strong>
              <br />
              {errorMessage}
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <Button onClick={handleRetryResolution} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Resolution
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleNavigateToProjects}
              className="w-full"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Go to Projects
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show refresh recovery info if available
  const showRefreshInfo = refreshInfo && refreshInfo.can_resume;

  return (
    <div className="relative">
      {showRefreshInfo && (
        <Alert className="mb-4 border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>Project Recovered:</strong> {refreshInfo.project_title}
                <br />
                <span className="text-sm">
                  Status: {refreshInfo.status} • 
                  Mode: {refreshInfo.view_mode} • 
                  URL is preserved and refreshable
                </span>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setRefreshInfo(null)}
                className="ml-4"
              >
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {children}
    </div>
  );
};

// Helper hook for using unique URL features
export const useUniqueUrl = () => {
  const location = useLocation();
  
  const getCurrentIdentifier = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    return pathSegments[pathSegments.length - 1] || null;
  };
  
  const getViewMode = () => {
    const params = new URLSearchParams(location.search);
    return params.get('view') as 'live' | 'viewer' | 'edit' | null;
  };
  
  const getAction = () => {
    const params = new URLSearchParams(location.search);
    return params.get('action');
  };
  
  const updateViewMode = (mode: 'live' | 'viewer' | 'edit') => {
    UrlStateManager.updateUrlParameters({ view: mode });
  };
  
  const clearParams = () => {
    UrlStateManager.updateUrlParameters({ view: '', action: '' });
  };
  
  const navigateToBook = (urlSlug: string, viewMode?: 'live' | 'viewer' | 'edit') => {
    UrlStateManager.navigateToBook(urlSlug, viewMode);
  };
  
  const saveState = (state: any) => {
    const identifier = getCurrentIdentifier();
    if (identifier) {
      UrlStateManager.saveGenerationState(identifier, state);
    }
  };
  
  return {
    identifier: getCurrentIdentifier(),
    viewMode: getViewMode(),
    action: getAction(),
    updateViewMode,
    clearParams,
    navigateToBook,
    saveState,
    canRefresh: UrlStateManager.canRefreshPage()
  };
};

export default UniqueUrlHandler;
