import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Book, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Plus,
  ArrowRight,
  Loader2,
  TrendingUp,
  CreditCard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuickStats {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_credits_used: number;
  last_activity: string;
}

interface ActiveProject {
  usage_id: string;
  title: string;
  status: string;
  progress: number;
  url_slug: string;
  estimated_completion?: string;
  current_operation?: string;
}

interface DashboardData {
  summary: QuickStats;
  active_generations: ActiveProject[];
  recent_projects: ActiveProject[];
  quick_stats: {
    avg_completion_time: string;
    success_rate: string;
    most_used_genre: string;
  };
}

const QuickDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/ai/long-form-book/dashboard/real-time', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDashboardData(result.data);
        }
      }
    } catch (error) {
      console.warn('Dashboard fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (project: ActiveProject) => {
    if (project.status === 'processing') {
      navigate(`/book-generation/${project.url_slug}?view=live`);
    } else {
      navigate(`/book-generation/${project.url_slug}`);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Book className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Books</p>
                <p className="text-xl font-bold">{dashboardData?.summary.total_projects || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-xl font-bold">{dashboardData?.summary.active_projects || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-xl font-bold">{dashboardData?.summary.completed_projects || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Credits Used</p>
                <p className="text-xl font-bold">{dashboardData?.summary.total_credits_used || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Generations */}
      {dashboardData?.active_generations && dashboardData.active_generations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              Active Generations ({dashboardData.active_generations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.active_generations.map((project) => (
                <div 
                  key={project.usage_id}
                  className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                  onClick={() => handleProjectClick(project)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{project.title}</h4>
                      <Badge variant="secondary">{project.status}</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
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
                  </div>
                  <Button variant="outline" size="sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            className="w-full justify-start" 
            onClick={() => navigate('/ai-studio/long-form-book')}
            onClick={() => navigate('/text/long-form-book')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Generate New Book
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => navigate('/text')}
          >
            <Book className="h-4 w-4 mr-2" />
            Text Studio
          </Button>
          {dashboardData?.quick_stats && (
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3">Your Stats</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Avg. Completion:</span>
                  <span>{dashboardData.quick_stats.avg_completion_time}</span>
                </div>
                <div className="flex justify-between">
                  <span>Success Rate:</span>
                  <span>{dashboardData.quick_stats.success_rate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Most Used Genre:</span>
                  <span className="capitalize">{dashboardData.quick_stats.most_used_genre}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Projects */}
      {dashboardData?.recent_projects && dashboardData.recent_projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Projects</span>
              <Button variant="ghost" size="sm" onClick={() => navigate('/book-projects')}>
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.recent_projects.slice(0, 5).map((project) => (
                <div 
                  key={project.usage_id}
                  className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-muted/30"
                  onClick={() => handleProjectClick(project)}
                >
                  <div className="flex items-center gap-3">
                    {project.status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : project.status === 'processing' ? (
                      <Clock className="h-4 w-4 text-blue-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{project.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{project.status}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuickDashboard;
