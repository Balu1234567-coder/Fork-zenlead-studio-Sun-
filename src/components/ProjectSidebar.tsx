import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Book,
  Play,
  Pause,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Download,
  RefreshCw,
  Plus,
  MoreVertical,
  Loader2,
  CreditCard,
  Calendar,
  ArrowRight,
  BookOpen
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/apiService";
import { format } from 'date-fns';

interface ProjectData {
  usage_id: string;
  project_type: string;
  project_name: string;
  title: string;
  status: string;
  progress: number;
  current_chapter?: number;
  total_chapters?: number;
  created_at: string;
  last_activity: string;
  url_slug: string;
  project_url: string;
  thumbnail?: string;
  can_resume: boolean;
  estimated_completion?: string;
  is_live: boolean;
  credits_used: number;
  word_count?: number;
  current_operation?: string;
  quick_actions: string[];
  status_info: {
    color: string;
    icon: string;
    can_open: boolean;
    is_processing: boolean;
    progress_available: boolean;
  };
}

interface SidebarData {
  projects: ProjectData[];
  projects_by_type: Record<string, ProjectData[]>;
  pagination: any;
  summary: {
    total: number;
    processing: number;
    completed: number;
    failed: number;
    by_type: Record<string, number>;
  };
  user_stats: {
    total_projects: number;
    processing_projects: number;
    credits_remaining: number;
    this_month_usage: number;
  };
}

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ isOpen, onClose, className = "" }) => {
  const [sidebarData, setSidebarData] = useState<SidebarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Auto-refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSidebarData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchSidebarData = useCallback(async (silent: boolean = false) => {
    try {
      if (!silent) setLoading(true);
      setRefreshing(true);

      // Call the new projects endpoint for all AI projects
      const response = await fetch('/api/ai/projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch sidebar data');

      const result = await response.json();

      if (result.success) {
        // Map the projects to sidebar format
        const allProjects = result.data.projects.map((project: any) => ({
          ...project,
          title: project.title || project.project_name,
          last_activity: project.completed_at || project.created_at,
          quick_actions: getQuickActionsForProject(project)
        }));

        const data: SidebarData = {
          projects: allProjects,
          projects_by_type: result.data.projects_by_type,
          pagination: result.data.pagination,
          summary: result.data.summary,
          user_stats: {
            total_projects: result.data.summary?.total || 0,
            processing_projects: result.data.summary?.processing || 0,
            credits_remaining: 150, // You'd get this from user endpoint
            this_month_usage: 0 // Calculate from projects
          }
        };

        setSidebarData(data);
      }
    } catch (error: any) {
      console.error('Sidebar fetch error:', error);
      toast({
        title: "Error",
        description: "Failed to load project data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  const getQuickActionsForProject = (project: any): string[] => {
    const actions = [];
    
    if (project.status === 'processing') {
      actions.push('pause', 'view_live');
    } else if (project.status === 'completed') {
      if (project.project_type === 'long-form-book') {
        actions.push('download_pdf', 'view');
      } else {
        actions.push('view', 'download');
      }
    } else if (project.status === 'pending') {
      actions.push('resume');
    } else {
      actions.push('view');
    }
    
    return actions;
  };

  useEffect(() => {
    if (isOpen) {
      fetchSidebarData();
    }
  }, [isOpen]);

  const handleProjectClick = (project: ProjectData) => {
    // Use the project_url from backend for proper routing
    if (project.project_url) {
      navigate(project.project_url);
    } else {
      // Fallback to project type specific routing
      if (project.project_type === 'long-form-book') {
        if (project.status === 'processing') {
          navigate(`/text/long-form-book/${project.usage_id}?view=live`);
        } else {
          navigate(`/text/long-form-book/${project.usage_id}`);
        }
      } else {
        // For other project types, navigate to their specific routes
        navigate(`/text/${project.project_type}/${project.usage_id}`);
      }
    }
  };

  const handleQuickAction = async (project: ProjectData, action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      switch (action) {
        case 'pause':
          const pauseEndpoint = project.project_type === 'long-form-book' 
            ? `/api/ai/long-form-book/${project.usage_id}/pause`
            : `/api/ai/${project.project_type}/${project.usage_id}/pause`;
            
          await fetch(pauseEndpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          toast({
            title: "Paused",
            description: `${project.title} has been paused`,
          });
          fetchSidebarData();
          break;
          
        case 'view_live':
          if (project.project_type === 'long-form-book') {
            navigate(`/text/long-form-book/${project.usage_id}?view=live`);
          } else {
            navigate(`/text/${project.project_type}/${project.usage_id}?view=live`);
          }
          break;
          
        case 'download_pdf':
          try {
            const downloadEndpoint = project.project_type === 'long-form-book'
              ? `/api/ai/long-form-book/${project.usage_id}/pdf`
              : `/api/ai/${project.project_type}/${project.usage_id}/download`;
              
            const response = await fetch(downloadEndpoint, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data.pdf_base64) {
                const link = document.createElement('a');
                link.href = `data:application/pdf;base64,${result.data.pdf_base64}`;
                link.download = result.data.filename || `${project.title}.pdf`;
                link.click();

                toast({
                  title: "Downloaded",
                  description: "PDF downloaded successfully!",
                });
              }
            }
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to download PDF",
              variant: "destructive"
            });
          }
          break;

        case 'resume':
          const resumeEndpoint = project.project_type === 'long-form-book'
            ? `/api/ai/long-form-book/${project.usage_id}/resume`
            : `/api/ai/${project.project_type}/${project.usage_id}/resume`;
            
          await fetch(resumeEndpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
              'Content-Type': 'application/json'
            }
          });

          toast({
            title: "Resumed",
            description: `${project.title} generation resumed`,
          });
          if (project.project_type === 'long-form-book') {
            navigate(`/text/long-form-book/${project.usage_id}?view=live`);
          } else {
            navigate(`/text/${project.project_type}/${project.usage_id}?view=live`);
          }
          break;

        case 'view':
          handleProjectClick(project);
          break;

        case 'download':
          // Generic download action
          toast({
            title: "Downloading",
            description: "Preparing download...",
          });
          break;
          
        default:
          break;
      }
    } catch (error: any) {
      toast({
        title: "Error", 
        description: `Failed to ${action}: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string, isLive: boolean = false) => {
    if (isLive) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      default:
        return <Book className="h-4 w-4 text-gray-500" />;
    }
  };

  const ProjectCard: React.FC<{ project: ProjectData }> = ({ project }) => (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all mb-3 border-l-4 border-l-primary/20"
      onClick={() => handleProjectClick(project)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getStatusIcon(project.status, project.is_live)}
                <h3 className="font-medium text-sm truncate">{project.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(project.last_activity), 'MMM dd, HH:mm')}
              </p>
            </div>
            <Badge variant={project.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
              {project.status}
            </Badge>
          </div>

          {/* Progress for active projects */}
          {project.status === 'processing' && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-1" />
              {project.current_operation && (
                <p className="text-xs text-muted-foreground">
                  {project.current_operation}
                </p>
              )}
              {project.estimated_completion && (
                <p className="text-xs text-blue-600">
                  Est. {project.estimated_completion}
                </p>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{project.credits_used} credits</span>
            {project.current_chapter && project.total_chapters && (
              <span>Ch {project.current_chapter}/{project.total_chapters}</span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-1">
            {project.quick_actions.map((action) => (
              <Button
                key={action}
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs"
                onClick={(e) => handleQuickAction(project, action, e)}
                title={action.replace('_', ' ')}
              >
                {action === 'pause' && <Pause className="h-3 w-3" />}
                {action === 'view_live' && <Eye className="h-3 w-3" />}
                {action === 'download_pdf' && <Download className="h-3 w-3" />}
                {action === 'resume' && <Play className="h-3 w-3" />}
                {action === 'view' && <BookOpen className="h-3 w-3" />}
                {action === 'download' && <Download className="h-3 w-3" />}
              </Button>
            ))}
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-1 ml-auto"
              onClick={(e) => {
                e.stopPropagation();
                handleProjectClick(project);
              }}
            >
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-background border-r shadow-lg transform transition-transform duration-300 ${className}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">My Projects</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={fetchSidebarData} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* User Stats */}
          {sidebarData?.summary && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="text-center p-2 bg-muted/30 rounded">
                <div className="font-semibold">{sidebarData.summary.total}</div>
                <div className="text-muted-foreground">Total Projects</div>
              </div>
              <div className="text-center p-2 bg-muted/30 rounded">
                <div className="font-semibold">{sidebarData.summary.processing}</div>
                <div className="text-muted-foreground">Processing</div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : sidebarData ? (
            <div className="space-y-6">
              {/* Processing Projects */}
              {sidebarData.projects.filter(p => p.status === 'processing').length > 0 && (
                <div>
                  <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    Processing ({sidebarData.projects.filter(p => p.status === 'processing').length})
                  </h3>
                  {sidebarData.projects.filter(p => p.status === 'processing').map((project) => (
                    <ProjectCard key={project.usage_id} project={project} />
                  ))}
                </div>
              )}

              {/* Recent Projects */}
              {sidebarData.projects.filter(p => p.status !== 'processing').length > 0 && (
                <div>
                  <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Book className="h-4 w-4" />
                    Recent Projects
                  </h3>
                  {sidebarData.projects.filter(p => p.status !== 'processing').slice(0, 8).map((project) => (
                    <ProjectCard key={project.usage_id} project={project} />
                  ))}
                </div>
              )}

              {/* Quick Actions */}
              <div className="space-y-2">
                <Separator />
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => {
                    navigate('/text/long-form-book');
                    onClose();
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Book Project
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => {
                    navigate('/text');
                    onClose();
                  }}
                >
                  <Book className="h-4 w-4 mr-2" />
                  Text Studio
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No Projects Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start generating your first AI book
              </p>
              <Button 
                size="sm" 
                onClick={() => {
                  navigate('/text/long-form-book');
                  onClose();
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Book
              </Button>
            </div>
          )}
        </ScrollArea>

        {/* Footer Stats */}
        {sidebarData?.user_stats && (
          <div className="p-4 border-t bg-muted/20">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                {sidebarData.user_stats.credits_remaining} credits
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {sidebarData.user_stats.this_month_usage} used
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectSidebar;