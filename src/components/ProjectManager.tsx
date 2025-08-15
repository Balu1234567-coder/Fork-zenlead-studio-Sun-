import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Book,
  Trash2,
  RotateCcw,
  Star,
  StarOff,
  RefreshCw,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

interface Project {
  usage_id: string;
  project_title: string;
  url_slug: string;
  status: string;
  created_at: string;
  is_favorite: boolean;
  is_deleted: boolean;
  deleted_at?: string;
  credits_used: number;
}

const ProjectManager: React.FC = () => {
  const { toast } = useToast();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [deletedProjects, setDeletedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      // Fetch regular projects
      const response = await fetch('/api/ai/usage/projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const allProjects = result.data.projects || [];
          setProjects(allProjects.filter((p: Project) => !p.is_deleted));
          setDeletedProjects(allProjects.filter((p: Project) => p.is_deleted));
        }
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (projectId: string, isFavorite: boolean) => {
    try {
      const response = await fetch(`/api/ai/usage/project/${projectId}/metadata`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_favorite: !isFavorite
        })
      });

      if (response.ok) {
        toast({
          title: isFavorite ? "Removed from favorites" : "Added to favorites",
          description: "Project updated successfully",
        });
        fetchProjects();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/ai/usage/project/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: "Project deleted",
          description: "Project moved to trash. You can restore it if needed.",
        });
        fetchProjects();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive"
      });
    }
  };

  const handleRestoreProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/ai/usage/project/${projectId}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: "Project restored",
          description: "Project has been restored successfully",
        });
        fetchProjects();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restore project",
        variant: "destructive"
      });
    }
  };

  const ProjectCard: React.FC<{ project: Project; isDeleted?: boolean }> = ({ project, isDeleted = false }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Book className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{project.project_title}</h3>
              <p className="text-sm text-muted-foreground">
                {isDeleted ? 'Deleted' : 'Created'} {format(new Date(isDeleted ? project.deleted_at! : project.created_at), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
              {project.status}
            </Badge>
            
            <div className="text-sm text-muted-foreground">
              {project.credits_used} credits
            </div>

            {!isDeleted && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleToggleFavorite(project.usage_id, project.is_favorite)}
              >
                {project.is_favorite ? (
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ) : (
                  <StarOff className="h-4 w-4" />
                )}
              </Button>
            )}

            {isDeleted ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRestoreProject(project.usage_id)}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Restore
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDeleteProject(project.usage_id)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Project Manager</h2>
          <p className="text-muted-foreground">
            Manage your book projects, favorites, and deleted items
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchProjects}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant={showDeleted ? "default" : "outline"}
            onClick={() => setShowDeleted(!showDeleted)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {showDeleted ? 'Hide' : 'Show'} Deleted ({deletedProjects.length})
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{projects.length}</p>
              <p className="text-sm text-muted-foreground">Active Projects</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{projects.filter(p => p.is_favorite).length}</p>
              <p className="text-sm text-muted-foreground">Favorites</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{deletedProjects.length}</p>
              <p className="text-sm text-muted-foreground">In Trash</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      {showDeleted ? (
        <div>
          <h3 className="text-lg font-semibold mb-4">Deleted Projects</h3>
          {deletedProjects.length > 0 ? (
            <div className="space-y-4">
              {deletedProjects.map((project) => (
                <ProjectCard key={project.usage_id} project={project} isDeleted />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Trash2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No deleted projects</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div>
          <h3 className="text-lg font-semibold mb-4">Active Projects</h3>
          {projects.length > 0 ? (
            <div className="space-y-4">
              {projects.map((project) => (
                <ProjectCard key={project.usage_id} project={project} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No active projects</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Info */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Deleted projects are kept in trash for 30 days before permanent deletion.
          You can restore them anytime during this period.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ProjectManager;
