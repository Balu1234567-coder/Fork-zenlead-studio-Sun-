import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Book, 
  Play, 
  Pause, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Download, 
  Eye,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Loader2,
  TrendingUp,
  Calendar,
  BarChart3,
  Settings,
  Archive,
  Trash2,
  Star,
  Share2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EnhancedBookApiService } from "@/lib/bookApiService";
import { format } from 'date-fns';

interface ProjectSummary {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_credits_used: number;
  last_activity: string;
}

interface ProjectData {
  usage_id: string;
  title: string;
  status: string;
  progress: number;
  current_chapter: number;
  total_chapters: number;
  created_at: string;
  updated_at: string;
  url_slug: string;
  can_resume: boolean;
  can_pause: boolean;
  can_cancel: boolean;
  credits_used: number;
  word_count: number;
  estimated_completion?: string;
  current_operation?: string;
  thumbnail?: string;
  tags?: string[];
  is_favorite?: boolean;
}

interface DashboardData {
  summary: ProjectSummary;
  recent_projects: ProjectData[];
  active_generations: ProjectData[];
  quick_stats: {
    avg_completion_time: string;
    success_rate: string;
    most_used_genre: string;
  };
  last_update: string;
  auto_refresh_interval: number;
}

interface EnhancedProjectDashboardProps {
  className?: string;
}

const EnhancedProjectDashboard: React.FC<EnhancedProjectDashboardProps> = ({ className = "" }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  // Auto-refresh functionality
  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh based on backend interval
    const interval = setInterval(() => {
      fetchDashboardData(true); // Silent refresh
    }, 30000); // 30 seconds as defined in backend

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = useCallback(async (silent: boolean = false) => {
    try {
      if (!silent) setLoading(true);
      setRefreshing(true);

      const data = await EnhancedBookApiService.getRealTimeDashboard();
      
      const enhancedData: DashboardData = {
        summary: data.summary,
        recent_projects: data.recent_projects || [],
        active_generations: data.active_generations || [],
        quick_stats: data.quick_stats || {
          avg_completion_time: "22 minutes",
          success_rate: "94%",
          most_used_genre: "educational"
        },
        last_update: data.last_update,
        auto_refresh_interval: data.auto_refresh_interval || 30
      };

      setDashboardData(enhancedData);
    } catch (error: any) {
      console.error('Dashboard fetch error:', error);
      if (!silent) {
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  const handleProjectAction = async (projectId: string, action: string) => {
    try {
      switch (action) {
        case 'pause':
          await EnhancedBookApiService.pauseGeneration(projectId);
          toast({
            title: "Paused",
            description: "Generation paused successfully",
          });
          break;
          
        case 'resume':
          navigate(`/book-generation/${getProjectSlug(projectId)}?action=resume`);
          break;
          
        case 'view':
          navigate(`/book-generation/${getProjectSlug(projectId)}`);
          break;
          
        case 'download':
          await EnhancedBookApiService.downloadBookPDF(projectId);
          break;
          
        case 'duplicate':
          const duplicateData = await EnhancedBookApiService.getDuplicateSettings(projectId);
          navigate('/ai-studio/long-form-book', { 
            state: { duplicateSettings: duplicateData.settings } 
          });
          break;
          
        case 'cancel':
          await EnhancedBookApiService.cancelGeneration(projectId);
          toast({
            title: "Cancelled",
            description: "Generation cancelled successfully",
          });
          break;
      }
      
      // Refresh data after action
      fetchDashboardData(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} project`,
        variant: "destructive"
      });
    }
  };

  const getProjectSlug = (projectId: string): string => {
    const project = [...(dashboardData?.recent_projects || []), ...(dashboardData?.active_generations || [])]
      .find(p => p.usage_id === projectId);
    return project?.url_slug || `book-${projectId.slice(0, 8)}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      default:
        return <Book className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredProjects = React.useMemo(() => {
    let projects = dashboardData?.recent_projects || [];
    
    // Filter by status
    if (statusFilter !== 'all') {
      projects = projects.filter(p => p.status === statusFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
      projects = projects.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort projects
    projects = [...projects].sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'name':
          return a.title.localeCompare(b.title);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'progress':
          return b.progress - a.progress;
        default:
          return 0;
      }
    });
    
    return projects;
  }, [dashboardData?.recent_projects, statusFilter, searchTerm, sortBy]);

  const ProjectCard: React.FC<{ project: ProjectData; showActions?: boolean }> = ({ 
    project, 
    showActions = true 
  }) => (
    <Card className="hover:shadow-md transition-all cursor-pointer">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getStatusIcon(project.status)}
                <h3 className="font-medium truncate">{project.title}</h3>
                {project.is_favorite && (
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Updated {format(new Date(project.updated_at), 'MMM dd, HH:mm')}
              </p>
            </div>
            <Badge className={`text-xs ${getStatusColor(project.status)}`}>
              {project.status}
            </Badge>
          </div>

          {/* Progress */}
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
            </div>
          )}

          {/* Stats */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{project.credits_used} credits</span>
            {project.current_chapter && project.total_chapters && (
              <span>Ch {project.current_chapter}/{project.total_chapters}</span>
            )}
            {project.word_count && (
              <span>{project.word_count.toLocaleString()} words</span>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex gap-1 pt-2 border-t">
              {project.status === 'processing' && project.can_pause && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProjectAction(project.usage_id, 'pause');
                  }}
                >
                  <Pause className="h-3 w-3 mr-1" />
                  Pause
                </Button>
              )}
              
              {project.status === 'pending' && project.can_resume && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProjectAction(project.usage_id, 'resume');
                  }}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Resume
                </Button>
              )}
              
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleProjectAction(project.usage_id, 'view');
                }}
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              
              {project.status === 'completed' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProjectAction(project.usage_id, 'download');
                  }}
                >
                  <Download className="h-3 w-3 mr-1" />
                  PDF
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load dashboard data. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Project Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and monitor your AI book generation projects
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchDashboardData()}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => navigate('/ai-studio/long-form-book')}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Book className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold">{dashboardData.summary.total_projects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{dashboardData.summary.active_projects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{dashboardData.summary.completed_projects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Credits Used</p>
                <p className="text-2xl font-bold">{dashboardData.summary.total_credits_used}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Generations */}
      {dashboardData.active_generations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Active Generations ({dashboardData.active_generations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.active_generations.map((project) => (
                <ProjectCard key={project.usage_id} project={project} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList>
          <TabsTrigger value="projects">All Projects</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="projects" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="progress">Progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.usage_id} project={project} />
            ))}
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your filters or search terms.'
                  : 'Create your first AI book project to get started.'}
              </p>
              <Button onClick={() => navigate('/ai-studio/long-form-book')}>
              <Button onClick={() => navigate('/text/long-form-book')}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Project
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Quick Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {dashboardData.quick_stats.avg_completion_time}
                  </p>
                  <p className="text-sm text-muted-foreground">Avg. Completion Time</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {dashboardData.quick_stats.success_rate}
                  </p>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {dashboardData.quick_stats.most_used_genre}
                  </p>
                  <p className="text-sm text-muted-foreground">Most Used Genre</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-refresh</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically refresh dashboard every {dashboardData.auto_refresh_interval} seconds
                    </p>
                  </div>
                  <Badge variant="outline">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Last Updated</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(dashboardData.last_update), 'PPpp')}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => fetchDashboardData()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedProjectDashboard;
