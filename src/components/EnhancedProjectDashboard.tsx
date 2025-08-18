import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Book, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Plus,
  ArrowRight,
  Loader2,
  TrendingUp,
  CreditCard,
  Filter,
  Search,
  Users,
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QuickDashboard from './QuickDashboard';
import ProjectTemplateSelector from './ProjectTemplateSelector';

interface ProjectData {
  usage_id: string;
  title: string;
  status: string;
  progress: number;
  url_slug: string;
  created_at: string;
  updated_at: string;
  genre?: string;
  credits_used?: number;
  estimated_completion?: string;
  current_operation?: string;
}

interface DashboardStats {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  failed_projects: number;
  total_credits_used: number;
  avg_completion_time: string;
  success_rate: string;
}

const EnhancedProjectDashboard: React.FC = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch projects and stats
      const [projectsResponse, statsResponse] = await Promise.all([
        fetch('/api/ai/projects', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/ai/long-form-book/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (projectsResponse.ok) {
        const projectsResult = await projectsResponse.json();
        if (projectsResult.success) {
          setProjects(projectsResult.data?.projects || []);
        }
      }

      if (statsResponse.ok) {
        const statsResult = await statsResponse.json();
        if (statsResult.success) {
          setStats(statsResult.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesGenre = genreFilter === 'all' || project.genre === genreFilter;
    return matchesSearch && matchesStatus && matchesGenre;
  });

  const handleProjectClick = (project: ProjectData) => {
    navigate(`/book-generation/${project.url_slug}`);
  };

  const handleTemplateSelect = (settings: any) => {
    navigate('/text/long-form-book', { state: { templateSettings: settings } });
  };

  const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; color: string }> = 
    ({ title, value, icon, color }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-lg ${color}`}>
            {icon}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ProjectCard: React.FC<{ project: ProjectData }> = ({ project }) => (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleProjectClick(project)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">{project.title}</h3>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={
                project.status === 'completed' ? 'default' :
                project.status === 'processing' ? 'secondary' :
                project.status === 'failed' ? 'destructive' : 'outline'
              }>
                {project.status}
              </Badge>
              {project.genre && (
                <Badge variant="outline">{project.genre}</Badge>
              )}
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </div>
        
        {project.status === 'processing' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
            {project.current_operation && (
              <p className="text-xs text-muted-foreground">{project.current_operation}</p>
            )}
          </div>
        )}
        
        <div className="flex justify-between items-center text-sm text-muted-foreground mt-4">
          <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
          {project.credits_used && (
            <span className="flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              {project.credits_used} credits
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Project Dashboard</h1>
        <Button onClick={() => setShowTemplateSelector(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">All Projects</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <QuickDashboard />
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                title="Total Projects"
                value={stats.total_projects}
                icon={<Book className="h-6 w-6" />}
                color="bg-blue-100 text-blue-600"
              />
              <StatCard
                title="Active"
                value={stats.active_projects}
                icon={<Clock className="h-6 w-6" />}
                color="bg-orange-100 text-orange-600"
              />
              <StatCard
                title="Completed"
                value={stats.completed_projects}
                icon={<CheckCircle className="h-6 w-6" />}
                color="bg-green-100 text-green-600"
              />
              <StatCard
                title="Success Rate"
                value={stats.success_rate}
                icon={<TrendingUp className="h-6 w-6" />}
                color="bg-purple-100 text-purple-600"
              />
            </div>
          )}

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search projects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={genreFilter} onValueChange={setGenreFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genres</SelectItem>
                    <SelectItem value="fiction">Fiction</SelectItem>
                    <SelectItem value="non-fiction">Non-Fiction</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
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
            <Card>
              <CardContent className="p-12 text-center">
                <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Projects Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' || genreFilter !== 'all'
                    ? 'No projects match your current filters.'
                    : 'You haven\'t created any projects yet.'}
                </p>
                <Button onClick={() => setShowTemplateSelector(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Project
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics & Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {stats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{stats.avg_completion_time}</div>
                      <div className="text-sm text-muted-foreground">Avg. Completion Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{stats.total_credits_used}</div>
                      <div className="text-sm text-muted-foreground">Total Credits Used</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{stats.success_rate}</div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                    </div>
                  </div>
                )}
                <div className="text-center text-muted-foreground">
                  More detailed analytics coming soon...
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ProjectTemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelectTemplate={handleTemplateSelect}
        onCreateFromScratch={() => {
          setShowTemplateSelector(false);
          navigate('/text/long-form-book');
        }}
      />
    </div>
  );
};

export default EnhancedProjectDashboard;
