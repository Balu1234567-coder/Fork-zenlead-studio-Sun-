import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  Edit,
  Trash2,
  Star,
  Copy,
  Share2,
  MoreVertical,
  RefreshCw,
  Plus,
  Archive,
  RotateCcw,
  ExternalLink,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EnhancedBookApiService } from "@/lib/bookApiService";
import { format } from 'date-fns';

interface Project {
  usage_id: string;
  project_uuid: string;
  url_slug: string;
  unique_url: string;
  project_title: string;
  status: string;
  progress: number;
  created_at: string;
  last_accessed: string;
  completed_at?: string;
  credits_used: number;
  can_resume: boolean;
  has_output: boolean;
  is_favorite: boolean;
  tags: string[];
  is_deleted: boolean;
  deleted_at?: string;
}

interface ProjectManagerProps {
  className?: string;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ className = "" }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newTags, setNewTags] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async (includeDeleted: boolean = false) => {
    try {
      setRefreshing(true);
      
      // Call the enhanced projects endpoint
      const response = await fetch(`/api/ai/usage/projects?include_deleted=${includeDeleted}&limit=50`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to load projects');
      
      const result = await response.json();
      
      if (result.success) {
        setProjects(result.data.projects);
      }
    } catch (error: any) {
      console.error('Project loading error:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleProjectAction = async (project: Project, action: string) => {
    try {
      switch (action) {
        case 'view':
          navigate(`/${project.url_slug}`);
          break;
          
        case 'view_live':
          navigate(`/${project.url_slug}?view=live`);
          break;
          
        case 'resume':
          navigate(`/${project.url_slug}?action=resume`);
          break;
          
        case 'pause':
          await EnhancedBookApiService.pauseGeneration(project.usage_id);
          toast({
            title: "Paused",
            description: "Generation paused successfully",
          });
          loadProjects();
          break;
          
        case 'download':
          await EnhancedBookApiService.downloadBookPDF(project.usage_id);
          break;
          
        case 'duplicate':
          const duplicateData = await EnhancedBookApiService.getDuplicateSettings(project.usage_id);
          navigate('/ai-studio/long-form-book', { 
            state: { duplicateSettings: duplicateData.settings } 
          });
          break;
          
        case 'favorite':
          await updateProjectMetadata(project.usage_id, { is_favorite: !project.is_favorite });
          break;
          
        case 'delete':
          await deleteProject(project.usage_id, false);
          break;
          
        case 'delete_permanent':
          await deleteProject(project.usage_id, true);
          break;
          
        case 'restore':
          await restoreProject(project.usage_id);
          break;
          
        case 'share':
          const shareUrl = `${window.location.origin}/${project.url_slug}`;
          await navigator.clipboard.writeText(shareUrl);
          toast({
            title: "Link Copied",
            description: "Shareable project link copied to clipboard",
          });
          break;
          
        case 'copy_uuid':
          await navigator.clipboard.writeText(project.project_uuid);
          toast({
            title: "UUID Copied",
            description: "Project UUID copied to clipboard",
          });
          break;
          
        default:
          break;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} project`,
        variant: "destructive"
      });
    }
  };

  const updateProjectMetadata = async (usageId: string, updates: any) => {
    try {
      const response = await fetch(`/api/ai/usage/project/${usageId}/metadata`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Failed to update project');
      
      const result = await response.json();
      if (result.success) {
        toast({
          title: "Updated",
          description: "Project updated successfully",
        });
        loadProjects();
      }
    } catch (error: any) {
      throw error;
    }
  };

  const deleteProject = async (usageId: string, permanent: boolean) => {
    try {
      const response = await fetch(`/api/ai/usage/project/${usageId}?permanent=${permanent}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to delete project');
      
      const result = await response.json();
      if (result.success) {
        toast({
          title: permanent ? "Deleted Permanently" : "Moved to Trash",
          description: result.message,
        });
        loadProjects(activeTab === 'deleted');
      }
    } catch (error: any) {
      throw error;
    }
  };

  const restoreProject = async (usageId: string) => {
    try {
      const response = await fetch(`/api/ai/usage/project/${usageId}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to restore project');
      
      const result = await response.json();
      if (result.success) {
        toast({
          title: "Restored",
          description: result.message,
        });
        loadProjects();
      }
    } catch (error: any) {
      throw error;
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setNewTitle(project.project_title);
    setNewTags(project.tags.join(', '));
  };

  const saveProjectEdit = async () => {
    if (!editingProject) return;

    try {
      const updates = {
        project_title: newTitle,
        tags: newTags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      await updateProjectMetadata(editingProject.usage_id, updates);
      setEditingProject(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive"
      });
    }
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

  const filterProjects = (projects: Project[], tab: string) => {
    switch (tab) {
      case 'active':
        return projects.filter(p => !p.is_deleted && ['processing', 'pending'].includes(p.status));
      case 'completed':
        return projects.filter(p => !p.is_deleted && p.status === 'completed');
      case 'favorites':
        return projects.filter(p => !p.is_deleted && p.is_favorite);
      case 'deleted':
        return projects.filter(p => p.is_deleted);
      default:
        return projects.filter(p => !p.is_deleted);
    }
  };

  const ProjectCard: React.FC<{ project: Project; showRestore?: boolean }> = ({ 
    project, 
    showRestore = false 
  }) => (
    <Card className="hover:shadow-md transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(project.status)}
              <h3 className="font-medium truncate cursor-pointer hover:text-primary" 
                  onClick={() => handleProjectAction(project, 'view')}>
                {project.project_title}
              </h3>
              {project.is_favorite && (
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Created {format(new Date(project.created_at), 'MMM dd, yyyy')}</span>
              <span>•</span>
              <span>{project.credits_used} credits</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`text-xs ${getStatusColor(project.status)}`}>
              {project.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!showRestore ? (
                  <>
                    <DropdownMenuItem onClick={() => handleProjectAction(project, 'view')}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Project
                    </DropdownMenuItem>
                    
                    {project.status === 'processing' && (
                      <>
                        <DropdownMenuItem onClick={() => handleProjectAction(project, 'view_live')}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Live
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleProjectAction(project, 'pause')}>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    {project.can_resume && (
                      <DropdownMenuItem onClick={() => handleProjectAction(project, 'resume')}>
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </DropdownMenuItem>
                    )}
                    
                    {project.has_output && (
                      <DropdownMenuItem onClick={() => handleProjectAction(project, 'download')}>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem onClick={() => handleProjectAction(project, 'duplicate')}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => handleProjectAction(project, 'share')}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Link
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => handleEditProject(project)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => handleProjectAction(project, 'favorite')}>
                      <Star className={`h-4 w-4 mr-2 ${project.is_favorite ? 'fill-current' : ''}`} />
                      {project.is_favorite ? 'Remove Favorite' : 'Add Favorite'}
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => handleProjectAction(project, 'delete')}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Move to Trash
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => handleProjectAction(project, 'restore')}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleProjectAction(project, 'delete_permanent')}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Permanently
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {project.status === 'processing' && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>
        )}

        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            <strong>URL:</strong> /{project.url_slug}
          </div>
          
          {project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          
          {showRestore && project.deleted_at && (
            <div className="text-xs text-red-600">
              Deleted {format(new Date(project.deleted_at), 'MMM dd, yyyy')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  useEffect(() => {
    if (activeTab === 'deleted') {
      loadProjects(true);
    } else {
      loadProjects(false);
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const filteredProjects = filterProjects(projects, activeTab);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Project Manager</h2>
          <p className="text-muted-foreground">
            Manage your book generation projects with unique URLs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => loadProjects(activeTab === 'deleted')}
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
          <TabsTrigger value="all">All Projects</TabsTrigger>
          <TabsTrigger value="deleted">Trash</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Projects Found</h3>
              <p className="text-muted-foreground mb-6">
                {activeTab === 'deleted' 
                  ? 'No deleted projects to restore.'
                  : `No ${activeTab} projects found. Create your first project to get started.`}
              </p>
              {activeTab !== 'deleted' && (
                <Button onClick={() => navigate('/ai-studio/long-form-book')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard 
                  key={project.usage_id} 
                  project={project} 
                  showRestore={activeTab === 'deleted'}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Project Dialog */}
      <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Project Title</Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter project title"
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="e.g., business, education, fiction"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveProjectEdit} className="flex-1">
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setEditingProject(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectManager;
