import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Project, ProjectStatus, PROJECT_TYPE_CONFIG, PROJECT_STATUS_CONFIG } from '@/types/projects';
import { ProjectsApiService, ProjectUtils } from '@/lib/projectsApiService';
import { ProjectLayout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Download,
  Copy,
  Trash2,
  StopCircle,
  RefreshCw,
  Eye,
  Settings,
  Share,
  Clock,
  CalendarDays,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  Ban,
  Book,
  Image,
  AudioWaveform,
  Video,
  Mic,
  Volume2,
  GraduationCap,
  Mail,
  Search
} from 'lucide-react';

// Icon mapping
const iconMap = {
  Book, Image, AudioWaveform, Video, FileText, Mic, Volume2, GraduationCap, Mail,
  Search, Loader2, CheckCircle, XCircle, Ban, Clock
};

interface ProjectPageState {
  project: Project | null;
  loading: boolean;
  error: string | null;
  statusPolling: boolean;
}

const ProjectPage: React.FC = () => {
  const { projectType, projectId } = useParams<{ projectType: string; projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [state, setState] = useState<ProjectPageState>({
    project: null,
    loading: true,
    error: null,
    statusPolling: false
  });

  // Polling interval for processing projects
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
    
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [projectId]);

  useEffect(() => {
    // Start/stop polling based on project status
    if (state.project && ProjectUtils.isProcessing(state.project)) {
      startStatusPolling();
    } else {
      stopStatusPolling();
    }
    
    return () => stopStatusPolling();
  }, [state.project?.status]);

  const loadProject = async () => {
    if (!projectId) return;
    
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await ProjectsApiService.getProject(projectId);
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          project: response.data,
          loading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to load project',
          loading: false
        }));
      }
    } catch (error: any) {
      console.error('Failed to load project:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to load project',
        loading: false
      }));
    }
  };

  const startStatusPolling = () => {
    if (pollingInterval) return; // Already polling
    
    const interval = setInterval(async () => {
      if (!projectId || !state.project) return;
      
      try {
        setState(prev => ({ ...prev, statusPolling: true }));
        
        const response = await ProjectsApiService.getProjectStatus(projectId);
        
        if (response.success) {
          setState(prev => {
            if (!prev.project) return prev;
            
            return {
              ...prev,
              project: {
                ...prev.project,
                status: response.data.status,
                metadata: {
                  ...prev.project.metadata,
                  progress: response.data.progress,
                  currentStep: response.data.currentStep,
                  estimatedTime: response.data.estimatedTime
                }
              },
              statusPolling: false
            };
          });
          
          // Stop polling if project is no longer processing
          if (!['processing', 'pending'].includes(response.data.status)) {
            stopStatusPolling();
            // Reload full project data to get final results
            setTimeout(loadProject, 1000);
          }
        }
      } catch (error) {
        console.error('Failed to poll status:', error);
        setState(prev => ({ ...prev, statusPolling: false }));
      }
    }, 3000); // Poll every 3 seconds
    
    setPollingInterval(interval);
  };

  const stopStatusPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  const handleAction = async (action: string) => {
    if (!state.project) return;
    
    switch (action) {
      case 'duplicate':
        try {
          const response = await ProjectsApiService.duplicateProject(state.project.id);
          if (response.success) {
            toast({
              title: "Success",
              description: "Project duplicated successfully"
            });
            
            // Navigate to the new project
            const newProjectUrl = ProjectUtils.generateProjectUrl(response.data);
            navigate(newProjectUrl);
          }
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message || "Failed to duplicate project",
            variant: "destructive"
          });
        }
        break;
        
      case 'delete':
        if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
          try {
            const response = await ProjectsApiService.deleteProject(state.project.id);
            if (response.success) {
              toast({
                title: "Success",
                description: "Project deleted successfully"
              });
              
              // Navigate back to projects list
              navigate('/dashboard');
            }
          } catch (error: any) {
            toast({
              title: "Error",
              description: error.message || "Failed to delete project",
              variant: "destructive"
            });
          }
        }
        break;
        
      case 'cancel':
        if (confirm('Are you sure you want to cancel this project?')) {
          try {
            const response = await ProjectsApiService.cancelProject(state.project.id);
            if (response.success) {
              toast({
                title: "Success",
                description: "Project cancelled successfully"
              });
              loadProject(); // Reload to get updated status
            }
          } catch (error: any) {
            toast({
              title: "Error",
              description: error.message || "Failed to cancel project",
              variant: "destructive"
            });
          }
        }
        break;
        
      case 'download':
        if (state.project.resultUrl) {
          window.open(state.project.resultUrl, '_blank');
        }
        break;
        
      case 'refresh':
        loadProject();
        break;
    }
  };

  const ProjectHeader: React.FC<{ project: Project }> = ({ project }) => {
    const config = PROJECT_TYPE_CONFIG[project.type];
    const statusConfig = PROJECT_STATUS_CONFIG[project.status];
    const Icon = iconMap[config.icon as keyof typeof iconMap];
    const StatusIcon = iconMap[statusConfig.icon as keyof typeof iconMap];
    const metadata = ProjectUtils.formatMetadata(project);
    const isProcessing = ProjectUtils.isProcessing(project);

    return (
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${config.color}-100 text-${config.color}-600 shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold truncate">{project.title}</h1>
                <Badge variant="outline" className={statusConfig.color}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig.displayName}
                </Badge>
                {state.statusPolling && (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>
              
              {project.description && (
                <p className="text-muted-foreground text-sm mb-2">{project.description}</p>
              )}
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-4 h-4" />
                  {new Date(project.metadata.createdAt).toLocaleDateString()}
                </span>
                {metadata.map((item, index) => (
                  <span key={index}>{item}</span>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {project.status === 'completed' && project.resultUrl && (
                <Button onClick={() => handleAction('download')}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
              
              {isProcessing && (
                <Button
                  variant="outline"
                  onClick={() => handleAction('cancel')}
                >
                  <StopCircle className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => handleAction('duplicate')}
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleAction('refresh')}
                disabled={state.loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${state.loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleAction('delete')}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Progress bar for processing projects */}
          {isProcessing && project.metadata.progress !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {project.metadata.currentStep || 'Processing...'}
                </span>
                <span className="font-medium">{project.metadata.progress}%</span>
              </div>
              <Progress value={project.metadata.progress} className="h-2" />
              {project.metadata.estimatedTime && (
                <p className="text-xs text-muted-foreground">
                  Estimated completion: {ProjectUtils.getEstimatedCompletion(project) || 'Calculating...'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const ProjectContent: React.FC<{ project: Project }> = ({ project }) => {
    return (
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            {project.status === 'completed' && (
              <TabsTrigger value="results">Results</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Project Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{PROJECT_TYPE_CONFIG[project.type].displayName}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {PROJECT_TYPE_CONFIG[project.type].description}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={PROJECT_STATUS_CONFIG[project.status].color}>
                      {PROJECT_STATUS_CONFIG[project.status].displayName}
                    </Badge>
                  </div>
                  {ProjectUtils.isProcessing(project) && project.metadata.progress !== undefined && (
                    <div className="mt-2">
                      <Progress value={project.metadata.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {project.metadata.progress}% complete
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Created</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {new Date(project.metadata.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(project.metadata.createdAt).toLocaleTimeString()}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {project.status === 'failed' && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  This project failed to complete. You can try duplicating it to start over with the same settings.
                </AlertDescription>
              </Alert>
            )}
            
            {project.status === 'cancelled' && (
              <Alert>
                <Ban className="h-4 w-4" />
                <AlertDescription>
                  This project was cancelled. You can duplicate it to start over with the same settings.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Metadata</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <span className="ml-2">{new Date(project.metadata.createdAt).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Updated:</span>
                      <span className="ml-2">{new Date(project.metadata.updatedAt).toLocaleString()}</span>
                    </div>
                    {project.metadata.wordCount && (
                      <div>
                        <span className="text-muted-foreground">Word Count:</span>
                        <span className="ml-2">{project.metadata.wordCount.toLocaleString()}</span>
                      </div>
                    )}
                    {project.metadata.chapterCount && (
                      <div>
                        <span className="text-muted-foreground">Chapters:</span>
                        <span className="ml-2">{project.metadata.chapterCount}</span>
                      </div>
                    )}
                    {project.metadata.duration && (
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="ml-2">{Math.round(project.metadata.duration / 1000)}s</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Settings</CardTitle>
              </CardHeader>
              <CardContent>
                {project.settingsSnapshot ? (
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                    {JSON.stringify(project.settingsSnapshot, null, 2)}
                  </pre>
                ) : (
                  <p className="text-muted-foreground">No settings data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {project.status === 'completed' && (
            <TabsContent value="results" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {project.resultUrl ? (
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Your project has been completed successfully. You can download or view the results.
                      </p>
                      <div className="flex gap-2">
                        <Button onClick={() => handleAction('download')}>
                          <Download className="w-4 h-4 mr-2" />
                          Download Results
                        </Button>
                        <Button variant="outline" onClick={() => window.open(project.resultUrl, '_blank')}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Online
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No results available for download</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    );
  };

  if (state.loading) {
    return (
      <ProjectLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </ProjectLayout>
    );
  }

  if (state.error || !state.project) {
    return (
      <ProjectLayout>
        <div className="container mx-auto px-4 py-12">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {state.error || 'Project not found'}
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => navigate('/dashboard')}
            className="mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </ProjectLayout>
    );
  }

  return (
    <ProjectLayout>
      <ProjectHeader project={state.project} />
      <ProjectContent project={state.project} />
    </ProjectLayout>
  );
};

export default ProjectPage;
