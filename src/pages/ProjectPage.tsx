import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LayoutWithSidebar from '@/components/LayoutWithSidebar';
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
  StopCircle,
  RefreshCw,
  Eye,
  Clock,
  CalendarDays,
  Loader2,
  CheckCircle,
  XCircle,
  Ban,
  Book,
  AlertCircle
} from 'lucide-react';
import ProjectApiService, { ProjectDetail, ProjectStatus } from '@/lib/projectApiService';

const ProjectPage: React.FC = () => {
  const { projectType, usageId } = useParams<{ projectType: string; usageId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [status, setStatus] = useState<ProjectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (usageId && projectType) {
      loadProject();
    }
    
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [usageId, projectType]);

  useEffect(() => {
    // Start/stop polling based on project status
    if (status && (status.progress_info.is_processing || status.progress_info.is_pending)) {
      startStatusPolling();
    } else {
      stopStatusPolling();
    }
    
    return () => stopStatusPolling();
  }, [status?.progress_info]);

  const loadProject = async () => {
    if (!usageId || !projectType) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Load project details based on type
      let projectData: ProjectDetail;
      
      if (projectType === 'long-form-book') {
        projectData = await ProjectApiService.getBookProject(usageId);
      } else {
        // For other project types, we'll need to implement their specific endpoints
        throw new Error(`Project type ${projectType} not yet implemented`);
      }
      
      setProject(projectData);
      
      // Also load current status
      const statusData = await ProjectApiService.getProjectStatus(usageId, projectType);
      setStatus(statusData);
      
    } catch (error: any) {
      console.error('Failed to load project:', error);
      setError(error.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const startStatusPolling = () => {
    if (pollingInterval || !usageId || !projectType) return;
    
    const interval = setInterval(async () => {
      try {
        const statusData = await ProjectApiService.getProjectStatus(usageId, projectType);
        setStatus(statusData);
        
        // Update project data if status changed to completed
        if (statusData.progress_info.is_completed && project) {
          loadProject();
        }
        
        // Stop polling if no longer processing
        if (!statusData.progress_info.is_processing && !statusData.progress_info.is_pending) {
          stopStatusPolling();
        }
      } catch (error) {
        console.error('Failed to poll status:', error);
      }
    }, 5000); // Poll every 5 seconds
    
    setPollingInterval(interval);
  };

  const stopStatusPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  const handleAction = async (action: string) => {
    if (!project || !usageId) return;
    
    try {
      switch (action) {
        case 'download':
          if (projectType === 'long-form-book') {
            const pdfData = await ProjectApiService.downloadBookPDF(usageId);
            
            // Create download link
            const link = document.createElement('a');
            link.href = `data:application/pdf;base64,${pdfData.pdf_base64}`;
            link.download = pdfData.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast({
              title: "Success",
              description: "PDF downloaded successfully"
            });
          }
          break;
          
        case 'duplicate':
          const duplicateData = await ProjectApiService.duplicateProject(usageId, projectType);
          toast({
            title: "Success",
            description: "Project settings retrieved for duplication"
          });
          // Navigate to creation page with settings
          if (projectType === 'long-form-book') {
            navigate('/text-processing', { state: { duplicateSettings: duplicateData.settings } });
          }
          break;
          
        case 'cancel':
          await ProjectApiService.cancelProject(usageId, projectType);
          toast({
            title: "Success",
            description: "Project cancelled successfully"
          });
          loadProject(); // Refresh to show updated status
          break;
          
        case 'refresh':
          loadProject();
          break;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to perform action",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (statusValue: string) => {
    switch (statusValue) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'cancelled':
        return <Ban className="w-5 h-5 text-gray-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'processing':
        return 'text-blue-600 bg-blue-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Project not found'}
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
        <Footer />
      </div>
    );
  }

  const isProcessing = status?.progress_info.is_processing || status?.progress_info.is_pending;
  const canDownload = project.navigation.can_download_pdf && project.status === 'completed';
  const canCancel = project.navigation.can_cancel && isProcessing;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Project Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="w-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600 shrink-0">
              <Book className="w-5 h-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold truncate">
                  {project.book_data?.title || project.project_name}
                </h1>
                <Badge variant="outline" className={getStatusColor(project.status)}>
                  {getStatusIcon(project.status)}
                  <span className="ml-1 capitalize">{project.status}</span>
                </Badge>
              </div>
              
              {project.book_data?.concept && (
                <p className="text-muted-foreground text-sm mb-2">{project.book_data.concept}</p>
              )}
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-4 h-4" />
                  {new Date(project.created_at).toLocaleDateString()}
                </span>
                <span>{project.credits_used} credits used</span>
                {project.book_data?.genre && (
                  <span>{project.book_data.genre}</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {canDownload && (
                <Button onClick={() => handleAction('download')}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              )}
              
              {canCancel && (
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
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Progress bar for processing projects */}
          {isProcessing && status && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {project.status === 'processing' ? 'Generating...' : 'Pending...'}
                </span>
                {status.estimated_completion && (
                  <span className="font-medium">ETA: {status.estimated_completion}</span>
                )}
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300 animate-pulse"
                  style={{ width: project.status === 'processing' ? '60%' : '10%' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Project Content */}
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
                  <p className="text-2xl font-bold capitalize">
                    {projectType?.replace('-', ' ')}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    AI-powered content generation
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(project.status)}
                    <span className="text-2xl font-bold capitalize">{project.status}</span>
                  </div>
                  {isProcessing && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Your project is being generated...
                    </p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Created</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {new Date(project.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(project.created_at).toLocaleTimeString()}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {project.status === 'failed' && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {project.error_message || 'This project failed to complete. You can try duplicating it to start over with the same settings.'}
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
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Project ID:</span>
                    <span className="ml-2 font-mono">{project.usage_id}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <span className="ml-2">{project.project_type}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <span className="ml-2">{new Date(project.created_at).toLocaleString()}</span>
                  </div>
                  {project.completed_at && (
                    <div>
                      <span className="text-muted-foreground">Completed:</span>
                      <span className="ml-2">{new Date(project.completed_at).toLocaleString()}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Credits Used:</span>
                    <span className="ml-2">{project.credits_used}</span>
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
                {project.book_data?.settings ? (
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                    {JSON.stringify(project.book_data.settings, null, 2)}
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
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Your project has been completed successfully. You can download or view the results.
                    </p>
                    <div className="flex gap-2">
                      {canDownload && (
                        <Button onClick={() => handleAction('download')}>
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </Button>
                      )}
                      <Button variant="outline" onClick={() => handleAction('duplicate')}>
                        <Copy className="w-4 h-4 mr-2" />
                        Create Similar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
      
      <Footer />
    </div>
  );
};

export default ProjectPage;
