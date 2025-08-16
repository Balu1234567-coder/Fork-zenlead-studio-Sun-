import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  RefreshCw,
  MoreVertical,
  Eye,
  Copy,
  Trash2,
  Download,
  StopCircle,
  Loader2,
  Book,
  Image,
  Video,
  AudioWaveform,
  FileText,
  CheckCircle,
  XCircle,
  Ban,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import ProjectApiService, { ProjectSummary } from '@/lib/projectApiService';

interface ProjectSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

// Icon mapping for project types
const projectIcons = {
  'long-form-book': Book,
  'image-generation': Image,
  'video-generation': Video,
  'audio-processing': AudioWaveform,
  'text-processing': FileText,
};

// Icon mapping for status
const statusIcons = {
  'pending': Clock,
  'processing': Loader2,
  'completed': CheckCircle,
  'failed': XCircle,
  'cancelled': Ban,
};

// Status colors
const statusColors = {
  'pending': 'text-yellow-600 bg-yellow-50',
  'processing': 'text-blue-600 bg-blue-50',
  'completed': 'text-green-600 bg-green-50',
  'failed': 'text-red-600 bg-red-50',
  'cancelled': 'text-gray-600 bg-gray-50',
};

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ isCollapsed = false, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [projectsByType, setProjectsByType] = useState<Record<string, ProjectSummary[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(['long-form-book']));
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Update active project based on current URL
  useEffect(() => {
    const path = location.pathname;
    let currentProjectId = null;

    // Extract project ID from URL
    if (path.includes('/ai/') && path.includes('/project/')) {
      const parts = path.split('/project/');
      if (parts.length > 1) {
        currentProjectId = parts[1].split('/')[0];
      }
    }

    setActiveProjectId(currentProjectId);
  }, [location.pathname]);

  // Poll processing projects every 10 seconds
  useEffect(() => {
    if (projects.some(p => p.status === 'processing')) {
      const interval = setInterval(() => {
        refreshProcessingProjects();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [projects]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await ProjectApiService.getAllProjects();
      setProjects(data.projects);
      setProjectsByType(data.projects_by_type);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshProcessingProjects = async () => {
    try {
      const processingProjects = await ProjectApiService.getProcessingProjects();
      
      // Update only processing projects to avoid overwriting other changes
      setProjects(prev => {
        const updated = [...prev];
        processingProjects.forEach(processProject => {
          const index = updated.findIndex(p => p.usage_id === processProject.usage_id);
          if (index !== -1) {
            updated[index] = processProject;
          }
        });
        return updated;
      });
    } catch (error) {
      console.error('Failed to refresh processing projects:', error);
    }
  };

  const handleProjectClick = (project: ProjectSummary) => {
    const url = `/ai/${project.project_type}/project/${project.usage_id}`;
    navigate(url);
  };

  const handleProjectAction = async (action: string, project: ProjectSummary) => {
    try {
      switch (action) {
        case 'view':
          handleProjectClick(project);
          break;
          
        case 'download':
          if (project.project_type === 'long-form-book') {
            const pdfData = await ProjectApiService.downloadBookPDF(project.usage_id);
            
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
          const duplicateData = await ProjectApiService.duplicateProject(project.usage_id, project.project_type);
          toast({
            title: "Success",
            description: "Project settings retrieved for duplication"
          });
          // You can navigate to creation page with these settings
          break;
          
        case 'cancel':
          await ProjectApiService.cancelProject(project.usage_id, project.project_type);
          toast({
            title: "Success",
            description: "Project cancelled successfully"
          });
          loadProjects(); // Refresh to show updated status
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

  const toggleTypeExpansion = (type: string) => {
    setExpandedTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.project_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProjectsByType = Object.entries(projectsByType).reduce((acc, [type, typeProjects]) => {
    const filtered = typeProjects.filter(project =>
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.project_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[type] = filtered;
    }
    return acc;
  }, {} as Record<string, ProjectSummary[]>);

  const ProjectItem: React.FC<{ project: ProjectSummary }> = ({ project }) => {
    const StatusIcon = statusIcons[project.status] || AlertCircle;
    const isActive = activeProjectId === project.usage_id;
    const isProcessing = project.status === 'processing';

    return (
      <div 
        className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-accent/50 ${
          isActive ? 'bg-accent border border-border shadow-sm' : ''
        }`}
        onClick={() => handleProjectClick(project)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate">{project.title}</h4>
            <Badge variant="outline" className={`text-xs ${statusColors[project.status]}`}>
              <StatusIcon className={`w-3 h-3 mr-1 ${isProcessing ? 'animate-spin' : ''}`} />
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </Badge>
          </div>
          
          {project.subtitle && (
            <p className="text-xs text-muted-foreground truncate">
              {project.subtitle}
            </p>
          )}
          
          <p className="text-xs text-muted-foreground">
            {new Date(project.created_at).toLocaleDateString()}
          </p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleProjectAction('view', project)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            
            {project.status === 'completed' && project.has_results && (
              <DropdownMenuItem onClick={() => handleProjectAction('download', project)}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem onClick={() => handleProjectAction('duplicate', project)}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            
            {(project.status === 'processing' || project.status === 'pending') && (
              <DropdownMenuItem onClick={() => handleProjectAction('cancel', project)}>
                <StopCircle className="h-4 w-4 mr-2" />
                Cancel
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <div className="w-12 border-r bg-background flex flex-col items-center py-4 space-y-2">
        {Object.keys(filteredProjectsByType).map(type => {
          const Icon = projectIcons[type as keyof typeof projectIcons] || FileText;
          const processingCount = projectsByType[type]?.filter(p => p.status === 'processing').length || 0;
          
          return (
            <div key={type} className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onToggle?.()}
              >
                <Icon className="h-4 w-4" />
              </Button>
              {processingCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-blue-600 text-white"
                >
                  {processingCount}
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-80 border-r bg-background flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Projects</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadProjects}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      
      {/* Projects List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : Object.keys(filteredProjectsByType).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No projects found</p>
            </div>
          ) : (
            <>
              {Object.entries(filteredProjectsByType).map(([type, typeProjects]) => {
                const Icon = projectIcons[type as keyof typeof projectIcons] || FileText;
                const isExpanded = expandedTypes.has(type);
                const processingCount = typeProjects.filter(p => p.status === 'processing').length;
                
                return (
                  <div key={type} className="space-y-1">
                    <Button
                      variant="ghost"
                      onClick={() => toggleTypeExpansion(type)}
                      className="w-full justify-start p-2 h-auto"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                      <Icon className="w-4 h-4 mr-2" />
                      <span className="font-medium">
                        {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </span>
                      <Badge variant="secondary" className="ml-auto">
                        {typeProjects.length}
                      </Badge>
                      {processingCount > 0 && (
                        <Badge variant="secondary" className="ml-1 bg-blue-600 text-white">
                          {processingCount} processing
                        </Badge>
                      )}
                    </Button>
                    
                    {isExpanded && (
                      <div className="ml-4 space-y-1">
                        {typeProjects.map(project => (
                          <ProjectItem key={project.usage_id} project={project} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ProjectSidebar;
