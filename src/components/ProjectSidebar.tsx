import React, { useState, useEffect } from 'react';
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
import { BookApiService } from "@/lib/bookApi";
import { format } from 'date-fns';

interface ProjectData {
  usage_id: string;
  title: string;
  status: string;
  progress: number;
  current_chapter?: number;
  total_chapters?: number;
  created_at: string;
  last_activity: string;
  url_slug: string;
  thumbnail?: string;
  can_resume: boolean;
  estimated_completion?: string;
  is_live: boolean;
  credits_used: number;
  word_count?: number;
  current_operation?: string;
  quick_actions: string[];
}

interface SidebarData {
  active_projects: ProjectData[];
  recent_projects: ProjectData[];
  templates: any[];
  user_stats: {
    total_books: number;
    active_generations: number;
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

  const fetchSidebarData = async () => {
    try {
      setRefreshing(true);

      // Call your new backend endpoint for real-time dashboard
      const response = await fetch('/api/ai/long-form-book/dashboard/real-time', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch sidebar data');

      const result = await response.json();

      if (result.success) {
        // Map the enhanced backend response to frontend structure
        const enhancedProjects = (result.data.active_generations || []).map((project: any) => ({
          usage_id: project.usage_id,
          title: project.title,
          status: project.status,
          progress: project.progress || 0,
          current_chapter: project.current_chapter,
          total_chapters: project.total_chapters,
          created_at: project.created_at,
          last_activity: project.updated_at || project.created_at,
          url_slug: project.url_slug,
          thumbnail: project.thumbnail,
          can_resume: project.can_resume,
          estimated_completion: project.estimated_completion,
          is_live: project.status === 'processing',
          credits_used: project.credits_used,
          word_count: project.word_count,
          current_operation: project.current_operation,
          quick_actions: project.status === 'processing' ? ['pause', 'view_live'] :
                         project.can_resume ? ['resume', 'view_live'] : ['view_live']
        }));

        const recentProjects = (result.data.recent_projects || []).map((project: any) => ({
          usage_id: project.usage_id,
          title: project.title,
          status: project.status,
          progress: project.progress || 0,
          current_chapter: project.current_chapter,
          total_chapters: project.total_chapters,
          created_at: project.created_at,
          last_activity: project.updated_at || project.created_at,
          url_slug: project.url_slug,
          thumbnail: project.thumbnail,
          can_resume: project.can_resume,
          estimated_completion: project.estimated_completion,
          is_live: project.status === 'processing',
          credits_used: project.credits_used,
          word_count: project.word_count,
          current_operation: project.current_operation,
          quick_actions: project.status === 'completed' ? ['download_pdf', 'view'] :
                         project.status === 'processing' ? ['pause', 'view_live'] :
                         project.can_resume ? ['resume'] : ['view']
        }));

        const data: SidebarData = {
          active_projects: enhancedProjects,
          recent_projects: recentProjects,
          templates: [],
          user_stats: {
            total_books: result.data.summary?.total_projects || 0,
            active_generations: result.data.summary?.active_projects || 0,
            credits_remaining: 150, // You'd get this from user endpoint
            this_month_usage: result.data.summary?.total_credits_used || 0
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
  };

  useEffect(() => {
    if (isOpen) {
      fetchSidebarData();
    }
  }, [isOpen]);

  const handleProjectClick = (project: ProjectData) => {
    onClose(); // Close sidebar before navigation

    if (project.status === 'processing' && project.is_live) {
      // Navigate to live generation view
      navigate(`/${project.url_slug}?view=live`);
    } else if (project.status === 'completed') {
      // Navigate to completed book view
      navigate(`/${project.url_slug}`);
    } else if (project.can_resume) {
      // Navigate to resume generation
      navigate(`/${project.url_slug}?action=resume`);
    } else {
      // Default view
      navigate(`/${project.url_slug}`);
    }
  };

  const handleQuickAction = async (project: ProjectData, action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      switch (action) {
        case 'pause':
          await fetch(`/api/ai/long-form-book/${project.usage_id}/pause`, {
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
          navigate(`/book-generation/${project.url_slug}?view=live`);
          break;
          
        case 'download_pdf':
          try {
            const response = await fetch(`/api/ai/long-form-book/${project.usage_id}/pdf`, {
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
          await fetch(`/api/ai/long-form-book/${project.usage_id}/resume`, {
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
          navigate(`/${project.url_slug}?view=live`);
          break;

        case 'view':
          navigate(`/book-generation/${project.url_slug}`);
          break;

        case 'download_partial':
          // Download partial content
          toast({
            title: "Downloading",
            description: "Preparing partial content download...",
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
                {action === 'download_partial' && <Download className="h-3 w-3" />}
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
          {sidebarData && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="text-center p-2 bg-muted/30 rounded">
                <div className="font-semibold">{sidebarData.user_stats.total_books}</div>
                <div className="text-muted-foreground">Total Books</div>
              </div>
              <div className="text-center p-2 bg-muted/30 rounded">
                <div className="font-semibold">{sidebarData.user_stats.active_generations}</div>
                <div className="text-muted-foreground">Active</div>
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
              {/* Active Projects */}
              {sidebarData.active_projects.length > 0 && (
                <div>
                  <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    Active Generations ({sidebarData.active_projects.length})
                  </h3>
                  {sidebarData.active_projects.map((project) => (
                    <ProjectCard key={project.usage_id} project={project} />
                  ))}
                </div>
              )}

              {/* Recent Projects */}
              {sidebarData.recent_projects.length > 0 && (
                <div>
                  <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Book className="h-4 w-4" />
                    Recent Projects
                  </h3>
                  {sidebarData.recent_projects.slice(0, 8).map((project) => (
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
                    navigate('/ai-studio/long-form-book');
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
                    navigate('/book-projects');
                    onClose();
                  }}
                >
                  <Book className="h-4 w-4 mr-2" />
                  View All Projects
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
                  navigate('/ai-studio/long-form-book');
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
        {sidebarData && (
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
