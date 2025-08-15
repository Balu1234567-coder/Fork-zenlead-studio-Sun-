import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Book,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Eye,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

interface Project {
  usage_id: string;
  project_title: string;
  url_slug: string;
  status: string;
  progress: number;
  created_at: string;
  can_resume: boolean;
  has_output: boolean;
  credits_used: number;
}

interface EnhancedProjectDashboardProps {
  className?: string;
}

const EnhancedProjectDashboard: React.FC<EnhancedProjectDashboardProps> = ({ className = "" }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/ai/usage/projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setProjects(result.data.projects || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (project: Project) => {
    if (project.status === 'processing') {
      navigate(`/text/long-form-book/${project.url_slug}?view=live`);
    } else {
      navigate(`/text/long-form-book/${project.url_slug}`);
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
      default:
        return <Book className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-32 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Book className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No books yet</h3>
        <p className="text-muted-foreground mb-6">
          Create your first AI-generated book to get started
        </p>
        <Button onClick={() => navigate('/ai-studio/long-form-book')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Your First Book
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {projects.map((project) => (
        <div
          key={project.usage_id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
          onClick={() => handleProjectClick(project)}
        >
          <div className="flex items-center space-x-4 flex-1">
            <div className="flex items-center gap-2">
              {getStatusIcon(project.status)}
              <div>
                <h3 className="font-medium">{project.project_title}</h3>
                <p className="text-sm text-muted-foreground">
                  Created {format(new Date(project.created_at), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {project.status === 'processing' && (
              <div className="flex items-center space-x-2">
                <Progress value={project.progress} className="w-20" />
                <span className="text-sm text-muted-foreground">{project.progress}%</span>
              </div>
            )}

            <Badge className={`${getStatusColor(project.status)} border-0`}>
              {project.status}
            </Badge>

            <div className="text-sm text-muted-foreground">
              {project.credits_used} credits
            </div>

            <div className="flex items-center gap-2">
              {project.status === 'processing' && (
                <Button size="sm" variant="outline" onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/text/long-form-book/${project.url_slug}?view=live`);
                }}>
                  <Eye className="h-4 w-4 mr-1" />
                  Watch
                </Button>
              )}
              
              {project.status === 'completed' && (
                <Button size="sm" variant="outline" onClick={async (e) => {
                  e.stopPropagation();
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
                        link.download = result.data.filename || `${project.project_title}.pdf`;
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
                }}>
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EnhancedProjectDashboard;
