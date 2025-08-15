import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Book,
  Plus,
  Play,
  Pause,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Eye,
  RefreshCw,
  Loader2,
  CreditCard,
  MoreVertical
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

interface Project {
  usage_id: string;
  project_uuid: string;
  url_slug: string;
  project_title: string;
  status: string;
  progress: number;
  created_at: string;
  last_accessed: string;
  credits_used: number;
  can_resume: boolean;
  has_output: boolean;
  is_favorite: boolean;
  tags: string[];
}

interface DashboardData {
  projects: Project[];
  summary: {
    total_projects: number;
    active_projects: number;
    completed_projects: number;
    total_credits_used: number;
  };
  user_credits: number;
}

const BookProjects: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProjects = async () => {
    try {
      setRefreshing(true);
      
      // Get projects from your enhanced backend endpoint
      const response = await fetch('/api/ai/usage/projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch projects');

      const result = await response.json();

      if (result.success) {
        setData({
          projects: result.data.projects || [],
          summary: {
            total_projects: result.data.projects?.length || 0,
            active_projects: result.data.projects?.filter((p: Project) => p.status === 'processing').length || 0,
            completed_projects: result.data.projects?.filter((p: Project) => p.status === 'completed').length || 0,
            total_credits_used: result.data.projects?.reduce((sum: number, p: Project) => sum + p.credits_used, 0) || 0,
          },
          user_credits: 150 // You'd get this from user endpoint
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch projects:', error);
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

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleProjectClick = (project: Project) => {
    const isProcessing = project.status === 'processing' || 
                        project.status === 'generating' || 
                        (project.progress && project.progress < 100);

    if (isProcessing) {
      // Navigate to live generation view
      navigate(`/text/long-form-book/${project.url_slug}?view=live`);
    } else if (project.status === 'completed') {
      // Navigate to completed book view
      navigate(`/text/long-form-book/${project.url_slug}`);
    } else if (project.can_resume) {
      // Navigate to resume generation
      navigate(`/text/long-form-book/${project.url_slug}?action=resume`);
    } else {
      // Default view
      navigate(`/text/long-form-book/${project.url_slug}`);
    }
  };

  const handleDownloadPDF = async (project: Project, e: React.MouseEvent) => {
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
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Book Projects</h1>
            <p className="text-muted-foreground">
              Manage your AI-generated books with unique URLs
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{data?.user_credits || 0}</span> credits available
            </div>
            <Button 
              variant="outline" 
              onClick={fetchProjects}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => navigate('/ai-studio/long-form-book')}>
              <Plus className="h-4 w-4 mr-2" />
              New Book
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Book className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Books</p>
                    <p className="text-2xl font-bold">{data.summary.total_projects}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-orange-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold">{data.summary.active_projects}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">{data.summary.completed_projects}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CreditCard className="h-8 w-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Credits Used</p>
                    <p className="text-2xl font-bold">{data.summary.total_credits_used}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Projects List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {data && data.projects.length > 0 ? (
              <div className="space-y-4">
                {data.projects.map((project) => (
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
                        
                        {project.can_resume && (
                          <Button size="sm" variant="outline" onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/text/long-form-book/${project.url_slug}?action=resume`);
                          }}>
                            <Play className="h-4 w-4 mr-1" />
                            Resume
                          </Button>
                        )}
                        
                        {project.status === 'completed' && (
                          <Button size="sm" variant="outline" onClick={(e) => handleDownloadPDF(project, e)}>
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
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
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How to use your unique URLs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-medium mb-2">📚 Each book gets a unique URL</h4>
                <p className="text-muted-foreground">
                  Like <code>/text/long-form-book/my-book-abc123</code> that you can bookmark and share
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">🔄 Refresh-safe generation</h4>
                <p className="text-muted-foreground">
                  You can refresh the page during generation without losing progress
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">👀 Live watching</h4>
                <p className="text-muted-foreground">
                  Watch your book being generated in real-time with streaming updates
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default BookProjects;
